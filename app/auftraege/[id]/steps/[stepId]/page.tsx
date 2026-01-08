'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Action {
  id: string
  name: string
  beschreibung: string
  reihenfolge: number
  pflicht: boolean
}

interface QualityGateItem {
  id: string
  name: string
  erledigt: boolean
  reihenfolge: number
}

interface Auftragsschritt {
  id: string
  name: string
  stepId: string
  stepName: string
  istLetzterSchritt: boolean
  erledigt: boolean
  nextAuftragsschrittId: string | null
  auftragsphaseId: string | null
}

export default function StepPage() {
  const params = useParams()
  const [auftragsschritt, setAuftragsschritt] = useState<Auftragsschritt | null>(null)
  const [actions, setActions] = useState<Action[]>([])
  const [qualityGateItems, setQualityGateItems] = useState<QualityGateItem[]>([])
  const [actionStatus, setActionStatus] = useState<Map<string, boolean>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    if (params.id && params.stepId) {
      loadStep()
    }
  }, [params.id, params.stepId])

  const loadStep = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/auftraege/${params.id}/steps/${params.stepId}`)
      const data = await response.json()
      
      if (data.success) {
        setAuftragsschritt(data.auftragsschritt)
        setActions(data.actions)
        setQualityGateItems(data.qualityGateItems)
        
        // Initialisiere Action-Status (für MVP: im Frontend-State)
        const initialStatus = new Map<string, boolean>()
        data.actions.forEach((action: Action) => {
          initialStatus.set(action.id, false)
        })
        setActionStatus(initialStatus)
      } else {
        setError(data.error || 'Fehler beim Laden')
      }
    } catch (err: any) {
      setError(err.message || 'Fehler beim Laden')
    } finally {
      setLoading(false)
    }
  }

  const toggleAction = (actionId: string) => {
    const newStatus = new Map(actionStatus)
    newStatus.set(actionId, !newStatus.get(actionId))
    setActionStatus(newStatus)
  }

  const toggleGateItem = async (gateItemId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/auftraege/${params.id}/steps/${params.stepId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gateItemId,
          erledigt: !currentStatus,
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        // Update lokal
        setQualityGateItems(prev => 
          prev.map(item => 
            item.id === gateItemId 
              ? { ...item, erledigt: !currentStatus }
              : item
          )
        )
      } else {
        setError(data.error || 'Fehler beim Update')
      }
    } catch (err: any) {
      setError(err.message || 'Fehler beim Update')
    }
  }

  const handleComplete = async () => {
    if (!auftragsschritt) return

    setCompleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/auftraege/${params.id}/steps/${params.stepId}/complete`, {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        // Zurück zur Auftrags-Detail-Seite
        window.location.href = `/auftraege/${params.id}`
      } else {
        // Zeige Fehler als Info (nicht als roter Fehler)
        alert(data.error || 'Fehler beim Abschließen')
      }
    } catch (err: any) {
      setError(err.message || 'Fehler beim Abschließen')
    } finally {
      setCompleting(false)
    }
  }

  // Prüfe ob alle Actions erledigt
  const allActionsDone = actions.length > 0 && actions.every(action => actionStatus.get(action.id) === true)

  // Prüfe ob alle Quality Gate Items erledigt (nur wenn letzter Step)
  const allGatesDone = qualityGateItems.length === 0 || qualityGateItems.every(item => item.erledigt)

  // Button enabled: Alle Actions erledigt (Gates werden beim Abschließen geprüft)
  const canComplete = allActionsDone

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-600">Lade Auftragsschritt...</p>
        </div>
      </div>
    )
  }

  if (error || !auftragsschritt) {
    return (
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 text-red-800 p-4 rounded">
            <p className="font-semibold">Fehler</p>
            <p>{error || 'Auftragsschritt nicht gefunden'}</p>
            <Link
              href={`/auftraege/${params.id}`}
              className="mt-4 inline-block bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Zurück zum Auftrag
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
            href={`/auftraege/${params.id}`}
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← Zurück zum Auftrag
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{auftragsschritt.stepName}</h1>
            <p className="text-gray-600">Auftragsschritt: {auftragsschritt.name}</p>
          </div>

          {/* Actions Checkliste */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Arbeitsschritte</h2>
            {actions.length === 0 ? (
              <p className="text-gray-500">Keine Actions für diesen Step definiert.</p>
            ) : (
              <div className="space-y-3">
                {actions.map((action) => (
                  <label
                    key={action.id}
                    className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={actionStatus.get(action.id) || false}
                      onChange={() => toggleAction(action.id)}
                      className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{action.name}</div>
                      {action.beschreibung && (
                        <div className="text-sm text-gray-600 mt-1">{action.beschreibung}</div>
                      )}
                      {action.pflicht && (
                        <span className="inline-block mt-1 text-xs text-red-600 font-medium">Pflicht</span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Quality Gate Items (nur wenn letzter Step) */}
          {auftragsschritt.istLetzterSchritt && qualityGateItems.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quality Gate</h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  Dies ist der letzte Schritt der Phase. Bitte prüfen Sie alle Quality Gate Items, bevor Sie fortfahren.
                </p>
              </div>
              <div className="space-y-3">
                {qualityGateItems.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-start gap-3 p-3 border border-yellow-200 rounded-lg hover:bg-yellow-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={item.erledigt}
                      onChange={() => toggleGateItem(item.id, item.erledigt)}
                      className="mt-1 h-5 w-5 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{item.name}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Button */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleComplete}
              disabled={!canComplete || completing}
              className={`w-full px-6 py-3 rounded-lg font-semibold ${
                canComplete
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              } disabled:opacity-50`}
            >
              {completing ? 'Wird abgeschlossen...' : 'Auftrags-Schritt abschließen'}
            </button>
            {!canComplete && (
              <p className="mt-2 text-sm text-gray-600 text-center">
                Bitte alle Arbeitsschritte abarbeiten
              </p>
            )}
            {canComplete && auftragsschritt?.istLetzterSchritt && !allGatesDone && qualityGateItems.length > 0 && (
              <p className="mt-2 text-sm text-yellow-600 text-center">
                Hinweis: Bitte Quality Gate Items prüfen, bevor Sie abschließen
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
