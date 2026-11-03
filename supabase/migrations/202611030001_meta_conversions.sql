alter table public.inquiries
  add column if not exists meta_event_status text not null default 'not_configured'
    check (meta_event_status in ('sent','failed','not_configured')),
  add column if not exists meta_event_attempts integer not null default 0,
  add column if not exists last_meta_event_error text,
  add column if not exists meta_event_sent_at timestamptz;
