import { NextResponse } from 'next/server'
import base from '@/lib/airtable'

export async function GET(request: Request) {
  try {
    const stepsTable = base('Steps')
    
    // Alle Steps laden, sortiert nach "Reihenfolge Global"
    const stepsRecords = await stepsTable.select({
      sort: [{ field: 'Reihenfolge Global', direction: 'asc' }],
    }).all()

    // Steps mit Lane- und Phase-Info vorbereiten
    const steps = stepsRecords.map(record => {
      const fields = record.fields as any
      
      // Lane könnte ein Link-Feld sein, das auf Lanes-Tabelle verweist
      let laneName = 'Unbekannt'
      let laneId = null
      
      if (fields.Lane) {
        if (Array.isArray(fields.Lane)) {
          laneId = fields.Lane[0]
        } else {
          laneName = fields.Lane
        }
      } else if (fields.Lanes) {
        if (Array.isArray(fields.Lanes)) {
          laneId = fields.Lanes[0]
        } else {
          laneName = fields.Lanes
        }
      }
      
      // Phase
      let phaseName = 'Unbekannt'
      let phaseId = null
      
      if (fields.Phase) {
        if (Array.isArray(fields.Phase)) {
          phaseId = fields.Phase[0]
        } else {
          phaseName = fields.Phase
        }
      } else if (fields.Phases) {
        if (Array.isArray(fields.Phases)) {
          phaseId = fields.Phases[0]
        } else {
          phaseName = fields.Phases
        }
      }
      
      return {
        id: record.id,
        name: fields.Name || fields.Step || 'Unbenannt',
        laneId: laneId,
        laneName: laneName,
        phaseId: phaseId,
        phaseName: phaseName,
        fields: fields,
      }
    })

    // Lane-Namen aus Lanes-Tabelle holen (falls Link-Feld)
    const laneIds = [...new Set(steps.map(s => s.laneId).filter(Boolean))]
    const laneMap = new Map<string, string>()
    
    if (laneIds.length > 0) {
      try {
        const lanesTable = base('Lanes')
        const allLanes = await lanesTable.select().all()
        allLanes.forEach(record => {
          const fields = record.fields as any
          laneMap.set(record.id, fields.Name || fields.Lane || record.id)
        })
      } catch (err) {
        console.error('Fehler beim Laden der Lanes:', err)
      }
    }

    // Phase-Namen aus Phases-Tabelle holen (falls Link-Feld)
    const phaseIds = [...new Set(steps.map(s => s.phaseId).filter(Boolean))]
    const phaseMap = new Map<string, string>()
    const phaseOrderMap = new Map<string, number>()
    
    if (phaseIds.length > 0) {
      try {
        const phasesTable = base('Phases')
        const allPhases = await phasesTable.select({
          sort: [{ field: 'Reihenfolge', direction: 'asc' }],
        }).all()
        allPhases.forEach((record, index) => {
          const fields = record.fields as any
          const phaseName = fields.Name || fields.Phase || record.id
          phaseMap.set(record.id, phaseName)
          phaseOrderMap.set(phaseName, index)
        })
      } catch (err) {
        console.error('Fehler beim Laden der Phases:', err)
      }
    }

    // Setze Lane- und Phase-Namen
    const stepsWithInfo = steps.map(step => ({
      ...step,
      laneName: step.laneId && laneMap.has(step.laneId) 
        ? laneMap.get(step.laneId)! 
        : step.laneName,
      phaseName: step.phaseId && phaseMap.has(step.phaseId) 
        ? phaseMap.get(step.phaseId)! 
        : step.phaseName,
    }))

    // Alle Phasen aus der Phases-Tabelle laden (nicht nur die, die in Steps vorkommen)
    let uniquePhases: string[] = []
    try {
      const phasesTable = base('Phases')
      const allPhases = await phasesTable.select({
        sort: [{ field: 'Reihenfolge', direction: 'asc' }],
      }).all()
      uniquePhases = allPhases.map(record => {
        const fields = record.fields as any
        return fields.Name || fields.Phase || record.id
      })
    } catch (err) {
      // Fallback: Phasen aus Steps extrahieren
      uniquePhases = [...new Set(stepsWithInfo.map(s => s.phaseName))].sort((a, b) => {
        const orderA = phaseOrderMap.get(a) ?? 999
        const orderB = phaseOrderMap.get(b) ?? 999
        return orderA - orderB
      })
    }

    // Quality Gates laden
    let qualityGates: any[] = []
    try {
      const qualityGatesTable = base('Quality Gates')
      const gatesRecords = await qualityGatesTable.select().all()
      
      qualityGates = gatesRecords.map(record => {
        const fields = record.fields as any
        let phaseName = 'Unbekannt'
        let phaseId = null
        
        if (fields.Phase) {
          if (Array.isArray(fields.Phase)) {
            phaseId = fields.Phase[0]
          } else {
            phaseName = fields.Phase
          }
        }
        
        return {
          id: record.id,
          name: fields.Name || 'Unbenannt',
          phaseId: phaseId,
          phaseName: phaseId && phaseMap.has(phaseId) 
            ? phaseMap.get(phaseId)! 
            : phaseName,
        }
      })
    } catch (err) {
      console.error('Fehler beim Laden der Quality Gates:', err)
    }

    // Alle eindeutigen Lanes sammeln
    const uniqueLanes = [...new Set(stepsWithInfo.map(s => s.laneName))]

    return NextResponse.json({
      success: true,
      steps: stepsWithInfo,
      lanes: uniqueLanes,
      phases: uniquePhases,
      qualityGates: qualityGates,
      totalSteps: steps.length,
    })
  } catch (error: any) {
    return NextResponse.json({ 
      success: false,
      error: error.message,
      details: error.toString(),
    }, { status: 500 })
  }
}
