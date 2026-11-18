import "server-only";
import { env } from "@/server/env";
import { readdir, readFile, mkdir } from "node:fs/promises";
import path from "node:path";

export type Row = Record<string, unknown>;

/** Minimal SQL surface shared by PGlite (local) and postgres.js (Supabase). */
export interface Sql {
  query<T extends object = Row>(text: string, params?: unknown[]): Promise<T[]>;
}
/** Multi-statement script execution (migrations only, never with user input). */
interface ScriptSql extends Sql {
  exec(text: string): Promise<void>;
}
interface Driver extends ScriptSql {
  transaction<R>(fn: (tx: ScriptSql) => Promise<R>): Promise<R>;
}

const g = globalThis as unknown as { __lwDriver?: Promise<Driver> };

async function createPglite(): Promise<Driver> {
  const { PGlite } = await import("@electric-sql/pglite");
  const dir = env().LOCAL_DATA_DIR;
  const inMemory = dir === ":memory:";
  if (!inMemory) await mkdir(dir, { recursive: true });
  const db = new PGlite(inMemory ? undefined : path.join(dir, "pglite"));
  await db.waitReady;
  const wrap = (q: { query: typeof db.query; exec: typeof db.exec }): ScriptSql => ({
    async query<T extends object>(text: string, params: unknown[] = []) {
      const r = await q.query<T>(text, params);
      return r.rows;
    },
    async exec(text: string) {
      await q.exec(text);
    },
  });
  const driver: Driver = {
    ...wrap(db),
    transaction: (fn) => db.transaction((tx) => fn(wrap(tx))),
  };
  await migrate(driver, true);
  return driver;
}

async function createPostgres(): Promise<Driver> {
  const { default: postgres } = await import("postgres");
  const sql = postgres(env().DATABASE_URL!, { prepare: false, max: 5, idle_timeout: 20 });
  type Unsafe = { unsafe: (q: string, p?: never[]) => Promise<unknown> & { simple(): Promise<unknown> } };
  const wrap = (s: Unsafe): ScriptSql => ({
    async query<T extends object>(text: string, params: unknown[] = []) {
      return (await s.unsafe(text, params as never[])) as unknown as T[];
    },
    async exec(text: string) {
      await s.unsafe(text).simple();
    },
  });
  return {
    ...wrap(sql as unknown as Unsafe),
    transaction: (fn) => sql.begin((tx) => fn(wrap(tx as unknown as Unsafe))) as never,
  };
}

/** Applies supabase/migrations (and the local auth shim) once, tracked in a table. */
async function migrate(db: Driver, includeLocalShim: boolean) {
  const root = process.cwd();
  if (includeLocalShim) {
    await db.exec(await readFile(path.join(root, "supabase/local/00_auth_shim.sql"), "utf8"));
  }
  await db.query(`create table if not exists public._lw_migrations (name text primary key, applied_at timestamptz default now())`);
  const done = new Set((await db.query<{ name: string }>(`select name from public._lw_migrations`)).map((r) => r.name));
  const dir = path.join(root, "supabase/migrations");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
  for (const f of files) {
    if (done.has(f)) continue;
    const text = await readFile(path.join(dir, f), "utf8");
    await db.transaction(async (tx) => {
      await tx.exec(text);
      await tx.query(`insert into public._lw_migrations(name) values ($1)`, [f]);
    });
  }
}

function driver(): Promise<Driver> {
  if (!g.__lwDriver) {
    g.__lwDriver = (env().LABWISE_MODE === "local" ? createPglite() : createPostgres()).catch((e) => {
      g.__lwDriver = undefined;
      throw e;
    });
  }
  return g.__lwDriver;
}

/**
 * Run queries as a signed-in user. RLS is enforced by Postgres: we switch to the
 * `authenticated` role and set the JWT subject exactly like Supabase does.
 */
export async function asUser<R>(userId: string, fn: (sql: Sql) => Promise<R>): Promise<R> {
  if (!/^[0-9a-f-]{36}$/i.test(userId)) throw new Error("invalid user id");
  const d = await driver();
  return d.transaction(async (tx) => {
    await tx.query(`select set_config('request.jwt.claim.sub', $1, true), set_config('request.jwt.claims', $2, true)`, [
      userId,
      JSON.stringify({ sub: userId, role: "authenticated" }),
    ]);
    await tx.query(`set local role authenticated`);
    return fn(tx);
  });
}

/**
 * Privileged server-side access (payments, credits, rate limits, admin, deletes
 * of auth users). Never call with input that has not been authorised already.
 */
export async function asService<R>(fn: (sql: Sql) => Promise<R>): Promise<R> {
  const d = await driver();
  return d.transaction(fn);
}

/** For tests: drop the cached driver so a fresh in-memory DB is created. */
export function __resetDbForTests() {
  g.__lwDriver = undefined;
}
