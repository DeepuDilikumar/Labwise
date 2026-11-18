-- Labwise core schema. Every table has RLS; users can only touch their own rows.
-- Runs unchanged on Supabase (cloud) and PGlite (local, with supabase/local shim).

-- gen_random_uuid() is built into Postgres 13+; no extension needed.

-- ---------- helpers ----------
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

-- ---------- profiles ----------
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  region text not null default 'in' check (region in ('in','us')),
  locale text not null default 'en' check (locale in ('en','hi','ml')),
  unit_system text not null default 'conventional' check (unit_system in ('conventional','si')),
  text_size text not null default 'default' check (text_size in ('default','large')),
  theme text not null default 'system' check (theme in ('system','light','dark')),
  retention_days int not null default 30 check (retention_days in (1,7,30,90,365)),
  onboarded_at timestamptz,
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

-- ---------- people (self, mother, father...) ----------
create table public.people (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  relation text not null default 'self' check (relation in ('self','mother','father','partner','child','sibling','grandparent','other')),
  birth_year int check (birth_year between 1900 and 2100),
  sex text check (sex in ('female','male','other')),
  color text not null default 'teal',
  created_at timestamptz not null default now()
);
create index people_user_idx on public.people(user_id);

-- ---------- documents (uploaded files) ----------
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  person_id uuid references public.people(id) on delete set null,
  kind text not null default 'unknown' check (kind in ('lab','prescription','other','unknown')),
  status text not null default 'uploaded' check (status in ('uploaded','processing','needs_review','ready','failed','rejected')),
  storage_paths text[] not null default '{}',
  page_count int not null default 0 check (page_count between 0 and 10),
  file_hash text not null,
  region text not null default 'in',
  is_sample boolean not null default false,
  error_code text,
  expires_at timestamptz,
  originals_deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index documents_user_idx on public.documents(user_id, created_at desc);
create index documents_hash_idx on public.documents(user_id, file_hash);
create trigger documents_touch before update on public.documents for each row execute function public.touch_updated_at();

-- ---------- lab results ----------
create table public.lab_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  person_id uuid references public.people(id) on delete set null,
  lab_name text,
  report_date date,
  patient_age int,
  patient_sex text,
  created_at timestamptz not null default now()
);
create index lab_results_person_idx on public.lab_results(user_id, person_id, report_date);

create table public.lab_markers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lab_result_id uuid not null references public.lab_results(id) on delete cascade,
  position int not null default 0,
  raw_name text not null,
  canonical_id text,
  panel text,
  value_text text not null,
  value numeric,
  unit text,
  canonical_value numeric,
  canonical_unit text,
  ref_low numeric,
  ref_high numeric,
  ref_text text,
  lab_flag text,
  status text not null check (status in ('low','in_range','high','critical_low','critical_high','no_range','unparsed')),
  confidence numeric not null default 1 check (confidence between 0 and 1),
  user_confirmed boolean not null default false
);
create index lab_markers_result_idx on public.lab_markers(lab_result_id);
create index lab_markers_trend_idx on public.lab_markers(user_id, canonical_id);

-- ---------- prescriptions ----------
create table public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  person_id uuid references public.people(id) on delete set null,
  prescriber_specialty text,
  prescribed_date date,
  created_at timestamptz not null default now()
);

create table public.prescription_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prescription_id uuid not null references public.prescriptions(id) on delete cascade,
  position int not null default 0,
  medicine text not null,
  generic_name text,
  drug_class text,
  strength text,
  form text,
  frequency text,
  duration text,
  instructions text,
  confidence numeric not null default 1 check (confidence between 0 and 1),
  user_confirmed boolean not null default false
);

-- ---------- explanations (generated text, cached per language/version) ----------
create table public.explanations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  language text not null check (language in ('en','hi','ml')),
  version int not null default 1,
  content jsonb not null,
  created_at timestamptz not null default now(),
  unique (document_id, language, version)
);

