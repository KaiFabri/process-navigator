import { NextResponse } from 'next/server'
import base from '@/lib/airtable'

export async function GET() {
  try {
    // Airtable SDK hat keine direkte Methode, um alle Tabellen zu listen
    // Wir müssen die REST API nutzen
    const apiKey = process.env.AIRTABLE_API_KEY
    const baseId = process.env.AIRTABLE_BASE_ID
    
    if (!apiKey || !baseId) {
      return NextResponse.json({ 
        error: 'Airtable credentials fehlen' 
      }, { status: 500 })
    }

    // Tabellen über REST API holen
    const tablesResponse = await fetch(
      `https://api.airtable.com/v0/meta/bases/${baseId}/tables`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    )

    if (!tablesResponse.ok) {
      throw new Error(`Airtable API Error: ${tablesResponse.statusText}`)
    }

    const tablesData = await tablesResponse.json()
    const tableNames = tablesData.tables.map((table: any) => ({
      id: table.id,
      name: table.name,
    }))

    // Einen Auftrag aus der "Aufträge" Tabelle lesen
    // Ohne Sortierung - einfach den ersten Record
    const auftraegeTable = base('Aufträge')
    const auftragRecords = await auftraegeTable.select({
      maxRecords: 1,
    }).firstPage()

    let auftrag = null
    if (auftragRecords.length > 0) {
      auftrag = {
        id: auftragRecords[0].id,
        fields: auftragRecords[0].fields,
      }
    }

    return NextResponse.json({
      tables: tableNames,
      auftrag: auftrag,
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      details: error.toString(),
    }, { status: 500 })
  }
}


