# Piano implementazione gestione.menuary.it

> Stato: DB e ruoli completati. Routing e UI da implementare.

---

## Cosa è già fatto

### Auth flows (admin.menuary.it + clienti.menuary.it)
- `src/middleware.ts` — Supabase auth guard per admin, protezione route private clienti
- `src/app/api/auth/callback/route.ts` — gestisce invite, signup, recovery
- `src/app/api/auth/logout/route.ts` — logout server-side
- `src/app/admin/login/page.tsx` — email+password Supabase
- `src/app/admin/set-password/page.tsx` — primo accesso per utenti invitati
- `src/components/admin/admin-layout-switch.tsx` — gestisce login/set-password senza shell
- `src/app/admin/layout.tsx` — semplificato, niente AuthGate
- `src/lib/admin-auth.ts` — funzioni localStorage deprecate (stub per compat)
- `src/components/clients/clients-login-tabs.tsx` — Supabase auth reale + link a registrati/recupera
- `src/components/clients/clients-nav.tsx` — logout dinamico
- `src/components/clients/clients-registration-form.tsx` — registrazione con conferma email
- `src/components/clients/clients-password-recovery-form.tsx` — reset password 2 step
- `src/app/(clienti-portal)/registrati/page.tsx`
- `src/app/(clienti-portal)/recupera-password/page.tsx`

### Database (progetto Supabase: tagymkqywjlrqwduxvcw — manuary.it)
- Trigger `on_auth_user_created` su `auth.users`:
  - auto-crea `user_profiles` (consumer_enabled=true per clienti, false per staff)
  - collega `auth_user_id` in `admin_users` se email pre-registrata
- Trigger `on_admin_user_row_created` su `admin_users`:
  - collega `auth_user_id` se auth.user già esiste
- Enum `admin_role` esteso: `platform_admin`, `tenant_admin`, `titolare`, `manager`,
  `chef`, `cameriere`, `personale_cucina`, `kitdisplay`, `kiosk`
- `admin_users` ha: `permissions jsonb`, `display_name`, `invited_by`
- `user_profiles` ha: `consumer_enabled boolean`
- Tabella `tenant_device_pins` per PIN kitdisplay/kiosk (con RLS)
- RLS policy `admin_users_tenant_write`: titolare e manager gestiscono il loro staff
- Fix sicurezza: revocato execute da `anon` su funzioni SECURITY DEFINER
- Record `hello@menuary.it` pre-creato in `admin_users` con ruolo `platform_admin`

### Ruoli e permessi
- `src/lib/store-roles.ts` — mappa completa ruoli → capabilities + override system

---

## Da implementare: gestione.menuary.it

### 1. Platform mode e routing

**`src/lib/platform.ts`**
- Aggiungere `"gestione"` a `PlatformMode`
- `gestione.menuary.it` → mode `"gestione"`

**`src/middleware.ts`**
- Modalità `gestione`: 
  - Estrarre `tenantSlug` dalla URL (`/bepork/...` → slug = `bepork`)
  - Auth guard Supabase
  - Check `can_admin_tenant(tenantSlug)` per verificare accesso al tenant specifico
  - Path pubblici: `/[slug]/login`, `/[slug]/set-password`
  - Rewrite: `gestione.menuary.it/bepork/ordini` → `/gestione/bepork/ordini`

### 2. Route Next.js

```
src/app/gestione/
  [tenantSlug]/
    layout.tsx          ← risolve tenant dallo slug, applica tema CSS/vars
    login/
      page.tsx          ← login brandizzato col tema tenant
    set-password/
      page.tsx          ← enrollment: nuova password + checkbox consumer Menuary
    page.tsx            ← dashboard
    ordini/page.tsx
    menu/page.tsx
    tavoli/page.tsx
    prenotazioni/page.tsx
    turni/page.tsx      ← schedule + richieste ferie (tutti i ruoli)
    staff/page.tsx      ← gestione dipendenti (titolare + manager)
    impostazioni/page.tsx
```

