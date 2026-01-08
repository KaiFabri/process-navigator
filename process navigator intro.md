# Process Navigator  
## Übergabe- & Strategie-Dokument (Backend → Frontend)  
**Draft v0.1 – Stand 16.12.2025**

---

## 1. Zweck dieses Dokuments

Dieses Dokument beschreibt:
- die strategische Idee hinter dem Process Navigator
- den aktuellen Backend-Stand (Airtable + Softr)
- die Architekturprinzipien
- den Scope des MVP
- die nächsten Schritte für Backend & Frontend

Ziel ist eine **klare, pragmatische Grundlage** für Weiterentwicklung, Diskussion und Umsetzung – **kein Pitch, kein Marketing**.

---

## 2. Ziel & Scope

### Ziel
Ein **voll funktionsfähiger MVP-Prozessrunner** für KMU, der:
- reale Aufträge durch definierte Prozessphasen führt
- Quality Gates prüfbar macht
- Übergaben kontrolliert steuert
- Transparenz schafft

**Wichtig:**  
Der Process Navigator **ersetzt kein ERP**.  
Er liegt **über** bestehenden Systemen als Orchestrierungs-, Führungs- und Transparenz-Layer.

---

### Im MVP enthalten
- Prozessdefinition (Process → Phases → Steps)
- Quality Gate Items je Phase
- Runtime-Aufträge
- Status & Weitergabe
- User-Zuweisung (light)
- Incidents / Störungen (light)
- Macro-Übersicht (light)

### Nicht im MVP
- ERP-Transaktionen (Bestellungen, Finance, Inventory)
- Komplexe API-Integrationen
- Tiefes Rollen- & Rechte-Modell
- Automatisches ERP-Auslesen durch KI

---

## 3. Architekturprinzip

### Blueprint vs. Runtime

**Blueprint (statisch):**
Definiert *wie* ein Prozess aussieht.

**Runtime (dynamisch):**
Instanziiert den Prozess für reale Aufträge.

Zentrales Prinzip:
> **Ein einziges Source-of-Truth-Feld steuert alles.**

---

### Single Source of Truth
- Feld: **Aktueller Auftragsschritt**
- Dieses Feld bestimmt:
  - aktuellen Step
  - Phase
  - Lane / Rolle
- Alle anderen Informationen werden **per Lookup/Formel** abgeleitet  
→ Keine redundanten Statusfelder.

---

## 4. Datenmodell – High Level

### Blueprint-Tabellen
- **Processes** – Referenzprozess (z. B. KMU Standard)
- **Phases** – Makro-Phasen (Anfrage, Angebot, Auftrag, …)
- **Steps** – operative Schritte je Phase
- **Quality Gate Items** – Prüfpunkte je Phase
- **SOP Items** – Dokumente, Links, Anleitungen je Step
- **Lanes / Roles** – Zuständigkeiten (informativ)
- **Actions** – optionale Aktionen (informativ)

---

### Runtime-Tabellen
- **Aufträge** – laufender Auftrag
- **Auftragsschritte** – (Auftrag × Step)
- **Auftragsphasen** – (Auftrag × Phase)
- **Auftrags-Quality-Gate-Items** – (Auftragsphase × Gate Item)
- **Incidents (geplant)** – Störungen / Abweichungen

---

## 5. Automationen – Ist-Stand

### Initialisierung
- **A1:** Auftragsschritte initialisieren  
  → erstellt alle Auftragsschritte + Start-Token
- **A2:** Auftragsphasen initialisieren  
- **A2b:** Guard-Flag gegen Mehrfach-Initialisierung
- **A3:** Quality Gate Items pro Phase kopieren

---

### Laufzeit-Logik
- **Aktueller Auftragsschritt**
  - wird beim Abschluss automatisch auf den nächsten Step gesetzt
  - steuert Phase/Lane/Status
- **Next Auftragsschritt**
  - wird aus globaler Step-Reihenfolge berechnet

Ableitungen erfolgen primär via **Lookups/Formeln**, nicht via Schreib-Automationen.

---

## 6. Aktueller Stand

✅ Backend-Kern funktionsfähig  
✅ Initialisierung läuft stabil  
✅ Runtime-Struktur vollständig  
✅ Gate-Fortschritt korrekt berechnet  

❌ Phase-Ende-Stop fehlt  
❌ Verantwortlichkeiten unvollständig  
❌ Incidents noch nicht umgesetzt  
❌ UI/UX nur rudimentär

---

## 7. Nächste Schritte – Backend

### Pflicht (MVP-fähig)
- **Phase-Ende-Stop**
  - Letzter Step einer Phase darf nur weiter,
    wenn `Gate OK? = true`
- **Verantwortlichkeiten (light)**
  - Lane-Owner
  - Phase-Owner
- **Incidents (minimal)**
  - Meldung am Auftragsschritt
  - Status: offen / gelöst
  - optional: Auftrag blockiert
- **Macro-Übersicht**
  - Auftrag
  - aktuelle Phase
  - Lane
  - Ampel (Gate / Incident)

---

## 8. Nächste Schritte – Frontend (Softr)

### Core Screens
- **Home / Dashboard**
  - Neuen Auftrag anlegen
  - Auftrag suchen
  - Offene Aufgaben
- **Auftragskarte**
  - Aktueller Step
  - Phase / Lane
  - Gate-Status
  - Offene Incidents
- **Arbeitsansicht Step**
  - SOP Items
  - Gate Items sichtbar
  - Status bedienen
- **Swimlane / Board**
  - Aufträge nach Phase gruppiert
  - Statusindikatoren (grün / rot)

---

## 9. KI – Phase 2 (Platzhalter)

Geplant:
- Prompt-basierte Queries auf Airtable
- z. B.:
  - „Wo hängen Aufträge?“
  - „Welche Gates sind systematisch kritisch?“
- Kein autonomes Steuern im MVP

---

## 10. Übergabe-Assets (für nächsten Chat)

Empfohlen:
- Airtable Base Screenshots (Tabellen + Relations)
- Screenshots aller Automationen
- Softr Pages + wichtigste Screens
- Liste offener Architektur-Entscheidungen

---

## 11. Strategischer Kontext (kurz)

- Boutique-Ansatz
- KMU-fokussiert
- Kein Tool-Push
- Systemdenken vor Frameworks
- Umsetzung vor Konzept
- Ehrlichkeit vor Sales-Story

---

_Ende des Dokuments_
