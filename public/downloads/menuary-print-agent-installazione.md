# Menuary Print Agent - Installazione su SUNMI V3 PLUS

Questa guida serve per installare Menuary Print Agent su un terminale SUNMI V3 PLUS, inclusi dispositivi brandizzati Deliveroo dove l'installazione di app esterne puo essere bloccata.

## 1. Requisiti

- Terminale SUNMI V3 PLUS acceso e con batteria sufficiente.
- Connessione Wi-Fi o dati attiva.
- Accesso alle impostazioni del dispositivo.
- APK Menuary Print Agent scaricato da `https://app.menuary.it`.
- Credenziali Menuary abilitate per il locale, oppure account super admin `hello@menuary.it` per demo/test.

## 2. Attivare Opzioni sviluppatore

1. Apri `Impostazioni`.
2. Entra in `Informazioni sul dispositivo`, `Informazioni tablet` o `About device`.
3. Cerca `Numero build`, `Build number` o `Versione SUNMI OS`.
4. Tocca quel campo 7 volte.
5. Se richiesto, inserisci PIN o password del dispositivo.
6. Dovrebbe comparire il messaggio che le opzioni sviluppatore sono attive.

Se il menu Deliveroo blocca le impostazioni, prova a:

- uscire dall'app Deliveroo o dal launcher bloccato;
- cercare `Settings` dalla tendina superiore;
- riavviare il dispositivo e aprire subito `Impostazioni`;
- chiedere al proprietario/fornitore lo sblocco MDM o la rimozione del profilo gestione.

## 3. Abilitare debug USB

1. Apri `Impostazioni`.
2. Vai in `Sistema` > `Opzioni sviluppatore`.
3. Attiva `Debug USB`.
4. Conferma il messaggio di sicurezza.

Il debug USB serve solo se vuoi installare l'APK da computer con Android Studio o ADB. Per installazione da browser puo non essere necessario.

## 4. Abilitare installazione app sconosciute

Su Android 8+ l'autorizzazione e per singola app.

1. Apri `Impostazioni`.
2. Vai in `App` > `Accesso speciale app`.
3. Apri `Installa app sconosciute`.
4. Seleziona l'app che userai per aprire l'APK, per esempio `Chrome`, `Browser`, `Files` o `File Manager`.
5. Attiva `Consenti da questa origine`.

Se Deliveroo o un profilo aziendale rende il toggle grigio/non modificabile, il dispositivo e gestito da MDM: serve sblocco dal proprietario o da chi ha fornito il POS.

## 5. Installazione da app.menuary.it

1. Sul POS apri il browser.
2. Vai su `https://app.menuary.it`.
3. Tocca `Scarica APK Android`.
4. Apri il file scaricato.
5. Conferma `Installa`.
6. Apri `Menuary Print Agent`.

## 6. Installazione manuale via USB

1. Copia `menuary-print-agent.apk` sul dispositivo.
2. Apri `Files` o `File Manager`.
3. Tocca il file APK.
4. Se richiesto, autorizza il file manager a installare app sconosciute.
5. Conferma `Installa`.

## 7. Installazione via ADB

Usa questa opzione se l'installazione dal browser e bloccata ma il debug USB funziona.

1. Collega il POS al Mac/PC via USB.
2. Sul POS conferma `Consenti debug USB`.
3. Da terminale:

```bash
adb devices
adb install -r menuary-print-agent.apk
```

Se `adb devices` non mostra il dispositivo, cambia cavo USB, porta USB o modalita USB del POS.

## 8. Primo avvio

1. Apri `Menuary Print Agent`.
2. Accedi con email e password Menuary.
3. Se l'account gestisce piu locali, scegli il tenant corretto.
4. Lascia l'app attiva: il servizio di stampa resta in background.

## 9. Configurazione su Menuary

Nel pannello Gestione del tenant:

1. Apri `Cassa` o `Stampanti comande`.
2. Seleziona tipo collegamento `POS SUNMI locale`.
3. Salva.
4. Crea o accetta un ordine di test.

La comanda dovrebbe uscire dal POS entro circa 10 secondi.

## 10. Test rapido

- Crea un ordine demo.
- Verifica la stampa automatica.
- Apri l'app e controlla `Ordini recenti`.
- Tocca `Ristampa comanda`.
- Riavvia il POS e verifica che il servizio riparta.

## 11. Problemi comuni

### Non riesco ad attivare "Installa app sconosciute"

Il POS e probabilmente bloccato da profilo Deliveroo/MDM. Serve sblocco amministrativo del dispositivo.

### L'app si installa ma non stampa

Controlla che:

- nel pannello Menuary la stampante sia `POS SUNMI locale`;
- il POS sia connesso a internet;
- il tenant selezionato sia quello corretto;
- il servizio stampante SUNMI sia presente sul dispositivo.

### L'app dice "stampante non pronta"

Attendi qualche secondo e riprova. Se persiste, riavvia il POS. Se continua, il firmware potrebbe non esporre il servizio stampante SUNMI standard.

### Dopo standby non stampa

Controlla risparmio batteria e restrizioni app in background. Se disponibili, imposta Menuary Print Agent come app senza limitazioni batteria.

## 12. Sicurezza

Dopo l'installazione, puoi disattivare:

- `Debug USB`, se non serve piu;
- `Consenti da questa origine`, per browser o file manager.

L'app richiede comunque credenziali Menuary valide per funzionare.
