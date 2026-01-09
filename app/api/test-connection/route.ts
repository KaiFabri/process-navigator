import { NextResponse } from 'next/server'
import base from '@/lib/airtable'

export async function GET() {
  try {
    const apiKey = process.env.AIRTABLE_API_KEY
    const baseId = process.env.AIRTABLE_BASE_ID
    
    // Debug: Prüfe ob Credentials vorhanden sind
    if (!apiKey || !baseId) {
      return NextResponse.json({ 
        success: false,
        error: 'Credentials fehlen',
        debug: {
          hasApiKey: !!apiKey,
          hasBaseId: !!baseId,
          baseIdLength: baseId?.length || 0,
          baseIdFormat: baseId ? (baseId.startsWith('app') ? 'OK (beginnt mit app)' : 'FEHLER (sollte mit app beginnen)') : 'nicht gesetzt'
        },
        hint: 'Prüfe deine API Key und Base ID in .env.local'
      }, { status: 500 })
    }
    
    // Prüfe Base ID Format
    if (!baseId.startsWith('app')) {
      return NextResponse.json({ 
        success: false,
        error: 'Base ID Format falsch',
        debug: {
          baseId: baseId.substring(0, 10) + '...',
          expectedFormat: 'appXXXXXXXXXXXXXX (ohne Punkt!)',
          hint: 'Die Base ID sollte mit "app" beginnen, z.B. "appAbC123XyZ456"'
        }
      }, { status: 500 })
    }
    
    // Test 1: Versuche über REST API die Base zu validieren
    const metaResponse = await fetch(
      `https://api.airtable.com/v0/meta/bases/${baseId}/tables`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    )
    
    if (!metaResponse.ok) {
      const errorData = await metaResponse.json().catch(() => ({}))
      return NextResponse.json({ 
        success: false,
        error: `Airtable API Fehler: ${metaResponse.statusText}`,
        status: metaResponse.status,
        details: errorData,
        debug: {
          baseId: baseId.substring(0, 15) + '...',
          apiKeyPrefix: apiKey.substring(0, 5) + '...'
        },
        hint: 'Prüfe: 1) Base ID Format (sollte "app..." sein, OHNE Punkt), 2) API Key Berechtigungen, 3) Base ID existiert'
      }, { status: 500 })
    }
    
    const metaData = await metaResponse.json()
    
    // Test 2: Versuche über SDK eine Tabelle zu lesen
    let sdkTest = null
    try {
      const table = base('Aufträge')
      const records = await table.select({
        maxRecords: 1,
      }).firstPage()
      sdkTest = { success: true, recordsFound: records.length }
    } catch (sdkError: any) {
      sdkTest = { success: false, error: sdkError.message }
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Airtable Verbindung erfolgreich!',
      debug: {
        baseId: baseId.substring(0, 15) + '...',
        tablesFound: metaData.tables?.length || 0,
        tableNames: metaData.tables?.slice(0, 5).map((t: any) => t.name) || [],
        sdkTest: sdkTest
      }
    })
  } catch (error: any) {
    return NextResponse.json({ 
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      hint: 'Prüfe deine API Key und Base ID in .env.local'
    }, { status: 500 })
  }
}



