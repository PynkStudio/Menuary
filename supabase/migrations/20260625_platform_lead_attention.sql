-- Stato di attenzione CRM per coda lead e responsabili assegnati.

alter table public.platform_leads
  add column if not exists attention_kind text,
  add column if not exists attention_for_user_id uuid references auth.users(id) on delete set null,
  add column if not exists attention_updated_at timestamptz,
  add column if not exists last_updated_by_user_id uuid references auth.users(id) on delete set null,
  add column if not exists update_actor_at timestamptz;

alter table public.platform_leads
  drop constraint if exists platform_leads_attention_kind_check;

alter table public.platform_leads
  add constraint platform_leads_attention_kind_check
  check (attention_kind is null or attention_kind in ('new', 'updated'));

create index if not exists platform_leads_attention_idx
  on public.platform_leads(attention_for_user_id, attention_kind)
  where attention_kind is not null;

update public.platform_leads lead
set sales_owner_id = null,
    sales_owner_name = null
where sales_owner_id is not null
  and not exists (
    select 1
    from public.siteadmin admin_user
    where admin_user.user_id = lead.sales_owner_id
      and admin_user.enabled = true
      and admin_user.role in ('admin', 'venditore')
  );

update public.platform_leads
set attention_kind = 'new',
    attention_for_user_id = sales_owner_id,
    attention_updated_at = coalesce(updated_at, created_at, now())
where attention_kind is null;

create or replace function public.platform_lead_attention_guard()
returns trigger
language plpgsql
as $$
declare
  owner_role text;
  actor_id uuid;
  meaningful_change boolean;
begin
  if new.sales_owner_id is not null
     and (tg_op = 'INSERT' or new.sales_owner_id is distinct from old.sales_owner_id) then
    select role
      into owner_role
      from public.siteadmin
     where user_id = new.sales_owner_id
       and enabled = true;

    if owner_role is null or owner_role not in ('admin', 'venditore') then
      raise exception 'Il responsabile lead deve essere un admin o venditore operativo.'
        using errcode = 'check_violation';
    end if;
  end if;

  if tg_op = 'INSERT' then
    new.attention_kind := 'new';
    new.attention_for_user_id := new.sales_owner_id;
    new.attention_updated_at := coalesce(new.created_at, now());
    return new;
  end if;

  if old.sales_owner_id is not null and new.sales_owner_id is null then
    raise exception 'Un lead assegnato non può tornare senza responsabile.'
      using errcode = 'check_violation';
  end if;

  if new.sales_owner_id is distinct from old.sales_owner_id then
    new.attention_kind := 'new';
    new.attention_for_user_id := new.sales_owner_id;
    new.attention_updated_at := now();
    return new;
  end if;

  meaningful_change :=
    (to_jsonb(new)
      - 'updated_at'
      - 'attention_kind'
      - 'attention_for_user_id'
      - 'attention_updated_at'
      - 'last_updated_by_user_id'
      - 'update_actor_at')
    is distinct from
    (to_jsonb(old)
      - 'updated_at'
      - 'attention_kind'
      - 'attention_for_user_id'
      - 'attention_updated_at'
      - 'last_updated_by_user_id'
      - 'update_actor_at');

  if meaningful_change and new.sales_owner_id is not null then
    actor_id := case
      when new.update_actor_at is distinct from old.update_actor_at
        then new.last_updated_by_user_id
      else null
    end;

    if actor_id is distinct from new.sales_owner_id then
      new.attention_kind := 'updated';
      new.attention_for_user_id := new.sales_owner_id;
      new.attention_updated_at := now();
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_platform_lead_attention_guard on public.platform_leads;
create trigger trg_platform_lead_attention_guard
  before insert or update on public.platform_leads
  for each row execute function public.platform_lead_attention_guard();

comment on column public.platform_leads.attention_kind is
  'new: lead non assegnato o appena assegnato; updated: modifica effettuata da un utente diverso dal responsabile.';
