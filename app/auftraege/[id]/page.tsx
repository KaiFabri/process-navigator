'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Auftrag {
  id: string
  name: string
  status: string
  aktuellerStep: string | null
  kunde: string
  prioritaet: string
  erstelltAm: string | null
  aktualisiertAm: string | null
  offeneStoerungen: number
  ampel: 'green' | 'yellow' | 'red'
  fields?: any
}

export default function AuftragDetailPage() {
  const params = useParams()
  const [auftrag, setAuftrag] = useState<Auftrag | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [initializing, setInitializing] = useState(false)

  useEffect(() => {
    if (params.id) {
      loadAuftrag(params.id as string)
    }
  }, [params.id])

  const loadAuftrag = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/auftraege/${id}`)
      const data = await response.json()
      
      if (data.success) {
        setAuftrag(data.auftrag)
      } else {
        setError(data.error || 'Fehler beim Laden')
      }
    } catch (err: any) {
      setError(err.message || 'Fehler beim Laden')
    } finally {
      setLoading(false)
    }
  }

  const handleInitialize = async () => {
    if (!auftrag) return
    
    setInitializing(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/auftraege/${auftrag.id}/initialize`, {
        method: 'POST',
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Seite neu laden
        await loadAuftrag(auftrag.id)
      } else {
        setError(data.error || 'Fehler bei der Initialisierung')
      }
    } catch (err: any) {
      setError(err.message || 'Fehler bei der Initialisierung')
    } finally {
      setInitializing(false)
    }
  }

  // Prüfe ob bereits initialisiert
  const isInitialized = auftrag?.fields?.['Init_Steps_Done'] || auftrag?.fields?.['Init_Phases_Done']

  // Formatiere Datum
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Nicht verfügbar'
    try {
      // Airtable gibt Datumswerte als ISO-String zurück
      // Wenn es ein ISO-String ist, wird er korrekt als UTC interpretiert
      // und dann in die lokale Zeitzone konvertiert
      let date: Date
      
      // Prüfe ob es ein ISO-String ist (enthält 'T' oder 'Z')
      if (typeof dateStr === 'string' && (dateStr.includes('T') || dateStr.includes('Z'))) {
        // ISO-String: wird automatisch korrekt geparst
        date = new Date(dateStr)
      } else {
        // Anderes Format: versuche es trotzdem zu parsen
        date = new Date(dateStr)
      }
      
      // Prüfe ob das Datum gültig ist
      if (isNaN(date.getTime())) {
        return dateStr
      }
      
      // Formatiere in lokaler Zeitzone
      return date.toLocaleString('de-DE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      })
    } catch {
      return dateStr
    }
  }

  // Ampel-Farbe
  const getAmpelColor = (ampel: string) => {
    switch (ampel) {
      case 'red':
        return 'bg-red-500'
      case 'yellow':
        return 'bg-yellow-500'
      default:
        return 'bg-green-500'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-600">Lade Auftrag...</p>
        </div>
      </div>
    )
  }

  if (error || !auftrag) {
    return (
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 text-red-800 p-4 rounded">
            <p className="font-semibold">Fehler</p>
            <p>{error || 'Auftrag nicht gefunden'}</p>
            <Link
              href="/auftraege"
              className="mt-4 inline-block bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Zurück zur Übersicht
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link
            href="/auftraege"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← Zurück zur Übersicht
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{auftrag.name}</h1>
              <span className={`px-3 py-1 text-sm font-medium rounded ${
                auftrag.status === 'Aktiv' ? 'bg-green-100 text-green-800' :
                auftrag.status === 'Abgeschlossen' ? 'bg-gray-100 text-gray-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {auftrag.status}
              </span>
            </div>
            <div className="flex gap-2">
              {!isInitialized && (
                <button
                  onClick={handleInitialize}
                  disabled={initializing}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {initializing ? 'Initialisiere...' : 'Initialisieren'}
                </button>
              )}
              <button
                onClick={() => loadAuftrag(auftrag.id)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Aktualisieren
              </button>
            </div>
          </div>

          {/* Aktueller Step */}
          {auftrag.fields?.['Aktueller Auftragsschritt'] && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Aktueller Auftragsschritt</h3>
              <p className="text-lg font-semibold text-gray-900 mb-3">
                {auftrag.aktuellerStep || 'Unbekannt'}
              </p>
              <Link
                href={`/auftraege/${auftrag.id}/steps/${Array.isArray(auftrag.fields['Aktueller Auftragsschritt']) ? auftrag.fields['Aktueller Auftragsschritt'][0] : auftrag.fields['Aktueller Auftragsschritt']}`}
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Auftragsschritt bearbeiten
              </Link>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Details */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Priorität</h3>
                <p className="text-lg font-semibold text-gray-900">{auftrag.prioritaet}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Erstellt am</h3>
                <p className="text-base text-gray-900">{formatDate(auftrag.erstelltAm)}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Aktualisiert am</h3>
                <p className="text-base text-gray-900">{formatDate(auftrag.aktualisiertAm)}</p>
              </div>
            </div>

            {/* Störungen */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Störungen</h2>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-4 mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1"># Offene Störungen</h3>
                    <p className="text-2xl font-bold text-gray-900">{auftrag.offeneStoerungen}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Ampel</h3>
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full ${getAmpelColor(auftrag.ampel)}`}></div>
                      <span className="text-sm text-gray-700">
                        {auftrag.ampel === 'red' ? 'Rot' : auftrag.ampel === 'yellow' ? 'Gelb' : 'Grün'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
