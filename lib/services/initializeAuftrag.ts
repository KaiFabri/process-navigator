import base from '@/lib/airtable'

interface InitializeResult {
  success: boolean
  error?: string
  createdPhases?: number
  createdSteps?: number
  createdGateItems?: number
}

export async function initializeAuftrag(auftragId: string): Promise<InitializeResult> {
  try {
    const auftraegeTable = base('Aufträge')
    
    // 1. Guard: Prüfe ob bereits initialisiert
    const auftragRecord = await auftraegeTable.find(auftragId)
    const auftragFields = auftragRecord.fields as any
    
    if (auftragFields['Init_Steps_Done'] || auftragFields['Init_Phases_Done']) {
      return {
        success: false,
        error: 'Auftrag wurde bereits initialisiert',
      }
    }

    // 2. Lade Blueprint-Daten
    // Phases mit "Für Initialisierung verwenden? = true", sortiert nach Reihenfolge
    const phasesTable = base('Phases')
    const allPhases = await phasesTable.select({
      filterByFormula: '{Für Initialisierung verwenden?} = 1',
      sort: [{ field: 'Reihenfolge', direction: 'asc' }],
    }).all()

    // Steps mit "Für Initialisierung verwenden = true", sortiert nach Reihenfolge Global
    const stepsTable = base('Steps')
    const allSteps = await stepsTable.select({
      filterByFormula: '{Für Initialisierung verwenden} = 1',
      sort: [{ field: 'Reihenfolge Global', direction: 'asc' }],
    }).all()

    // Quality Gate Items pro Phase laden
    const qualityGateItemsTable = base('Quality Gate Items')
    const allGateItems = await qualityGateItemsTable.select().all()

    // Gruppiere Quality Gate Items nach Phase
    const gateItemsByPhase = new Map<string, any[]>()
    allGateItems.forEach(item => {
      const fields = item.fields as any
      const phaseId = fields['Phase']
      if (phaseId && Array.isArray(phaseId) && phaseId.length > 0) {
        const phaseIdStr = phaseId[0]
        if (!gateItemsByPhase.has(phaseIdStr)) {
          gateItemsByPhase.set(phaseIdStr, [])
        }
        gateItemsByPhase.get(phaseIdStr)!.push(item)
      }
    })

    // 3. Erstelle Auftragsphasen (in Batches von 10)
    const auftragsphasenTable = base('Auftragsphasen')
    const auftragsphasenRecords = allPhases.map(phase => ({
      fields: {
        'Auftrag': [auftragId],
        'Phase': [phase.id],
        // Name ist ein berechnetes Feld, wird automatisch generiert
      },
    }))
    
    // Teile in Batches von 10 auf
    const createdPhases: any[] = []
    for (let i = 0; i < auftragsphasenRecords.length; i += 10) {
      const batch = auftragsphasenRecords.slice(i, i + 10)
      const batchResults = await auftragsphasenTable.create(batch)
      createdPhases.push(...batchResults)
    }
    
    const phaseIdMap = new Map<string, string>() // Phase ID -> Auftragsphase ID
    createdPhases.forEach((record, index) => {
      const phaseId = allPhases[index].id
      phaseIdMap.set(phaseId, record.id)
    })

    // 4. Erstelle Auftragsschritte
    const auftragsschritteTable = base('Auftragsschritte')
    const auftragsschritteRecords = allSteps.map(step => {
      const stepFields = step.fields as any
      const stepPhaseId = stepFields['Phase']?.[0]
      const auftragsphaseId = stepPhaseId ? phaseIdMap.get(stepPhaseId) : null

      return {
        fields: {
          'Auftrag': [auftragId],
          'Step': [step.id],
          // Name ist ein berechnetes Feld, wird automatisch generiert
          'Auftragsphase (link)': auftragsphaseId ? [auftragsphaseId] : [],
          'Phase (link)': stepPhaseId ? [stepPhaseId] : [],
        },
      }
    })

    // Teile in Batches von 10 auf
    const createdSteps: any[] = []
    for (let i = 0; i < auftragsschritteRecords.length; i += 10) {
      const batch = auftragsschritteRecords.slice(i, i + 10)
      const batchResults = await auftragsschritteTable.create(batch)
      createdSteps.push(...batchResults)
    }
    
    const stepIdMap = new Map<string, string>() // Step ID -> Auftragsschritt ID
    createdSteps.forEach((record, index) => {
      const stepId = allSteps[index].id
      stepIdMap.set(stepId, record.id)
    })

    // Setze Next Auftragsschritt basierend auf Next Step
    const updatePromises = createdSteps.map(async (record, index) => {
      const step = allSteps[index]
      const stepFields = step.fields as any
      const nextStepId = stepFields['Next Step']?.[0]
      
      if (nextStepId && stepIdMap.has(nextStepId)) {
        const nextAuftragsschrittId = stepIdMap.get(nextStepId)!
        try {
          await auftragsschritteTable.update([{
            id: record.id,
            fields: {
              'Next Auftragsschritt': [nextAuftragsschrittId],
            },
          }])
        } catch (e) {
          // Ignoriere Fehler beim Update (Feld könnte nicht existieren)
          console.log('Fehler beim Setzen von Next Auftragsschritt:', e)
        }
      }
    })
    await Promise.all(updatePromises)

    // 5. Erstelle Quality Gate Items
    const auftragsGateItemsTable = base('Auftrags-Quality-Gate-Items')
    const gateItemRecords: any[] = []

    createdPhases.forEach((auftragsphase, index) => {
      const phase = allPhases[index]
      const phaseId = phase.id
      const gateItems = gateItemsByPhase.get(phaseId) || []

      gateItems.forEach(gateItem => {
        const gateItemFields = gateItem.fields as any
        gateItemRecords.push({
          fields: {
            'Auftrag': [auftragId],
            'Auftragsphase': [auftragsphase.id],
            // Phase ist ein berechnetes Feld, wird automatisch generiert
            'Quality Gate Item': [gateItem.id],
            // Name ist ein berechnetes Feld, wird automatisch generiert
            'Reihenfolge (Sort)': gateItemFields['Reihenfolge'] || 0,
          },
        })
      })
    })

    // Teile in Batches von 10 auf
    const createdGateItems: any[] = []
    if (gateItemRecords.length > 0) {
      for (let i = 0; i < gateItemRecords.length; i += 10) {
        const batch = gateItemRecords.slice(i, i + 10)
        const batchResults = await auftragsGateItemsTable.create(batch)
        createdGateItems.push(...batchResults)
      }
    }

    // 6. Setze Start-Token
    const firstStep = allSteps[0]
    const firstStepFields = firstStep.fields as any
    const firstStepId = stepIdMap.get(firstStep.id)!
    const firstPhaseId = firstStepFields['Phase']?.[0]
    const firstAuftragsphaseId = firstPhaseId ? phaseIdMap.get(firstPhaseId) : null
    const firstLaneId = firstStepFields['Lane']?.[0]

    await auftraegeTable.update([{
      id: auftragId,
      fields: {
        // Single Source of Truth: Aktueller Auftragsschritt steuert alles
        'Aktueller Auftragsschritt': [firstStepId],
        // Alle anderen Felder (Aktueller Step, Aktuelle Phase, Aktuelle Lane) 
        // werden automatisch per Lookup/Formel abgeleitet
        'Init_Steps_Done': true,
        'Init_Phases_Done': true,
        'Initialisieren': false,
      },
    }])

    return {
      success: true,
      createdPhases: createdPhases.length,
      createdSteps: createdSteps.length,
      createdGateItems: createdGateItems.length,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Fehler bei der Initialisierung',
    }
  }
}
