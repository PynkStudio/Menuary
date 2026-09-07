-- Copy approvato con l'autrice per le tre opere in catalogo.
--
-- Il sito legge titoli e testi da `tenant_creative_works`, non dal fallback in
-- `content.ts`: senza questo aggiornamento le pagine /trilogia e /thriller
-- continuerebbero a mostrare i testi del seed di giugno.
--
-- Le etichette dei pulsanti della trilogia diventano quelle approvate; il
-- secondo pulsante ("Porta a casa il libro") usa lo stesso `cta_href`, perché la
-- tabella modella una sola coppia etichetta/indirizzo.

update public.tenant_creative_works set
  description  = 'La nebbia fitta del dubbio, il peso sul petto che toglie il respiro ma costringe a guardarsi dentro con sincerità.',
  cta_label    = 'Leggi la trama',
  updated_at   = now()
where id = '44acaaba-1814-46ef-923d-a4f50aa11901'
  and tenant_id = 'valentina-orciuoli';

update public.tenant_creative_works set
  description  = 'Il fuoco improvviso che brucia dentro: una rabbia che può distruggere tutto oppure accendere il coraggio di cambiare.',
  cta_label    = 'Leggi la trama',
  updated_at   = now()
where id = '44acaaba-1814-46ef-923d-a4f50aa11902'
  and tenant_id = 'valentina-orciuoli';

update public.tenant_creative_works set
  description    = 'Il racconto cambia passo, abbandona i cieli del fantasy e scende nelle crepe più intime della realtà contemporanea.',
  secondary_text = 'Un thriller psicologico fitto di simboli, indizi sottili e ombre quotidiane. Un''indagine in cui ogni dettaglio è lo specchio della società e ogni pagina mette alla prova le tue certezze.',
  cta_label      = 'Preordina qui',
  updated_at     = now()
where id = '44acaaba-1814-46ef-923d-a4f50aa11903'
  and tenant_id = 'valentina-orciuoli';
