'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Auftrag {
  id: string
  name: string
  status: string
  aktuellerStep: string | null
  kunde: string
  fields: any
}

export default function AuftraegePage() {
  const [auftraege, setAuftraege] = useState<Auftrag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [swimlaneAuftraege, setSwimlaneAuftraege] = useState<Set<string>>(new Set())
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    kunde: '',
    prioritaet: 'Mittel',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadAuftraege()
  }, [])

  const loadAuftraege = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/auftraege')
      const data = await response.json()
      
      if (data.success) {
        setAuftraege(data.auftraege)
      } else {
        setError(data.error || 'Fehler beim Laden')
      }
    } catch (err: any) {
      setError(err.message || 'Fehler beim Laden')
    } finally {
      setLoading(false)
    }
  }

  const toggleSwimlane = (auftragId: string) => {
    const newSet = new Set(swimlaneAuftraege)
    if (newSet.has(auftragId)) {
      newSet.delete(auftragId)
    } else {
      newSet.add(auftragId)
    }
    setSwimlaneAuftraege(newSet)
    // Speichere in localStorage für Persistenz
    localStorage.setItem('swimlaneAuftraege', JSON.stringify(Array.from(newSet)))
  }

  const handleCreateAuftrag = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/auftraege', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        setShowModal(false)
        setFormData({ name: '', kunde: '', prioritaet: 'Mittel' })
        loadAuftraege() // Liste aktualisieren
      } else {
        setError(data.error || 'Fehler beim Erstellen')
      }
    } catch (err: any) {
      setError(err.message || 'Fehler beim Erstellen')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    // Lade gespeicherte Swimlane-Aufträge aus localStorage
    const saved = localStorage.getItem('swimlaneAuftraege')
    if (saved) {
      try {
        setSwimlaneAuftraege(new Set(JSON.parse(saved)))
      } catch (e) {
        // Ignoriere Fehler
      }
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-600">Lade Aufträge...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 text-red-800 p-4 rounded">
            <p className="font-semibold">Fehler</p>
            <p>{error}</p>
            <button
              onClick={loadAuftraege}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Erneut versuchen
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Aufträge im System</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Neuer Auftrag
            </button>
            <button
              onClick={loadAuftraege}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Aktualisieren
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {auftraege.map((auftrag) => (
            <div
              key={auftrag.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-300"
            >
              <Link href={`/auftraege/${auftrag.id}`}>
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <h2 className="text-lg font-semibold text-gray-900">{auftrag.name}</h2>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      auftrag.status === 'Aktiv' ? 'bg-green-100 text-green-800' :
                      auftrag.status === 'Abgeschlossen' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {auftrag.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Kunde:</span>{' '}
                      <span className="font-medium text-gray-900">{auftrag.kunde}</span>
                    </div>
                    {auftrag.aktuellerStep && (
                      <div>
                        <span className="text-gray-500">Aktueller Step:</span>{' '}
                        <span className="font-medium text-gray-900">{auftrag.aktuellerStep}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={swimlaneAuftraege.has(auftrag.id)}
                    onChange={(e) => {
                      e.preventDefault()
                      toggleSwimlane(auftrag.id)
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Swimlane</span>
                </label>
              </div>
            </div>
          ))}
        </div>

        {auftraege.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">Keine Aufträge gefunden.</p>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-600">
          {auftraege.length} Aufträge gefunden
        </div>
      </div>

      {/* Modal für neuen Auftrag */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Neuen Auftrag anlegen</h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  setFormData({ name: '', kunde: '', prioritaet: 'Mittel' })
                  setError(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAuftrag}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Auftragsname"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kunde <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.kunde}
                    onChange={(e) => setFormData({ ...formData, kunde: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Kundenname"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priorität
                  </label>
                  <select
                    value={formData.prioritaet}
                    onChange={(e) => setFormData({ ...formData, prioritaet: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Niedrig">Niedrig</option>
                    <option value="Mittel">Mittel</option>
                    <option value="Hoch">Hoch</option>
                  </select>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-800 p-3 rounded text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setFormData({ name: '', kunde: '', prioritaet: 'Mittel' })
                      setError(null)
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    disabled={submitting}
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {submitting ? 'Erstelle...' : 'Erstellen'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