-- ---------- consents ----------
create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  purpose text not null check (purpose in ('process_reports','store_history','ai_processing','share_anonymised_quality')),
  granted boolean not null,
  policy_version text not null,
  region text not null,
  created_at timestamptz not null default now()
);
create index consents_user_idx on public.consents(user_id, purpose, created_at desc);

-- ---------- payments + credits ----------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('razorpay','stripe','local')),
  provider_order_id text not null,
  provider_payment_id text,
  product text not null check (product in ('single_report','monthly')),
  amount_minor int not null check (amount_minor >= 0),
  currency text not null,
  status text not null default 'created' check (status in ('created','paid','failed','refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_order_id)
);
create trigger payments_touch before update on public.payments for each row execute function public.touch_updated_at();

create table public.credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  delta int not null,
  reason text not null check (reason in ('free_first_report','purchase','subscription','consume','refund','admin')),
  payment_id uuid references public.payments(id) on delete set null,
  document_id uuid references public.documents(id) on delete set null,
  created_at timestamptz not null default now()
);
create index credits_user_idx on public.credits(user_id);

create table public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payment_id uuid references public.payments(id) on delete set null,
  current_period_end timestamptz not null,
  created_at timestamptz not null default now()
);

-- ---------- audit log (never contains report contents) ----------
create table public.audit_log (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  action text not null,
  target_type text,
  target_id uuid,
  created_at timestamptz not null default now()
);
create index audit_user_idx on public.audit_log(user_id, created_at desc);

-- ---------- AI usage / cost (no prompt or output content) ----------
create table public.ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  document_id uuid references public.documents(id) on delete set null,
  stage text not null,
  provider text not null,
  model text not null,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  cost_usd_micros bigint not null default 0,
  cached boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- rate limits ----------
create table public.rate_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  bucket text not null,
  created_at timestamptz not null default now()
);
create index rate_events_idx on public.rate_events(user_id, bucket, created_at desc);

-- ---------- RLS ----------
do $$
declare t text;
begin
  foreach t in array array['people','documents','lab_results','lab_markers','prescriptions','prescription_items','explanations','consents'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t || '_own', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

-- profiles: own row, but users may not promote themselves to admin.
alter table public.profiles enable row level security;
create policy profiles_select on public.profiles for select to authenticated using (user_id = auth.uid());
create policy profiles_insert on public.profiles for insert to authenticated with check (user_id = auth.uid() and role = 'user');
create policy profiles_update on public.profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and role = (select p.role from public.profiles p where p.user_id = auth.uid()));
create policy profiles_delete on public.profiles for delete to authenticated using (user_id = auth.uid());
grant select, insert, update, delete on public.profiles to authenticated;

-- credits, rate events, payments, subscriptions: users read their own; only the server (service role) writes,
-- so nobody can grant themselves credits or erase their rate-limit history.
alter table public.credits enable row level security;
create policy credits_select on public.credits for select to authenticated using (user_id = auth.uid());
grant select on public.credits to authenticated;
alter table public.rate_events enable row level security;
create policy rate_events_select on public.rate_events for select to authenticated using (user_id = auth.uid());
grant select on public.rate_events to authenticated;
alter table public.payments enable row level security;
create policy payments_select on public.payments for select to authenticated using (user_id = auth.uid());
grant select on public.payments to authenticated;
alter table public.subscriptions enable row level security;
create policy subscriptions_select on public.subscriptions for select to authenticated using (user_id = auth.uid());
grant select on public.subscriptions to authenticated;

-- audit + usage: users can read their own audit trail; writes via service role only.
alter table public.audit_log enable row level security;
create policy audit_select on public.audit_log for select to authenticated using (user_id = auth.uid());
grant select on public.audit_log to authenticated;
alter table public.ai_usage enable row level security;
-- no user policy on ai_usage: admin-only via service role.

grant usage on all sequences in schema public to authenticated;
