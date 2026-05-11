drop policy if exists "Users can create their own company memberships" on public.company_members;

create index if not exists company_members_user_id_idx
  on public.company_members (user_id);

create index if not exists transactions_company_id_date_idx
  on public.transactions (company_id, date desc);

create or replace function public.create_company_with_owner(company_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_company_id uuid;
  current_user_id uuid;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if length(trim(company_name)) = 0 then
    raise exception 'Company name is required';
  end if;

  if exists (
    select 1
    from public.company_members
    where company_members.user_id = current_user_id
  ) and not exists (
    select 1
    from public.company_members
    where company_members.user_id = current_user_id
      and company_members.role in ('owner', 'admin')
  ) then
    raise exception 'Only owners and admins can create companies';
  end if;

  insert into public.companies (name)
  values (trim(company_name))
  returning id into new_company_id;

  insert into public.company_members (company_id, user_id, role)
  values (new_company_id, current_user_id, 'owner');

  return new_company_id;
end;
$$;

revoke all on function public.create_company_with_owner(text) from public;
revoke execute on function public.create_company_with_owner(text) from anon;
grant execute on function public.create_company_with_owner(text) to authenticated;
