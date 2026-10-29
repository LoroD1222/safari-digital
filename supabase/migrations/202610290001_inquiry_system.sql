create extension if not exists pgcrypto;

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  tracking_token_hash text not null unique,
  idempotency_key uuid not null unique,
  analytics_event_id uuid not null unique,
  status text not null default 'inquiry_received' check (status in ('inquiry_received','under_review','consultation','proposal','onboarding')),
  status_updated_at timestamptz not null default now(),
  service text not null check (service in ('bookings','website','marketing','automation','complete','advice')),
  package_name text check (package_name is null or package_name in ('landing-page','tour-operator-website','advanced-website','growth','scale','marketing-partner')),
  package_label text,
  company_name text not null,
  website_url text,
  experiences text[] not null default '{}',
  booking_sources text[] not null default '{}',
  challenge text not null,
  markets text[] not null default '{}',
  start_timeline text not null,
  budget_type text not null,
  budget_range text,
  full_name text not null,
  email text not null,
  whatsapp text not null,
  additional_information text,
  privacy_consent_at timestamptz not null,
  source text not null default 'website_get_started',
  utm jsonb not null default '{}'::jsonb,
  referrer text,
  landing_url text,
  source_ip_hash text not null,
  user_agent text,
  notification_status text not null default 'pending' check (notification_status in ('pending','sent','failed','not_configured')),
  notification_attempts integer not null default 0,
  last_notification_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inquiry_status_history (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries(id) on delete cascade,
  from_status text,
  to_status text not null check (to_status in ('inquiry_received','under_review','consultation','proposal','onboarding')),
  changed_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.inquiry_notes (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries(id) on delete cascade,
  note text not null check (char_length(note) <= 2000),
  created_by text not null,
  created_at timestamptz not null default now()
);

create index if not exists inquiries_status_idx on public.inquiries(status);
create index if not exists inquiries_service_package_idx on public.inquiries(service, package_name);
create index if not exists inquiries_created_at_idx on public.inquiries(created_at desc);
create index if not exists inquiries_ip_created_idx on public.inquiries(source_ip_hash, created_at desc);
create index if not exists inquiry_status_history_inquiry_idx on public.inquiry_status_history(inquiry_id, created_at desc);
create index if not exists inquiry_notes_inquiry_idx on public.inquiry_notes(inquiry_id, created_at desc);

alter table public.inquiries enable row level security;
alter table public.inquiry_status_history enable row level security;
alter table public.inquiry_notes enable row level security;

revoke all on public.inquiries from anon, authenticated;
revoke all on public.inquiry_status_history from anon, authenticated;
revoke all on public.inquiry_notes from anon, authenticated;

create or replace function public.create_safari_inquiry(payload jsonb)
returns table(id uuid, reference text, analytics_event_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_reference text;
  v_event_id uuid;
begin
  insert into public.inquiries (
    reference, tracking_token_hash, idempotency_key, analytics_event_id, status,
    service, package_name, package_label, company_name, website_url, experiences,
    booking_sources, challenge, markets, start_timeline, budget_type, budget_range,
    full_name, email, whatsapp, additional_information, privacy_consent_at,
    source, utm, referrer, landing_url, source_ip_hash, user_agent
  ) values (
    payload->>'reference', payload->>'tracking_token_hash', (payload->>'idempotency_key')::uuid,
    (payload->>'analytics_event_id')::uuid, 'inquiry_received', payload->>'service',
    nullif(payload->>'package_name',''), nullif(payload->>'package_label',''), payload->>'company_name',
    nullif(payload->>'website_url',''),
    array(select jsonb_array_elements_text(coalesce(payload->'experiences','[]'::jsonb))),
    array(select jsonb_array_elements_text(coalesce(payload->'booking_sources','[]'::jsonb))),
    payload->>'challenge',
    array(select jsonb_array_elements_text(coalesce(payload->'markets','[]'::jsonb))),
    payload->>'start_timeline', payload->>'budget_type', nullif(payload->>'budget_range',''),
    payload->>'full_name', payload->>'email', payload->>'whatsapp',
    nullif(payload->>'additional_information',''), (payload->>'privacy_consent_at')::timestamptz,
    payload->>'source', coalesce(payload->'utm','{}'::jsonb), nullif(payload->>'referrer',''),
    nullif(payload->>'landing_url',''), payload->>'source_ip_hash', nullif(payload->>'user_agent','')
  ) returning inquiries.id, inquiries.reference, inquiries.analytics_event_id
    into v_id, v_reference, v_event_id;

  insert into public.inquiry_status_history (inquiry_id, from_status, to_status, changed_by)
  values (v_id, null, 'inquiry_received', 'Website submission');

  return query select v_id, v_reference, v_event_id;
end;
$$;

create or replace function public.update_safari_inquiry(p_inquiry_id uuid, p_status text, p_note text, p_actor text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_previous text;
begin
  if p_status not in ('inquiry_received','under_review','consultation','proposal','onboarding') then
    raise exception 'Invalid inquiry status';
  end if;

  select status into v_previous from public.inquiries where id = p_inquiry_id for update;
  if v_previous is null then raise exception 'Inquiry not found'; end if;

  if v_previous <> p_status then
    update public.inquiries set status = p_status, status_updated_at = now(), updated_at = now() where id = p_inquiry_id;
    insert into public.inquiry_status_history (inquiry_id, from_status, to_status, changed_by)
    values (p_inquiry_id, v_previous, p_status, p_actor);
  end if;

  if p_note is not null and length(trim(p_note)) > 0 then
    insert into public.inquiry_notes (inquiry_id, note, created_by)
    values (p_inquiry_id, left(trim(p_note), 2000), p_actor);
    update public.inquiries set updated_at = now() where id = p_inquiry_id;
  end if;
end;
$$;

revoke all on function public.create_safari_inquiry(jsonb) from public, anon, authenticated;
revoke all on function public.update_safari_inquiry(uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.create_safari_inquiry(jsonb) to service_role;
grant execute on function public.update_safari_inquiry(uuid,text,text,text) to service_role;
grant all on public.inquiries to service_role;
grant all on public.inquiry_status_history to service_role;
grant all on public.inquiry_notes to service_role;