**`src/app/gestione/[tenantSlug]/layout.tsx`**
```typescript
// Server component
const tenant = resolveTenantFromSlug(params.tenantSlug)  // da tenant-registry
// applica tenantThemeCssVars(tenant.theme)
// carica CSS tenant (bepork.css, faak.css, ecc.)
// verifica che l'utente autenticato possa accedere a questo tenant
```

### 3. Enrollment flow (set-password per staff)

`gestione.menuary.it/[slug]/set-password` deve:
1. Form nuova password
2. Checkbox "Abilita anche come cliente Menuary"
   - Se checked → `UPDATE user_profiles SET consumer_enabled = true WHERE user_id = auth.uid()`
   - Mostra nota: "Puoi accedere a clienti.menuary.it con le stesse credenziali"
3. On success → redirect a `gestione.menuary.it/[slug]/dashboard`

### 4. Invito staff da parte del titolare

Il titolare può invitare dipendenti dalla pagina Staff:
1. Form: email, nome, ruolo, permission overrides (can_cassa, can_manage_shifts)
2. Server action:
   ```typescript
   // 1. Crea riga in admin_users (trigger linkerà auth_user_id automaticamente)
   await db.admin_users.insert({ email, role, tenant_id, display_name, permissions, invited_by })
   // 2. Invia invito Supabase con redirect corretto
   await supabase.auth.admin.inviteUserByEmail(email, {
     redirectTo: `https://gestione.menuary.it/${tenantSlug}/set-password`
   })
   ```

### 5. Accesso dispositivi (PIN)

Endpoint `/api/gestione/device-auth`:
```typescript
// POST { tenant_id, device_type, pin }
// Verifica bcrypt(pin, pin_hash) da tenant_device_pins
// Se valido → risponde con token device (JWT custom o session limitata)
// Il dispositivo usa questo token per le sue richieste
```

### 6. Navigation e feature flags

`src/components/gestione/gestione-nav.tsx` — navigazione basata su `getEffectiveCapabilities(role, permissions)`:
- Tutti vedono: Dashboard, Turni (se modulo attivo)
- `can_edit_menu`: Menu
- `can_manage_reservations`: Prenotazioni
- `can_cassa`: Cassa
- `can_view_analytics`: Analytics
- `can_manage_staff`: Staff
- `titolare` + `can_view_financials`: link a studio.menuary.it

### 7. Link dai siti tenant

Nei siti pubblici dei ristoranti (bepork.it, faak.it), aggiungere link a:
`https://gestione.menuary.it/[tenantSlug]`

---

## Configurazione Supabase da completare

1. **Dashboard → Authentication → URL Configuration:**
   - Site URL: `https://clienti.menuary.it`
   - Redirect URLs: `https://*.menuary.it/**`

2. **Inviti admin (hello@menuary.it e successivi):**
   - NON usare "Invite user" dal dashboard (usa il Site URL di default)
   - Usare la server action dell'admin panel oppure curl:
     ```bash
     curl -X POST https://tagymkqywjlrqwduxvcw.supabase.co/auth/v1/invite \
       -H "apikey: SERVICE_ROLE_KEY" \
       -H "Authorization: Bearer SERVICE_ROLE_KEY" \
       -H "Content-Type: application/json" \
       -d '{"email":"hello@menuary.it","redirect_to":"https://admin.menuary.it/api/auth/callback"}'
     ```

---

## Ruoli e capabilities (già implementato in src/lib/store-roles.ts)

| Ruolo | Cassa | Menu | Prenotazioni | Analytics | Turni (gestione) | Staff | Finanziario |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| titolare | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| manager | — | ✓ | ✓ | ✓ | ✓ | — | — |
| chef | — | ✓ | — | — | — | — | — |
| cameriere | — | — | ✓ | — | — | — | — |
| personale_cucina | — | — | — | — | — | — | — |

Override per utente via `admin_users.permissions`:
- `can_cassa: true/false`
- `can_manage_shifts: true/false`

Tutti i ruoli possono sempre vedere il proprio schedule turni (se modulo `shifts` attivo per il tenant).
