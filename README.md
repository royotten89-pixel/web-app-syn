# Synergy Systems Web Portal

Een volledige web-applicatie met klantportaal en back-office dashboard, gebouwd met Next.js en Supabase.

---

## Inhoud

- **/portal** — Klantportaal (inloggen, machines, onderdelen bestellen, service aanvragen)
- **/admin** — Back-office dashboard (aanvragen beheren, machinetypes, klanten, klantnummers)

---

## Lokaal opstarten (development)

### Stap 1 — Vereisten

- Node.js 18 of hoger

### Stap 2 — Afhankelijkheden installeren

```bash
npm install
```

### Stap 3 — Supabase-gegevens invullen

Open het bestand `.env.local` en vul je Supabase Project URL en anon key in:

```
NEXT_PUBLIC_SUPABASE_URL=https://JOUW-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=JOUW-ANON-KEY
```

Te vinden in Supabase: Project Settings → API

### Stap 4 — Starten

```bash
npm run dev
```

De app is nu beschikbaar op: http://localhost:3000

- Klantportaal: http://localhost:3000/portal
- Back-office: http://localhost:3000/admin

---

## Deployment op Vercel (gratis, publiek bereikbaar)

### Stap 1 — Maak een Vercel account aan

Ga naar [vercel.com](https://vercel.com) en registreer gratis met je GitHub-account.

### Stap 2 — Zet de code op GitHub

1. Maak een nieuw (privé) repository aan op github.com
2. Upload de projectmap daarnaartoe

### Stap 3 — Koppel aan Vercel

1. Ga in Vercel naar "New Project"
2. Importeer je GitHub-repository
3. Vercel herkent automatisch dat het een Next.js-project is

### Stap 4 — Environment variables instellen

Voeg in Vercel onder "Environment Variables" toe:
- `NEXT_PUBLIC_SUPABASE_URL` → jouw Supabase Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → jouw Supabase anon key

### Stap 5 — Deploy

Klik op "Deploy". Na een minuut of twee is de app live op een vercel.app-URL.

Later kun je een eigen domeinnaam (bv. portal.synergy-systems.nl) koppelen via Vercel's domein-instellingen.

---

## Supabase database

Deze web-app gebruikt dezelfde databasestructuur als de mobiele app. Als je dezelfde Supabase-database wilt hergebruiken, gebruik dan dezelfde URL en anon key. Als je een nieuwe, aparte database wilt, voer dan de SQL-migratiebestanden uit de mobiele app opnieuw uit in een nieuw Supabase-project.

---

## Structuur

```
src/
  app/
    admin/          Back-office pagina's
      login/        Admin inlogpagina
      requests/     Aanvragen beheren
      machines/     Machinetypes, onderdelen, foto's, PDF's
      customers/    Klantenbeheer en klantnummers
    portal/         Klantportaal pagina's
      login/        Klant inlogpagina
      register/     Registratie
      machines/     Machine-overzicht en detail
      cart/         Winkelwagen
      requests/     Aanvragen overzicht
  components/
    ui/             Herbruikbare UI-componenten
  contexts/
    AuthContext     Authenticatie en sessie-beheer
  lib/
    supabase.js     Supabase-client
```
