create table if not exists public.company_members (
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (company_id, user_id)
);

alter table public.company_members enable row level security;
alter table public.companies enable row level security;
alter table public.transactions enable row level security;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'companies'
      and column_name = 'user_id'
  ) then
    insert into public.company_members (company_id, user_id, role)
    select id, user_id, 'owner'
    from public.companies
    where user_id is not null
    on conflict (company_id, user_id) do nothing;
  end if;
end $$;

alter table public.companies drop column if exists user_id cascade;

create policy "Users can view their company memberships"
  on public.company_members
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can create their own company memberships"
  on public.company_members
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Company members can view companies"
  on public.companies
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.company_members
      where company_members.company_id = companies.id
        and company_members.user_id = auth.uid()
    )
  );

create policy "Authenticated users can create companies"
  on public.companies
  for insert
  to authenticated
  with check (true);

create policy "Company members can view transactions"
  on public.transactions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.company_members
      where company_members.company_id = transactions.company_id
        and company_members.user_id = auth.uid()
    )
  );

create policy "Company members can create transactions"
  on public.transactions
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.company_members
      where company_members.company_id = transactions.company_id
        and company_members.user_id = auth.uid()
    )
  );
