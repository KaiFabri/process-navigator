import { NextResponse } from 'next/server'
import { initializeAuftrag } from '@/lib/services/initializeAuftrag'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const result = await initializeAuftrag(id)

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Auftrag erfolgreich initialisiert',
      createdPhases: result.createdPhases,
      createdSteps: result.createdSteps,
      createdGateItems: result.createdGateItems,
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Fehler bei der Initialisierung',
      details: error.toString(),
    }, { status: 500 })
  }
}
