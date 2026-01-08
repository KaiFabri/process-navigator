import base from '@/lib/airtable'

interface CompleteResult {
  success: boolean
  error?: string
  nextStepId?: string | null
}

export async function completeAuftragsschritt(
  auftragId: string,
  auftragsschrittId: string
): Promise<CompleteResult> {
  try {
    const auftraegeTable = base('Aufträge')
    const auftragsschritteTable = base('Auftragsschritte')
    
    // 1. Lade Auftragsschritt
    const auftragsschritt = await auftragsschritteTable.find(auftragsschrittId)
    const auftragsschrittFields = auftragsschritt.fields as any

    // Prüfe ob Auftragsschritt zum Auftrag gehört
    const auftragIdValue = auftragsschrittFields['Auftrag']
    const auftragIdStr = Array.isArray(auftragIdValue) ? auftragIdValue[0] : auftragIdValue
    if (auftragIdStr !== auftragId) {
      return {
        success: false,
        error: 'Auftragsschritt gehört nicht zu diesem Auftrag',
      }
    }

    // 2. Prüfe ob letzter Step der Phase
    const istLetzterSchritt = auftragsschrittFields['Ist letzer Schritt der Phase'] === 1 || 
                              auftragsschrittFields['Ist letzer Schritt der Phase']?.[0] === 1

    // 3. Wenn letzter Step: Prüfe Gate OK (aber kein Fehler, nur Info)
    if (istLetzterSchritt) {
      const auftragsphaseId = auftragsschrittFields['Auftragsphase (link)']?.[0]
      if (auftragsphaseId) {
        const auftragsphasenTable = base('Auftragsphasen')
        const auftragsphase = await auftragsphasenTable.find(auftragsphaseId)
        const phaseFields = auftragsphase.fields as any
        
        const gateOK = phaseFields['Gate OK?'] === 1 || phaseFields['Gate OK?']?.[0] === 1
        if (!gateOK) {
          return {
            success: false,
            error: 'Es sind noch nicht alle Quality Gate Items abgeschlossen. Bitte prüfen Sie die Quality Gate Items, bevor Sie fortfahren.',
          }
        }
      }
    }

    // 4. Hole Next Auftragsschritt
    const nextAuftragsschrittId = auftragsschrittFields['Next Auftragsschritt']?.[0] || null

    if (!nextAuftragsschrittId) {
      return {
        success: false,
        error: 'Kein nächster Auftragsschritt gefunden. Auftrag ist möglicherweise abgeschlossen.',
      }
    }

    // 5. Update Auftrag: Aktueller Auftragsschritt = Next Auftragsschritt
    // Single Source of Truth - nur dieses Feld wird gesetzt
    await auftraegeTable.update([{
      id: auftragId,
      fields: {
        'Aktueller Auftragsschritt': [nextAuftragsschrittId],
      },
    }])

    // 6. Setze "Erledigt?" = true auf aktuellem Auftragsschritt
    await auftragsschritteTable.update([{
      id: auftragsschrittId,
      fields: {
        'Erledigt?': true,
      },
    }])

    return {
      success: true,
      nextStepId: nextAuftragsschrittId,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Fehler beim Abschließen',
    }
  }
}
