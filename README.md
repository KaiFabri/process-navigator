# Process Navigator

MVP Prozessrunner für KMU - Frontend (Next.js + Airtable)

## Setup

### 1. Dependencies installieren
```bash
npm install
```

### 2. Airtable Credentials konfigurieren

Erstelle eine `.env.local` Datei im Root-Verzeichnis:

```env
AIRTABLE_API_KEY=dein_api_key
AIRTABLE_BASE_ID=deine_base_id
```

### 3. Development Server starten
```bash
npm run dev
```

Die App läuft dann auf [http://localhost:3000](http://localhost:3000)

## Tech Stack

- **Next.js 16** (React Framework)
- **TypeScript**
- **Tailwind CSS**
- **Airtable SDK**
- **dnd-kit** (für Swimlane Drag & Drop)

## Projektstruktur

```
/app          - Next.js App Router (Pages)
/components   - React Komponenten
/lib          - Utilities, Airtable Client
```

## Nächste Schritte

- [ ] Airtable Connection testen
- [ ] Auftrag-Liste aus Airtable lesen
- [ ] Swimlane-Komponente bauen
- [ ] CRUD-Operationen implementieren



