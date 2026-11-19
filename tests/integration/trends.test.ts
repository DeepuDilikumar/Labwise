import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { REGIONS } from "@regions";
import { asService, asUser } from "@/server/db/client";
import { listPeople } from "@/server/data/people";
import { getTrends, labCounts } from "@/server/data/trends";
import { addSampleReport, SAMPLE_PERSON } from "@/server/sample";

describe("trends from the sample person", () => {
  it("builds unit-consistent series across three synthetic reports", async () => {
    const user = randomUUID();
    await asService((sql) => sql.query(`insert into auth.users (id, email) values ($1, 'trends@example.test')`, [user]));
    await asUser(user, (sql) => sql.query(`insert into public.profiles (user_id) values ($1)`, [user]));
    await addSampleReport(user, REGIONS.in);
    const person = (await listPeople(user)).find((p) => p.name === SAMPLE_PERSON)!;
    expect((await labCounts(user))[person.id]).toBe(3);
    const series = await getTrends(user, person.id, "conventional");
    const a1c = series.find((s) => s.id === "hba1c")!;
    expect(a1c.points.map((p) => p.value)).toEqual([6.4, 6.3, 6.1]);
    expect(a1c.points.every((p) => /^\d{4}-\d{2}-\d{2}$/.test(p.date))).toBe(true);
    const si = await getTrends(user, person.id, "si");
    expect(si.find((s) => s.id === "glucose_fasting")!.unit).toBe("mmol/L");
  });
});
