import { NextResponse } from 'next/server'
import base from '@/lib/airtable'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, kunde, prioritaet, prozess } = body

    // Validierung
    if (!name || !kunde) {
      return NextResponse.json({
        success: false,
        error: 'Name und Kunde sind erforderlich',
      }, { status: 400 })
    }

    const auftraegeTable = base('Aufträge')
    
    // Erstelle neuen Auftrag
    const fields: any = {
      'Name': name,
      'Kunde': kunde,
      'Priorität': prioritaet || 'Mittel',
      'Status': 'Aktiv',
    }

    // Prozess optional verknüpfen
    if (prozess) {
      fields['Prozess'] = [prozess]
    }

    const records = await auftraegeTable.create([{ fields }])
    const newRecord = records[0]

    return NextResponse.json({
      success: true,
      auftrag: {
        id: newRecord.id,
        fields: newRecord.fields,
      },
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.toString(),
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const auftraegeTable = base('Aufträge')
    
    // Alle Aufträge laden (ohne Sortierung, da Created-Feld nicht verfügbar)
    const auftragRecords = await auftraegeTable.select().all()

    // Steps-Tabelle für Step-Namen laden
    const stepsTable = base('Steps')
    const allSteps = await stepsTable.select().all()
    const stepMap = new Map<string, string>()
    allSteps.forEach(step => {
      const fields = step.fields as any
      stepMap.set(step.id, fields.Name || fields.Step || step.id)
    })

    // Lanes-Tabelle für Lane-Namen laden
    const lanesTable = base('Lanes')
    const allLanes = await lanesTable.select().all()
    const laneMap = new Map<string, string>()
    allLanes.forEach(lane => {
      const fields = lane.fields as any
      laneMap.set(lane.id, fields.Name || fields.Lane || lane.id)
    })

    // Phases-Tabelle für Phase-Namen laden
    const phasesTable = base('Phases')
    const allPhases = await phasesTable.select().all()
    const phaseMap = new Map<string, string>()
    allPhases.forEach(phase => {
      const fields = phase.fields as any
      phaseMap.set(phase.id, fields.Name || fields.Phase || phase.id)
    })

    // Incidents-Tabelle für offene Störungen laden
    let incidentsTable
    let allIncidents: any[] = []
    try {
      incidentsTable = base('Incidents')
      allIncidents = await incidentsTable.select().all()
    } catch (e) {
      // Falls Incidents-Tabelle nicht existiert, ignorieren
      console.log('Incidents-Tabelle nicht gefunden oder nicht zugänglich')
    }

    // Gruppiere Incidents nach Auftrag
    const incidentsByAuftrag = new Map<string, number>()
    allIncidents.forEach(incident => {
      const fields = incident.fields as any
      const auftragId = fields['Auftrag'] || fields['Aufträge']
      if (auftragId) {
        const auftragIds = Array.isArray(auftragId) ? auftragId : [auftragId]
        auftragIds.forEach((id: string) => {
          // Prüfe ob Incident offen ist (Status !== "Gelöst" oder ähnlich)
          const status = fields['Status'] || fields['status'] || ''
          const isOpen = status !== 'Gelöst' && status !== 'gelöst' && status !== 'Closed' && status !== 'closed'
          if (isOpen) {
            incidentsByAuftrag.set(id, (incidentsByAuftrag.get(id) || 0) + 1)
          }
        })
      }
    })

    const auftraege = auftragRecords.map(record => {
      const fields = record.fields as any
      
      // Aktueller Step: Wenn es eine ID ist, hole den Namen
      let aktuellerStepName = null
      const aktuellerStepValue = fields['Aktueller Step'] || fields['Aktueller Auftragsschritt'] || null
      if (aktuellerStepValue) {
        if (Array.isArray(aktuellerStepValue)) {
          // Link-Feld: Array von IDs
          aktuellerStepName = aktuellerStepValue.map(id => stepMap.get(id) || id).join(', ')
        } else if (stepMap.has(aktuellerStepValue)) {
          // ID als String
          aktuellerStepName = stepMap.get(aktuellerStepValue)
        } else {
          // Schon ein Name
          aktuellerStepName = aktuellerStepValue
        }
      }
      
      // Offene Störungen zählen
      const offeneStoerungen = incidentsByAuftrag.get(record.id) || 0
      
      // Ampel: grün (0), gelb (1-2), rot (3+)
      let ampel = 'green'
      if (offeneStoerungen >= 3) {
        ampel = 'red'
      } else if (offeneStoerungen >= 1) {
        ampel = 'yellow'
      }
      
      // Aktueller Auftragsschritt ID (Single Source of Truth)
      const aktuellerAuftragsschrittId = fields['Aktueller Auftragsschritt']
      const aktuellerAuftragsschrittIdStr = Array.isArray(aktuellerAuftragsschrittId) 
        ? aktuellerAuftragsschrittId[0] 
        : aktuellerAuftragsschrittId

      return {
        id: record.id,
        name: fields.Name || 'Unbenannt',
        status: fields.Status || 'Unbekannt',
        aktuellerStep: aktuellerStepName,
        aktuellerStepId: aktuellerAuftragsschrittIdStr || null,
        kunde: fields.Kunde || 'Unbekannt',
        prioritaet: fields['Priorität'] || fields['Prioritaet'] || fields['Priority'] || 'Normal',
        erstelltAm: fields['Erstellt am'] || fields['Created Time'] || null,
        aktualisiertAm: fields['Aktualisiert am'] || fields['Last Modified Time'] || null,
        offeneStoerungen: offeneStoerungen,
        ampel: ampel,
        fields: fields,
      }
    })

    return NextResponse.json({
      success: true,
      auftraege: auftraege,
      count: auftraege.length,
    })
  } catch (error: any) {
    return NextResponse.json({ 
      success: false,
      error: error.message,
      details: error.toString(),
    }, { status: 500 })
  }
}
