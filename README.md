# Party Pics - Sistema di Condivisione Foto/Video per Feste Private

Questo repository contiene il codice sorgente per un'applicazione Angular destinata alla condivisione di foto e video durante eventi privati. L'applicazione è multi-tenant e sfrutta Supabase per l'autenticazione, il database e lo storage.

## Architettura

- **Frontend**: Angular, Angular Material
- **Backend**: Supabase (Auth, Database, Storage)
- **Caratteristiche**:
  - Routing dinamico per ogni evento (`/slug-evento`)
  - Accesso ospiti tramite password (senza registrazione)
  - Pannello di amministrazione per la gestione degli eventi e dei media
  - Upload di file su Supabase Storage
  - Generazione di QR Code per l'accesso rapido agli eventi

---

## 🚀 Setup del Backend su Supabase

Seguire questi passaggi per configurare l'infrastruttura Supabase.

### a) Creazione delle Tabelle

Eseguire le seguenti query SQL nell'editor SQL di Supabase per creare le tabelle `events` e `media`.

```sql
-- TABELLA DEGLI EVENTI
CREATE TABLE public.events (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    slug text NOT NULL UNIQUE,
    name text NOT NULL,
    password_hash text NOT NULL,
    description text,
    event_date date,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- COMMENTI SULLA TABELLA EVENTS
COMMENT ON TABLE public.events IS 'Tabella che contiene tutti gli eventi privati.';

-- TABELLA DEI MEDIA
CREATE TABLE public.media (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    url text NOT NULL,
    type text NOT NULL, -- 'photo' o 'video'
    description text,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- COMMENTI SULLA TABELLA MEDIA
COMMENT ON TABLE public.media IS 'Tabella che contiene i media (foto/video) caricati per ogni evento.';
```

### b) Creazione degli Indici

Questi indici migliorano le performance delle query di ricerca.

```sql
-- Indice sullo slug dell'evento per ricerche veloci
CREATE INDEX idx_events_slug ON public.events USING btree (slug);

-- Indice sull'ID dell'evento nella tabella media per recuperare velocemente i file di un evento
CREATE INDEX idx_media_event_id ON public.media USING btree (event_id);
```

### c) Abilitazione dell'estensione `pgcrypto`

Questa estensione è necessaria per la funzione di hashing della password.

