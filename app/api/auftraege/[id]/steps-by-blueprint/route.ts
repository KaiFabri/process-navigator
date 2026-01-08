import { NextResponse } from 'next/server'
import base from '@/lib/airtable'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: auftragId } = await params
    const url = new URL(request.url)
    const stepBlueprintId = url.searchParams.get('stepBlueprintId')
    
    if (!stepBlueprintId) {
      return NextResponse.json({
        success: false,
        error: 'stepBlueprintId fehlt',
      }, { status: 400 })
    }

    // Lade Auftrag
    const auftraegeTable = base('Aufträge')
    const auftrag = await auftraegeTable.find(auftragId)
    const auftragFields = auftrag.fields as any

    // Lade alle Auftragsschritte für diesen Auftrag
    const auftragsschritteIds = auftragFields['Auftragsschritte'] || []
    
    if (auftragsschritteIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Keine Auftragsschritte gefunden',
      }, { status: 404 })
    }

    // Lade Auftragsschritte
    const auftragsschritteTable = base('Auftragsschritte')
    const auftragsschritte = await Promise.all(
      auftragsschritteIds.map((id: string) => auftragsschritteTable.find(id))
    )
    
    // Finde den Auftragsschritt, der zu diesem Step (Blueprint) gehört
    const passenderAuftragsschritt = auftragsschritte.find((as: any) => {
      const stepId = as.fields['Step']
      const stepIdStr = Array.isArray(stepId) ? stepId[0] : stepId
      return stepIdStr === stepBlueprintId
    })
    
    if (!passenderAuftragsschritt) {
      return NextResponse.json({
        success: false,
        error: 'Auftragsschritt für diesen Step nicht gefunden',
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      auftragsschrittId: passenderAuftragsschritt.id,
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Fehler beim Laden',
      details: error.toString(),
    }, { status: 500 })
  }
}
