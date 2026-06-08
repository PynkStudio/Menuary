-- Estende l'inbox admin e le firme email al brand Orpheo (verticale creative).

alter table inbound_emails
  drop constraint if exists inbound_emails_brand_check,
  add constraint inbound_emails_brand_check
    check (brand in ('menuary', 'bizery', 'orpheo'));

alter table sent_emails
  drop constraint if exists sent_emails_brand_check,
  add constraint sent_emails_brand_check
    check (brand in ('menuary', 'bizery', 'orpheo'));

alter table email_tracking_events
  drop constraint if exists email_tracking_events_brand_check,
  add constraint email_tracking_events_brand_check
    check (brand is null or brand in ('menuary', 'bizery', 'orpheo'));

alter table email_signatures
  drop constraint if exists email_signatures_brand_check,
  add constraint email_signatures_brand_check
    check (brand in ('menuary', 'bizery', 'orpheo'));