```sql
-- Abilita l'estensione pgcrypto se non è già attiva
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### d) Funzione RPC per Validare la Password dell'Evento

Questa funzione PostgreSQL (RPC - Remote Procedure Call) viene utilizzata per validare la password di un evento in modo sicuro, senza esporre l'hash al client. Prende in input uno `slug` e una `password` e restituisce `true` se la password è corretta.

```sql
CREATE OR REPLACE FUNCTION validate_event_password(
  p_slug TEXT,
  p_password TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  is_valid BOOLEAN;
BEGIN
  SELECT
    -- Compara l'hash della password fornita con quello salvato nel database
    events.password_hash = crypt(p_password, events.password_hash)
  INTO
    is_valid
  FROM
    public.events
  WHERE
    events.slug = p_slug;

  RETURN COALESCE(is_valid, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### d.2) Funzione RPC per Creare Eventi con Password Hashing

Questa funzione permette di creare un evento e contemporaneamente di eseguire l'hashing della password in modo sicuro, senza che la password in chiaro venga mai memorizzata o loggata.

```sql
CREATE OR REPLACE FUNCTION create_event_with_hashed_password(
  p_slug TEXT,
  p_name TEXT,
  p_password TEXT,
  p_description TEXT,
  p_event_date DATE
)
RETURNS uuid AS $$
DECLARE
  new_event_id uuid;
BEGIN
  INSERT INTO public.events (slug, name, password_hash, description, event_date)
  VALUES (p_slug, p_name, crypt(p_password, gen_salt('bf')), p_description, p_event_date)
  RETURNING id INTO new_event_id;

  RETURN new_event_id;
END;
$$ LANGUAGE plpgsql;
```

**Nota sulla sicurezza**: `SECURITY DEFINER` è fondamentale qui, perché permette alla funzione di essere eseguita con i permessi dell'utente che l'ha definita (il superuser), bypassando temporaneamente le RLS policies che impedirebbero a un utente anonimo di leggere la tabella `events`.

### e) Row Level Security (RLS) Policies

Le RLS policies sono il cuore della sicurezza dei dati.

1.  **Abilitare RLS sulle tabelle**:

    ```sql
    -- Abilita RLS per entrambe le tabelle
    ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
    ```

2.  **Policy per gli Ospiti (utenti anonimi)**:

    ```sql
    -- GLI OSPITI POSSONO VEDERE I MEDIA DI TUTTI GLI EVENTI
    -- (La logica di accesso all'evento è gestita dal client dopo la validazione della password)
    CREATE POLICY "Allow public read access to media"
    ON public.media
    FOR SELECT
    USING (true);

    -- GLI OSPITI POSSONO CARICARE MEDIA SOLO PER L'EVENTO CORRETTO
    -- Questa policy è più complessa e richiede un modo per passare l'ID dell'evento in modo sicuro.
    -- Per semplicità, inizialmente permettiamo l'inserimento a chiunque sia autenticato (anonimamente).
    -- La logica di controllo sarà nel frontend e nell'RPC opzionale.
    CREATE POLICY "Allow anonymous insert on media"
    ON public.media
    FOR INSERT
    WITH CHECK (true);
    ```

3.  **Policy per l'Amministratore**:

    L'amministratore userà il ruolo `service_role` (tramite il client Supabase inizializzato con la chiave `service_role` lato server, che però in Angular non useremo) o sarà un utente autenticato. Per un pannello admin, è meglio usare un utente `authenticated`.

    ```sql
    -- L'ADMIN (qualsiasi utente autenticato) PUÒ FARE TUTTO SUGLI EVENTI
    CREATE POLICY "Allow full access to authenticated users on events"
    ON public.events
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

    -- L'ADMIN (qualsiasi utente autenticato) PUÒ FARE TUTTO SUI MEDIA
    CREATE POLICY "Allow full access to authenticated users on media"
    ON public.media
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
    ```

### f) Istruzioni per Supabase Storage

1.  **Crea un nuovo Bucket**:
    - Vai alla sezione "Storage" nel tuo progetto Supabase.
    - Clicca su "New Bucket".
    - Assegna un nome al bucket, ad esempio `event-media`.
    - **Importante**: Lascia il bucket **NON pubblico**.

2.  **Imposta le Policy del Bucket**:
    - Vai alle policies del bucket appena creato.
    - **Policy per la selezione (SELECT)**: Permetti a chiunque di vedere i file.
      ```sql
      -- Permetti l'accesso in lettura a tutti
      CREATE POLICY "Allow public read access"
      ON storage.objects FOR SELECT
      USING ( bucket_id = 'event-media' );
      ```
    - **Policy per l'inserimento (INSERT)**: Permetti l'upload solo agli utenti anonimi o autenticati.
      ```sql
      -- Permetti l'upload a utenti anonimi e autenticati
      CREATE POLICY "Allow authenticated and anon uploads"
      ON storage.objects FOR INSERT
      WITH CHECK ( bucket_id = 'event-media' AND (auth.role() = 'authenticated' OR auth.role() = 'anon') );
      ```

### g) Configurazioni Auth

1.  **Disabilita la registrazione utente**:
    - Vai su `Authentication` -> `Providers`.
    - Disabilita il provider `Email`. Questo impedisce a nuovi utenti di registrarsi.
2.  **Crea l'utente Admin manualmente**:
    - Vai su `Authentication` -> `Users`.
    - Clicca su "Invite user".
    - Inserisci l'email dell'amministratore e invia l'invito.
    - Apri l'email di invito, imposta una password e il tuo utente admin sarà pronto.

---

## 💻 Setup del Progetto Angular

1.  **Clona il repository**:
    ```bash
    git clone <URL_DEL_TUO_REPOSITORY>
    cd <NOME_CARTELLA>
    ```
2.  **Installa le dipendenze**:
    ```bash
    npm install
    ```
3.  **Configura le variabili d'ambiente**:
    - Crea un file `src/environments/environment.ts` (se non esiste) e `src/environments/environment.prod.ts`.
    - Inserisci le tue credenziali Supabase:
      ```typescript
      export const environment = {
        production: false,
        supabaseUrl: 'https://TUO_URL_SUPABASE.supabase.co',
        supabaseKey: 'LA_TUA_CHIAVE_PUBBLICA_ANON'
      };
      ```
4.  **Avvia l'applicazione**:
    ```bash
    ng serve
    ```
    L'applicazione sarà disponibile su `http://localhost:4200`.

5.  **Build per la produzione**:
    ```bash
    ng build
    ```
