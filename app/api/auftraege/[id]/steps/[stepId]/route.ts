import { NextResponse } from 'next/server'
import base from '@/lib/airtable'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  try {
    const { id: auftragId, stepId } = await params
    
    // Lade Auftragsschritt
    const auftragsschritteTable = base('Auftragsschritte')
    const auftragsschritt = await auftragsschritteTable.find(stepId)
    const auftragsschrittFields = auftragsschritt.fields as any
    
    // Prüfe ob Auftragsschritt zum Auftrag gehört
    const auftragIdValue = auftragsschrittFields['Auftrag']
    if (!auftragIdValue || (Array.isArray(auftragIdValue) ? auftragIdValue[0] : auftragIdValue) !== auftragId) {
      return NextResponse.json({
        success: false,
        error: 'Auftragsschritt gehört nicht zu diesem Auftrag',
      }, { status: 400 })
    }

    // Lade Step (Blueprint)
    const stepIdValue = auftragsschrittFields['Step']
    const stepIdStr = Array.isArray(stepIdValue) ? stepIdValue[0] : stepIdValue
    
    const stepsTable = base('Steps')
    const step = await stepsTable.find(stepIdStr)
    const stepFields = step.fields as any

    // Lade Actions für diesen Step (Blueprint)
    // Filter-Formel funktioniert nicht zuverlässig, daher laden wir alle und filtern im Code
    const actionsTable = base('Actions')
    const allActions = await actionsTable.select().all()
    
    // Filtere Actions für diesen Step
    const actions = allActions
      .filter((action: any) => {
        const actionStepId = action.fields['Step']
        const actionStepIdStr = Array.isArray(actionStepId) ? actionStepId[0] : actionStepId
        return actionStepIdStr === stepIdStr
      })
      .sort((a: any, b: any) => {
        const aReihenfolge = a.fields['Reihenfolge in Step'] || 0
        const bReihenfolge = b.fields['Reihenfolge in Step'] || 0
        return aReihenfolge - bReihenfolge
      })

    // Lade Auftragsphase für Quality Gates
    const auftragsphaseId = auftragsschrittFields['Auftragsphase (link)']?.[0]
    let qualityGateItems: any[] = []
    
    if (auftragsphaseId) {
      const auftragsGateItemsTable = base('Auftrags-Quality-Gate-Items')
      qualityGateItems = await auftragsGateItemsTable.select({
        filterByFormula: `{Auftragsphase} = "${auftragsphaseId}"`,
        sort: [{ field: 'Reihenfolge (Sort)', direction: 'asc' }],
      }).all()
    }

    // Prüfe ob letzter Step der Phase
    const istLetzterSchritt = auftragsschrittFields['Ist letzer Schritt der Phase'] === 1 || auftragsschrittFields['Ist letzer Schritt der Phase']?.[0] === 1

    // Prüfe ob alle Actions erledigt (für MVP: wir prüfen das im Frontend)
    // Später: aus Runtime-Tabelle "Auftrags-Actions" lesen

    return NextResponse.json({
      success: true,
      auftragsschritt: {
        id: auftragsschritt.id,
        name: auftragsschrittFields['Name'],
        stepId: stepIdStr,
        stepName: stepFields['Name'],
        istLetzterSchritt: istLetzterSchritt,
        erledigt: auftragsschrittFields['Erledigt?'] === 1 || auftragsschrittFields['Erledigt?']?.[0] === 1,
        nextAuftragsschrittId: auftragsschrittFields['Next Auftragsschritt']?.[0] || null,
        auftragsphaseId: auftragsphaseId,
        fields: auftragsschrittFields,
      },
      actions: actions.map(action => ({
        id: action.id,
        name: (action.fields as any)['Name'],
        beschreibung: (action.fields as any)['Beschreibung'] || '',
        reihenfolgeInStep: (action.fields as any)['Reihenfolge in Step'] || 0,
        reihenfolgeGlobal: (action.fields as any)['Reihenfolge (global)'] || 0,
        pflicht: (action.fields as any)['Pflicht'] || false,
      })),
      qualityGateItems: qualityGateItems.map(item => ({
        id: item.id,
        name: (item.fields as any)['Name'],
        erledigt: (item.fields as any)['Erledigt'] === true || (item.fields as any)['Erledigt'] === 1,
        reihenfolge: (item.fields as any)['Reihenfolge (Sort)'] || 0,
      })),
      debug: {
        stepIdStr,
        stepName: stepFields['Name'],
        actionsCount: actions.length,
      },
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Fehler beim Laden',
      details: error.toString(),
    }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  try {
    const { id: auftragId, stepId } = await params
    const body = await request.json()
    const { actionId, gateItemId, erledigt } = body

    // Für MVP: Actions-Status wird im Frontend verwaltet (später Runtime-Tabelle)
    // Quality Gate Items können wir direkt updaten
    if (gateItemId) {
      const auftragsGateItemsTable = base('Auftrags-Quality-Gate-Items')
      await auftragsGateItemsTable.update([{
        id: gateItemId,
        fields: {
          'Erledigt': erledigt === true || erledigt === 1,
        },
      }])

      return NextResponse.json({
        success: true,
        message: 'Quality Gate Item aktualisiert',
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Keine gültige Aktion',
    }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Fehler beim Update',
      details: error.toString(),
    }, { status: 500 })
  }
}
