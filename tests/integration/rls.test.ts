import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { asService, asUser } from "@/server/db/client";

const a = randomUUID();
const b = randomUUID();

beforeAll(async () => {
  await asService(async (sql) => {
    await sql.query(`insert into auth.users (id, email) values ($1, 'a@example.test'), ($2, 'b@example.test')`, [a, b]);
  });
  await asUser(a, (sql) => sql.query(`insert into public.people (user_id, name) values ($1, 'Synthetic A')`, [a]));
  await asUser(b, (sql) => sql.query(`insert into public.people (user_id, name) values ($1, 'Synthetic B')`, [b]));
});

describe("row level security", () => {
  it("users only see their own people", async () => {
    const rows = await asUser(a, (sql) => sql.query<{ name: string }>(`select name from public.people`));
    expect(rows.map((r) => r.name)).toEqual(["Synthetic A"]);
  });

  it("users cannot insert rows for someone else", async () => {
    await expect(asUser(a, (sql) => sql.query(`insert into public.people (user_id, name) values ($1, 'x')`, [b]))).rejects.toThrow();
  });

  it("users cannot update or delete someone else's rows", async () => {
    await asUser(a, (sql) => sql.query(`update public.people set name = 'hacked' where user_id = $1`, [b]));
    await asUser(a, (sql) => sql.query(`delete from public.people where user_id = $1`, [b]));
    const rows = await asUser(b, (sql) => sql.query<{ name: string }>(`select name from public.people`));
    expect(rows.map((r) => r.name)).toEqual(["Synthetic B"]);
  });

  it("users cannot grant themselves credits", async () => {
    await expect(asUser(a, (sql) => sql.query(`insert into public.credits (user_id, delta, reason) values ($1, 100, 'admin')`, [a]))).rejects.toThrow();
  });

  it("users cannot promote themselves to admin", async () => {
    await asUser(a, (sql) => sql.query(`insert into public.profiles (user_id) values ($1)`, [a]));
    await expect(asUser(a, (sql) => sql.query(`update public.profiles set role = 'admin' where user_id = $1`, [a]))).rejects.toThrow();
  });

  it("every public table has RLS enabled", async () => {
    const rows = await asService((sql) =>
      sql.query<{ relname: string }>(
        `select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
         where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity and c.relname <> '_lw_migrations'`,
      ),
    );
    expect(rows).toEqual([]);
  });
});
