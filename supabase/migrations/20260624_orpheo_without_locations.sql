-- Orpheo models creative identities and does not use physical locations.

create or replace function public.prevent_orphan_tenant()
returns trigger
language plpgsql
as $$
declare
  tenant_vertical text;
  remaining int;
begin
  select vertical
    into tenant_vertical
    from public.tenants
   where id = old.tenant_id;

  if tenant_vertical = 'creative' then
    return old;
  end if;

  select count(*)
    into remaining
    from public.locations
   where tenant_id = old.tenant_id
     and id <> old.id;

  if remaining = 0 then
    raise exception 'Impossibile eliminare l''ultima sede del tenant %: ogni tenant food/services deve avere almeno una sede.', old.tenant_id
      using errcode = 'check_violation';
  end if;

  return old;
end;
$$;

comment on function public.prevent_orphan_tenant() is
  'Vieta la cancellazione dell''ultima sede per tenant food/services. I tenant creative di Orpheo non usano sedi.';

delete from public.platform_subscription_locations psl
using public.platform_lead_locations pll, public.platform_leads pl
where psl.lead_location_id = pll.id
  and pll.lead_id = pl.id
  and pl.business_vertical = 'creative';

delete from public.platform_lead_locations pll
using public.platform_leads pl
where pll.lead_id = pl.id
  and pl.business_vertical = 'creative';

update public.platform_leads
set address = null,
    city = null,
    province = null,
    postal_code = null,
    updated_at = now()
where business_vertical = 'creative';

delete from public.locations l
using public.tenants t
where l.tenant_id = t.id
  and t.vertical = 'creative';

update public.tenants
set features = coalesce(features, '{}'::jsonb) || '{"multiLocation": false}'::jsonb,
    updated_at = now()
where vertical = 'creative';

update public.platform_packages
set modules = array_remove(modules, 'multiLocation'),
    updated_at = now()
where vertical = 'creative';
