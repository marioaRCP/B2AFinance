drop policy if exists "Authenticated users can create companies" on public.companies;

create or replace function public.create_company_with_owner(company_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_company_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  insert into public.companies (name)
  values (company_name)
  returning id into new_company_id;

  insert into public.company_members (company_id, user_id, role)
  values (new_company_id, auth.uid(), 'owner');

  return new_company_id;
end;
$$;

revoke all on function public.create_company_with_owner(text) from public;
revoke execute on function public.create_company_with_owner(text) from anon;
grant execute on function public.create_company_with_owner(text) to authenticated;
