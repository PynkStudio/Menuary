---
name: CRM Platform admin.menuary.it
description: Struttura CRM e abbonamenti per il pannello platform-admin di Menuary
type: project
---

admin.menuary.it ha ricevuto una struttura CRM completa per gestire lead → tenant.

**Sezioni aggiunte:**
- `/admin/crm` — lista lead con filtri per status (lead/prospect/active/churned) e stats
- `/admin/crm/[id]` — dettaglio lead con tab: Anagrafica, Fatturazione, Abbonamento, Pagamenti, Note
- `/admin/pacchetti` — gestione pacchetti commerciali con selezione moduli da TENANT_MODULES
- `/admin/abbonamenti` — overview rinnovi, scadenze imminenti, MRR, pagamenti in sospeso

**File creati:**
- `supabase/migrations/20260514_platform_crm.sql` — 4 nuove tabelle + seed pacchetti base
- `src/lib/platform-crm-types.ts` — tipi TypeScript (PlatformLead, PlatformPackage, PlatformSubscription, PlatformPayment)
- `src/components/admin/platform/platform-crm-page.tsx`
- `src/components/admin/platform/platform-lead-detail.tsx`
- `src/components/admin/platform/platform-packages-page.tsx`
- `src/components/admin/platform/platform-subscriptions-page.tsx`
- `src/styles/admin.css` — classe `.input-base` condivisa per i form admin

**Why:** Prima implementazione del pannello commerciale. I componenti usano mock data (useState); le chiamate Supabase vanno aggiunte quando il DB è allineato.

**How to apply:** I pacchetti sono adattivi: usano `TENANT_MODULES` come source of truth, quindi si aggiornano automaticamente quando si aggiungono nuovi moduli al catalogo.
I dati di fatturazione del lead devono essere sincronizzati su `studio.menuary.it` all'attivazione del tenant (conversione lead→tenant_id).
