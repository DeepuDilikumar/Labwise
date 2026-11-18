"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/server/auth/session";
import { audit } from "@/server/audit";
import { createPerson, deletePerson, getPerson, personInput, updatePerson } from "@/server/data/people";

export async function savePerson(id: string | null, raw: unknown): Promise<{ ok: false; error: string } | void> {
  const s = await requireSession();
  const parsed = personInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };
  try {
    if (id) await updatePerson(s.userId, id, parsed.data);
    else await createPerson(s.userId, parsed.data);
  } catch (e) {
    return { ok: false, error: (e as Error).message === "people_limit" ? "limit" : "failed" };
  }
  await audit(s.userId, id ? "person.update" : "person.create");
  revalidatePath("/home");
  redirect("/people");
}

export async function removePerson(id: string) {
  const s = await requireSession();
  const p = await getPerson(s.userId, id);
  if (!p || p.relation === "self") return;
  await deletePerson(s.userId, id);
  await audit(s.userId, "person.delete");
  revalidatePath("/people");
  redirect("/people");
}
