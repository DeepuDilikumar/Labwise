import "server-only";
import { asUser } from "@/server/db/client";
import { getSession } from "@/server/auth/session";

export interface Profile {
  user_id: string;
  display_name: string | null;
  region: string;
  locale: string;
  unit_system: string;
  text_size: string;
  theme: string;
  retention_days: number;
  onboarded_at: string | null;
  role: string;
}

const PREF_COLUMNS: Record<string, string> = {
  locale: "locale",
  region: "region",
  theme: "theme",
  text: "text_size",
  units: "unit_system",
};

/** Ensures a profile row exists for the signed-in user and returns it. */
export async function getProfile(): Promise<Profile | null> {
  const s = await getSession();
  if (!s) return null;
  return asUser(s.userId, async (sql) => {
    await sql.query(`insert into public.profiles (user_id) values ($1) on conflict (user_id) do nothing`, [s.userId]);
    const rows = await sql.query<Profile>(`select * from public.profiles where user_id = $1`, [s.userId]);
    return rows[0] ?? null;
  });
}

export async function saveProfilePref(key: string, value: string) {
  const col = PREF_COLUMNS[key];
  const s = await getSession();
  if (!col || !s) return;
  await asUser(s.userId, (sql) => sql.query(`update public.profiles set ${col} = $1 where user_id = $2`, [value, s.userId]));
}
