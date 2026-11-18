-- Pipeline support: cached raw extractions (for re-review and hash caching) and a paywall state.

alter table public.documents drop constraint if exists documents_status_check;
alter table public.documents add constraint documents_status_check
  check (status in ('uploaded','processing','needs_review','awaiting_payment','ready','failed','rejected'));

create table public.extractions (
  document_id uuid primary key references public.documents(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  content jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.extractions enable row level security;
create policy extractions_own on public.extractions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.extractions to authenticated;

create index documents_expiry_idx on public.documents(expires_at) where originals_deleted_at is null;
