import { NextResponse } from 'next/server'
import base from '@/lib/airtable'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auftraegeTable = base('Aufträge')
    
    // Einzelnen Auftrag laden
    const auftrag = await auftraegeTable.find(id)
    
    if (!auftrag) {
      return NextResponse.json({ 
        success: false,
        error: 'Auftrag nicht gefunden',
      }, { status: 404 })
    }

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

    const fields = auftrag.fields as any
    
    // Aktueller Step: Wenn es eine ID ist, hole den Namen
    let aktuellerStepName = null
    const aktuellerStepValue = fields['Aktueller Step'] || fields['Aktueller Auftragsschritt'] || null
    if (aktuellerStepValue) {
      if (Array.isArray(aktuellerStepValue)) {
        aktuellerStepName = aktuellerStepValue.map((stepId: string) => stepMap.get(stepId) || stepId).join(', ')
      } else if (stepMap.has(aktuellerStepValue)) {
        aktuellerStepName = stepMap.get(aktuellerStepValue)
      } else {
        aktuellerStepName = aktuellerStepValue
      }
    }

    // Incidents-Tabelle für offene Störungen laden
    let allIncidents: any[] = []
    try {
      const incidentsTable = base('Incidents')
      allIncidents = await incidentsTable.select({
        filterByFormula: `{Auftrag} = "${auftrag.id}"`
      }).all()
    } catch (e) {
      // Falls Incidents-Tabelle nicht existiert, ignorieren
      console.log('Incidents-Tabelle nicht gefunden oder nicht zugänglich')
    }

    // Zähle offene Störungen
    const offeneStoerungen = allIncidents.filter(incident => {
      const fields = incident.fields as any
      const status = fields['Status'] || fields['status'] || ''
      return status !== 'Gelöst' && status !== 'gelöst' && status !== 'Closed' && status !== 'closed'
    }).length

    // Ampel: grün (0), gelb (1-2), rot (3+)
    let ampel = 'green'
    if (offeneStoerungen >= 3) {
      ampel = 'red'
    } else if (offeneStoerungen >= 1) {
      ampel = 'yellow'
    }
    
    return NextResponse.json({
      success: true,
      auftrag: {
        id: auftrag.id,
        name: fields.Name || 'Unbenannt',
        status: fields.Status || 'Unbekannt',
        aktuellerStep: aktuellerStepName,
        kunde: fields.Kunde || 'Unbekannt',
        prioritaet: fields['Priorität'] || fields['Prioritaet'] || fields['Priority'] || 'Normal',
        erstelltAm: fields['Erstellt am'] || fields['Created Time'] || null,
        aktualisiertAm: fields['Aktualisiert am'] || fields['Last Modified Time'] || null,
        offeneStoerungen: offeneStoerungen,
        ampel: ampel,
        fields: fields, // Für Initialisierungs-Prüfung
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
