import { NextResponse } from 'next/server'
import { completeAuftragsschritt } from '@/lib/services/completeAuftragsschritt'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  try {
    const { id: auftragId, stepId } = await params
    
    const result = await completeAuftragsschritt(auftragId, stepId)

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Auftragsschritt erfolgreich abgeschlossen',
      nextStepId: result.nextStepId,
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Fehler beim Abschließen',
      details: error.toString(),
    }, { status: 500 })
  }
}
