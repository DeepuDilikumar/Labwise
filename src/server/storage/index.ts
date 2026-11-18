import "server-only";
import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { env, isLocal } from "@/server/env";

/**
 * Private file storage for uploaded originals.
 * - local: AES-256-GCM encrypted files on disk, HMAC-signed short-lived URLs.
 * - cloud: Supabase Storage private bucket (encrypted at rest), signed URLs.
 */
export interface FileStore {
  put(key: string, bytes: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<{ bytes: Buffer; contentType: string }>;
  remove(keys: string[]): Promise<void>;
  signedUrl(key: string, ttlSeconds?: number): Promise<string>;
}

export const fileKey = (userId: string, documentId: string, index: number, ext: string) =>
  `${userId}/${documentId}/${index}.${ext.replace(/[^a-z0-9]/gi, "")}`;

const safeKey = (k: string) => {
  if (!/^[0-9a-f-]{36}\/[0-9a-f-]{36}\/\d{1,2}\.[a-z0-9]{2,5}$/i.test(k)) throw new Error("bad key");
  return k;
};

// ---------- local ----------
const root = () => path.join(env().LOCAL_DATA_DIR === ":memory:" ? ".data-test" : env().LOCAL_DATA_DIR, "storage");
const encKey = () => Buffer.from(env().STORAGE_ENCRYPTION_KEY, "hex");

const localStore: FileStore = {
  async put(key, bytes, contentType) {
    const file = path.join(root(), safeKey(key));
    await mkdir(path.dirname(file), { recursive: true });
    const iv = randomBytes(12);
    const c = createCipheriv("aes-256-gcm", encKey(), iv);
    const meta = Buffer.from(contentType.padEnd(64).slice(0, 64));
    const body = Buffer.concat([c.update(Buffer.concat([meta, bytes])), c.final()]);
    await writeFile(file, Buffer.concat([iv, c.getAuthTag(), body]));
  },
  async get(key) {
    const raw = await readFile(path.join(root(), safeKey(key)));
    const d = createDecipheriv("aes-256-gcm", encKey(), raw.subarray(0, 12));
    d.setAuthTag(raw.subarray(12, 28));
    const plain = Buffer.concat([d.update(raw.subarray(28)), d.final()]);
    return { contentType: plain.subarray(0, 64).toString().trim(), bytes: plain.subarray(64) };
  },
  async remove(keys) {
    await Promise.all(keys.map((k) => rm(path.join(root(), safeKey(k)), { force: true })));
    // Remove now-empty document folders.
    const dirs = new Set(keys.map((k) => path.join(root(), path.dirname(safeKey(k)))));
    await Promise.all([...dirs].map((d) => rm(d, { recursive: true, force: true })));
  },
  async signedUrl(key, ttl = 300) {
    const exp = Math.floor(Date.now() / 1000) + ttl;
    return `/api/files?k=${encodeURIComponent(safeKey(key))}&e=${exp}&s=${sign(key, exp)}`;
  },
};

function sign(key: string, exp: number) {
  return createHmac("sha256", env().SESSION_SECRET).update(`${key}.${exp}`).digest("base64url");
}
export function verifySignedUrl(key: string, exp: number, sig: string): boolean {
  if (!Number.isFinite(exp) || exp < Date.now() / 1000) return false;
  const a = Buffer.from(sign(key, exp));
  const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}

// ---------- Supabase ----------
async function sb() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(env().NEXT_PUBLIC_SUPABASE_URL!, env().SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
}
const supabaseStore: FileStore = {
  async put(key, bytes, contentType) {
    const { error } = await (await sb()).storage.from(env().SUPABASE_STORAGE_BUCKET).upload(safeKey(key), bytes, { contentType, upsert: true });
    if (error) throw new Error("storage_put_failed");
  },
  async get(key) {
    const { data, error } = await (await sb()).storage.from(env().SUPABASE_STORAGE_BUCKET).download(safeKey(key));
    if (error || !data) throw new Error("storage_get_failed");
    return { bytes: Buffer.from(await data.arrayBuffer()), contentType: data.type };
  },
  async remove(keys) {
    if (!keys.length) return;
    const { error } = await (await sb()).storage.from(env().SUPABASE_STORAGE_BUCKET).remove(keys.map(safeKey));
    if (error) throw new Error("storage_remove_failed");
  },
  async signedUrl(key, ttl = 300) {
    const { data, error } = await (await sb()).storage.from(env().SUPABASE_STORAGE_BUCKET).createSignedUrl(safeKey(key), ttl);
    if (error || !data) throw new Error("storage_sign_failed");
    return data.signedUrl;
  },
};

export const fileStore = (): FileStore => (isLocal() ? localStore : supabaseStore);
