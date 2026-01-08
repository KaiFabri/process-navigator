import { NextResponse } from 'next/server'
import base from '@/lib/airtable'

export async function GET() {
  try {
    // Test: Liste alle Tabellen in der Base
    // Das funktioniert nur über die REST API, nicht über das SDK
    // Alternativ: Versuche eine bekannte Tabelle zu lesen
    
    // Für den Test nehmen wir an, dass es eine Tabelle "Aufträge" gibt
    // Falls nicht, ändere den Tabellennamen
    const table = base('Aufträge')
    
    // Versuche einen Record zu lesen (limit 1)
    const records = await table.select({
      maxRecords: 1,
    }).firstPage()
    
    return NextResponse.json({ 
      success: true,
      message: 'Airtable Verbindung erfolgreich!',
      recordsFound: records.length,
      // Zeige nicht die kompletten Records (könnte sensibel sein)
    })
  } catch (error: any) {
    return NextResponse.json({ 
      success: false,
      error: error.message,
      hint: 'Prüfe deine API Key und Base ID in .env.local'
    }, { status: 500 })
  }
}



