import { NextResponse } from 'next/server'
import base from '@/lib/airtable'

export async function GET() {
  try {
    const stepsTable = base('Steps')
    
    // Alle Steps laden, sortiert nach "Reihenfolge Global"
    const stepsRecords = await stepsTable.select({
      sort: [{ field: 'Reihenfolge Global', direction: 'asc' }],
    }).all()

    const steps = stepsRecords.map(record => ({
      id: record.id,
      fields: record.fields,
    }))

    return NextResponse.json({
      success: true,
      steps: steps,
      count: steps.length,
    })
  } catch (error: any) {
    return NextResponse.json({ 
      success: false,
      error: error.message,
      details: error.toString(),
    }, { status: 500 })
  }
}

