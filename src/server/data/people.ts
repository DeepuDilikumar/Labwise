import "server-only";
import { z } from "zod";
import { asUser } from "@/server/db/client";

export const RELATIONS = ["self", "mother", "father", "partner", "child", "sibling", "grandparent", "other"] as const;
export const COLORS = ["teal", "peach", "lilac", "sky", "sun", "lime"] as const;

export interface Person {
  id: string;
  name: string;
  relation: (typeof RELATIONS)[number];
  birth_year: number | null;
  sex: "female" | "male" | "other" | null;
  color: (typeof COLORS)[number];
  created_at: string;
}

export const personInput = z.object({
  name: z.string().trim().min(1).max(60),
  relation: z.enum(RELATIONS),
  birth_year: z.coerce.number().int().min(1900).max(new Date().getFullYear()).nullable().optional(),
  sex: z.enum(["female", "male", "other"]).nullable().optional(),
  color: z.enum(COLORS).optional(),
});
export type PersonInput = z.infer<typeof personInput>;

export async function listPeople(userId: string): Promise<Person[]> {
  return asUser(userId, (sql) =>
    sql.query<Person>(`select * from public.people order by (relation = 'self') desc, created_at asc`),
  );
}

export async function getPerson(userId: string, id: string): Promise<Person | null> {
  const rows = await asUser(userId, (sql) => sql.query<Person>(`select * from public.people where id = $1`, [id]));
  return rows[0] ?? null;
}

export async function createPerson(userId: string, input: PersonInput): Promise<Person> {
  const p = personInput.parse(input);
  const rows = await asUser(userId, async (sql) => {
    const count = (await sql.query<{ n: number }>(`select count(*)::int as n from public.people`))[0].n;
    if (count >= 12) throw new Error("people_limit");
    return sql.query<Person>(
      `insert into public.people (user_id, name, relation, birth_year, sex, color) values ($1,$2,$3,$4,$5,$6) returning *`,
      [userId, p.name, p.relation, p.birth_year ?? null, p.sex ?? null, p.color ?? COLORS[count % COLORS.length]],
    );
  });
  return rows[0];
}

export async function updatePerson(userId: string, id: string, input: PersonInput): Promise<void> {
  const p = personInput.parse(input);
  await asUser(userId, (sql) =>
    sql.query(`update public.people set name=$2, relation=$3, birth_year=$4, sex=$5 where id=$1`, [
      id,
      p.name,
      p.relation,
      p.birth_year ?? null,
      p.sex ?? null,
    ]),
  );
}

export async function deletePerson(userId: string, id: string): Promise<void> {
  await asUser(userId, (sql) => sql.query(`delete from public.people where id=$1`, [id]));
}
