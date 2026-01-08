'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface Step {
  id: string
  name: string
  laneName: string
  phaseName: string
  fields: any
}

interface QualityGate {
  id: string
  name: string
  phaseName: string
}

interface Auftrag {
  id: string
  name: string
  status: string
  aktuellerStep: string | null
  aktuellerStepId: string | null
  kunde: string
  phaseName: string | null
  laneName: string | null
  offeneStoerungen: number
  ampel: 'green' | 'yellow' | 'red'
}

interface Action {
  id: string
  name: string
  beschreibung: string
  reihenfolgeInStep: number
  reihenfolgeGlobal: number
  pflicht: boolean
}

interface QualityGateItem {
  id: string
  name: string
  erledigt: boolean
  reihenfolge: number
}

export default function SwimlanePage() {
  const [steps, setSteps] = useState<Step[]>([])
  const [lanes, setLanes] = useState<string[]>([])
  const [phases, setPhases] = useState<string[]>([])
  const [qualityGates, setQualityGates] = useState<QualityGate[]>([])
  const [auftraege, setAuftraege] = useState<Auftrag[]>([])
  const [swimlaneAuftraege, setSwimlaneAuftraege] = useState<Set<string>>(new Set())
  const [filteredAuftragId, setFilteredAuftragId] = useState<string | null>(null)
  const [selectedStep, setSelectedStep] = useState<{ auftragId: string; stepId: string; stepName: string } | null>(null)
  const [actions, setActions] = useState<Action[]>([])
  const [qualityGateItems, setQualityGateItems] = useState<QualityGateItem[]>([])
  const [actionStatus, setActionStatus] = useState<Map<string, boolean>>(new Map())
  const [loadingActions, setLoadingActions] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const lanesContainerRef = useRef<HTMLDivElement>(null)
  const [lanesHeight, setLanesHeight] = useState(0)

  useEffect(() => {
    loadSwimlane()
  }, [])

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

  useEffect(() => {
    // Lade Aufträge, wenn Swimlane-Aufträge ausgewählt sind UND steps geladen sind
    if (swimlaneAuftraege.size > 0 && steps.length > 0) {
      loadAuftraege()
    }
  }, [swimlaneAuftraege, steps])

  useEffect(() => {
    // Berechne die tatsächliche Höhe aller Lanes
    if (lanesContainerRef.current) {
      const height = lanesContainerRef.current.offsetHeight
      setLanesHeight(height)
    }
  }, [lanes, steps, auftraege])

  const loadSwimlane = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/swimlane')
      const data = await response.json()
      
      if (data.success) {
        setSteps(data.steps)
        setLanes(data.lanes || [])
        setPhases(data.phases || [])
        setQualityGates(data.qualityGates || [])
      } else {
        setError(data.error || 'Fehler beim Laden')
      }
    } catch (err: any) {
      setError(err.message || 'Fehler beim Laden')
    } finally {
      setLoading(false)
    }
  }

  const loadAuftraege = async () => {
    try {
      const response = await fetch('/api/auftraege')
      const data = await response.json()
      
      if (data.success) {
        // Filtere nur Aufträge, die in Swimlane ausgewählt sind
        let selectedAuftraege = data.auftraege.filter((a: any) => 
          swimlaneAuftraege.has(a.id)
        )
        
        // Wenn ein Auftrag gefiltert ist, zeige nur diesen
        if (filteredAuftragId) {
          selectedAuftraege = selectedAuftraege.filter((a: any) => a.id === filteredAuftragId)
        }
        
        // Finde Phase und Lane für jeden Auftrag basierend auf aktuellem Step
        const auftraegeWithPhase = selectedAuftraege.map((auftrag: any) => {
          // Finde den Step, der dem aktuellen Step-Namen entspricht
          const currentStep = steps.find(s => 
            s.name === auftrag.aktuellerStep
          )
          
          return {
            ...auftrag,
            phaseName: currentStep?.phaseName || null,
            laneName: currentStep?.laneName || null,
            aktuellerStepId: auftrag.fields?.['Aktueller Auftragsschritt']?.[0] || null,
          }
        })
        
        setAuftraege(auftraegeWithPhase)
      }
    } catch (err) {
      console.error('Fehler beim Laden der Aufträge:', err)
    }
  }

  useEffect(() => {
    // Lade Aufträge neu wenn Filter geändert wird
    if (swimlaneAuftraege.size > 0 && steps.length > 0) {
      loadAuftraege()
    }
  }, [filteredAuftragId])

  const handleAuftragClick = (auftragId: string) => {
    setFilteredAuftragId(auftragId)
  }

  const loadStepForAuftrag = async (auftragId: string, stepBlueprintId: string, stepName: string) => {
    try {
      const response = await fetch(`/api/auftraege/${auftragId}/steps-by-blueprint?stepBlueprintId=${stepBlueprintId}`)
      const data = await response.json()
      
      if (data.success) {
        handleStepClick(auftragId, data.auftragsschrittId, stepName)
      } else {
        setError(data.error || 'Auftragsschritt nicht gefunden')
      }
    } catch (err: any) {
      setError(err.message || 'Fehler beim Laden')
    }
  }

  const handleStepClick = async (auftragId: string, stepId: string, stepName: string) => {
    setSelectedStep({ auftragId, stepId, stepName })
    setLoadingActions(true)
    setError(null)

    try {
      const response = await fetch(`/api/auftraege/${auftragId}/steps/${stepId}`)
      const data = await response.json()

      if (data.success) {
        console.log('Actions geladen:', data.actions.length, 'für Step:', data.debug?.stepName)
        console.log('Debug Info:', data.debug)
        setActions(data.actions)
        setQualityGateItems(data.qualityGateItems)

        // Initialisiere Action-Status
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
      setLoadingActions(false)
    }
  }

  const toggleAction = (actionId: string) => {
    const newStatus = new Map(actionStatus)
    newStatus.set(actionId, !newStatus.get(actionId))
    setActionStatus(newStatus)
  }

  const toggleGateItem = async (gateItemId: string, currentStatus: boolean) => {
    if (!selectedStep) return

    try {
      const response = await fetch(`/api/auftraege/${selectedStep.auftragId}/steps/${selectedStep.stepId}`, {
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

  const handleCompleteStep = async () => {
    if (!selectedStep) return

    try {
      const response = await fetch(`/api/auftraege/${selectedStep.auftragId}/steps/${selectedStep.stepId}/complete`, {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        // Schließe Panel und lade neu
        setSelectedStep(null)
        await loadAuftraege()
        await loadSwimlane()
      } else {
        // Zeige Fehler als Info (nicht als roter Fehler)
        alert(data.error || 'Fehler beim Abschließen')
      }
    } catch (err: any) {
      setError(err.message || 'Fehler beim Abschließen')
    }
  }

  // Finde Quality Gate nach einer Phase (zeigt nach welcher Phase es kommt)
  const getQualityGateAfterPhase = (phaseName: string) => {
    return qualityGates.find(gate => gate.phaseName === phaseName)
  }

  // Berechne die Breite einer Phase basierend auf Anzahl Steps
  const getPhaseWidth = (phaseName: string) => {
    const phaseSteps = getStepsByPhase(phaseName)
    // Jeder Step ist exakt 120px breit + 8px gap = 128px
    // Plus 16px Padding links und rechts = 32px
    // Mindestbreite: 120px
    if (phaseSteps.length === 0) return 120
    return phaseSteps.length * 128 + 32
  }

  // Gruppiere Steps nach Phasen
  const getStepsByPhase = (phaseName: string) => {
    return steps.filter(s => s.phaseName === phaseName)
  }

  // Berechne die Gesamtbreite aller Phasen
  const getTotalWidth = () => {
    const total = phases.reduce((sum, phaseName) => {
      const width = getPhaseWidth(phaseName)
      return sum + width + 12 // 12px gap zwischen Phasen (gap-3)
    }, 0)
    return total
  }

  // Finde Aufträge für einen bestimmten Step
  const getAuftraegeForStep = (stepId: string, stepName: string, laneName: string) => {
    return auftraege.filter(a => 
      a.aktuellerStep === stepName || a.aktuellerStep === stepId
    ).filter(a => a.laneName === laneName)
  }

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-600">Lade Swimlane...</p>
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
              onClick={loadSwimlane}
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
          <div>
            <h1 className="text-3xl font-bold">Process Navigator - Swimlane</h1>
            {filteredAuftragId && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm text-gray-600">Filter: Ein Auftrag</span>
                <button
                  onClick={() => setFilteredAuftragId(null)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Filter zurücksetzen
                </button>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Link
              href="/auftraege"
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Aufträge verwalten
            </Link>
            <button
              onClick={loadSwimlane}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Aktualisieren
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow relative" style={{ overflowX: 'auto', minWidth: `${getTotalWidth() + 200}px` }}>
          {/* Phasen-Header oben mit Quality Gates */}
          <div className="border-b-2 border-gray-300 sticky top-0 bg-white z-20 relative" style={{ paddingTop: '50px' }}>
            <div className="flex gap-4 p-4">
              <div className="font-semibold text-gray-700 flex-shrink-0" style={{ width: '150px' }}>Phasen</div>
              <div className="flex gap-3 items-start relative flex-nowrap" style={{ width: `${getTotalWidth()}px`, minWidth: `${getTotalWidth()}px`, flexShrink: 0 }}>
                {phases.map((phaseName, index) => {
                  const phaseSteps = getStepsByPhase(phaseName)
                  const phaseWidth = getPhaseWidth(phaseName)
                  const gateAfter = getQualityGateAfterPhase(phaseName)
                  
                  return (
                    <div key={phaseName} className="flex flex-col items-start gap-2 relative flex-shrink-0" style={{ width: `${phaseWidth}px`, minWidth: `${phaseWidth}px` }}>
                      {/* Quality Gate am Ende der Phase - etwas nach rechts verschoben, zwischen Phasen */}
                      {gateAfter && (
                        <div className="absolute right-0 top-[-50px] flex flex-col items-center z-30" style={{ transform: 'translateX(calc(50% + 8px))' }}>
                          {/* Gate Name - über der Raute, größer */}
                          <div className="text-sm font-semibold text-yellow-700 bg-yellow-100 px-2 py-1 rounded mb-1 whitespace-nowrap border border-yellow-300 shadow-sm">
                            {gateAfter.name}
                          </div>
                          {/* Diamant-Form */}
                          <div className="relative">
                            <div className="w-7 h-7 bg-yellow-400 transform rotate-45 border-2 border-yellow-600 shadow-sm"></div>
                          </div>
                          {/* Vertikale Linie nach unten bis zum Ende der letzten Lane */}
                          <div className="w-0.5 bg-yellow-400 mt-0.5" style={{ height: `${lanesHeight + 20}px` }}></div>
                        </div>
                      )}
                      <div className="bg-gray-200 px-4 py-2 rounded text-sm font-semibold text-gray-700 w-full text-center" style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {index + 1}. {phaseName}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Lanes mit Steps */}
          <div ref={lanesContainerRef}>
            {lanes.map((laneName, laneIndex) => (
              <div
                key={laneName}
                className={`border-b border-gray-200 relative ${
                  laneIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                <div className="flex gap-4 p-4">
                  {/* Lane Name */}
                  <div className="font-semibold text-gray-800 flex items-center flex-shrink-0" style={{ width: '150px' }}>
                    {laneName}
                  </div>

                  {/* Steps gruppiert nach Phasen */}
                  <div className="flex gap-3 items-start min-h-[60px] flex-nowrap" style={{ width: `${getTotalWidth()}px`, minWidth: `${getTotalWidth()}px`, flexShrink: 0 }}>
                    {phases.map((phaseName) => {
                      const phaseSteps = getStepsByPhase(phaseName)
                      const phaseWidth = getPhaseWidth(phaseName)
                      
                      return (
                        <div
                          key={phaseName}
                          className="flex flex-col gap-2 px-2 overflow-visible flex-shrink-0"
                          style={{ width: `${phaseWidth}px`, minWidth: `${phaseWidth}px`, flexShrink: 0 }}
                        >
                          {/* Steps in dieser Phase */}
                          <div className="flex gap-2 items-center flex-wrap">
                            {phaseSteps.map((step) => {
                              const isInThisLane = step.laneName === laneName
                              const stepAuftraege = isInThisLane ? getAuftraegeForStep(step.id, step.name, laneName) : []
                              
                              return (
                                <div key={step.id} className="flex flex-col gap-1">
                                  {/* Step Box */}
                                  <div
                                    onClick={() => {
                                      if (isInThisLane && stepAuftraege.length > 0 && filteredAuftragId) {
                                        const auftrag = stepAuftraege[0]
                                        // Finde den Auftragsschritt für diesen Step
                                        // Für MVP: Wir müssen den Auftragsschritt-ID finden, der zu diesem Step gehört
                                        // Später: Bessere Logik mit Auftragsschritte-API
                                        if (auftrag.id === filteredAuftragId) {
                                          // Lade Auftragsschritte für diesen Auftrag und finde den passenden
                                          loadStepForAuftrag(auftrag.id, step.id, step.name)
                                        }
                                      }
                                    }}
                                    className={`${
                                      isInThisLane
                                        ? filteredAuftragId && stepAuftraege.some(a => a.id === filteredAuftragId)
                                          ? 'bg-blue-100 border-2 border-blue-400 text-blue-900 hover:bg-blue-200 cursor-pointer shadow-sm'
                                          : 'bg-blue-50 border-2 border-blue-300 text-blue-800'
                                        : 'border-2 border-transparent'
                                    } rounded px-2 py-2 text-xs font-medium transition-colors flex items-center justify-center flex-shrink-0`}
                                    style={{ 
                                      width: '120px', 
                                      height: '50px',
                                      minWidth: '120px',
                                      maxWidth: '120px'
                                    }}
                                    title={isInThisLane && filteredAuftragId ? `${step.name} (${step.phaseName}) - Klicken zum Bearbeiten` : ''}
                                  >
                                    {isInThisLane ? (
                                      <span className="text-center leading-tight break-words hyphens-auto" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{step.name}</span>
                                    ) : (
                                      <span className="invisible">{step.name}</span>
                                    )}
                                  </div>
                                  
                                  {/* Aufträge unter diesem Step */}
                                  {isInThisLane && stepAuftraege.length > 0 && (
                                    <div className="flex flex-col gap-1 mt-1">
                                      {stepAuftraege.map((auftrag) => {
                                        const ampelColor = auftrag.ampel === 'red' ? 'bg-red-500' : 
                                                          auftrag.ampel === 'yellow' ? 'bg-yellow-500' : 
                                                          'bg-green-500'
                                        return (
                                          <div
                                            key={auftrag.id}
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleAuftragClick(auftrag.id)
                                            }}
                                            className="bg-white border border-gray-300 text-gray-900 text-xs px-2 py-1 rounded hover:bg-gray-50 transition-colors cursor-pointer shadow-sm flex items-center gap-1"
                                            style={{ width: '120px', fontSize: '10px' }}
                                            title={`${auftrag.name} - Klicken für Auftrags-Swimlane`}
                                          >
                                            <div className={`w-2 h-2 rounded-full ${ampelColor} flex-shrink-0`}></div>
                                            <div className="truncate flex-1">{auftrag.name}</div>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          {steps.length} Steps in {lanes.length} Lanes, {phases.length} Phasen, {qualityGates.length} Quality Gates
          {auftraege.length > 0 && `, ${auftraege.length} Aufträge in Swimlane`}
        </div>
      </div>

      {/* Actions Panel */}
      {selectedStep && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedStep.stepName}</h2>
                <p className="text-sm text-gray-600">Auftragsschritt bearbeiten</p>
              </div>
              <button
                onClick={() => {
                  setSelectedStep(null)
                  setActions([])
                  setQualityGateItems([])
                  setActionStatus(new Map())
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {loadingActions ? (
              <p className="text-gray-600">Lade Actions...</p>
            ) : (
              <>
                {/* Actions Checkliste */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Arbeitsschritte</h3>
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

                {/* Quality Gate Items */}
                {qualityGateItems.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Quality Gate</h3>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-yellow-800">
                        Dies ist der letzte Schritt der Phase. Bitte prüfen Sie alle Quality Gate Items.
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
                  {(() => {
                    const allActionsDone = actions.length > 0 && actions.every(action => actionStatus.get(action.id) === true)
                    const allGatesDone = qualityGateItems.length === 0 || qualityGateItems.every(item => item.erledigt)
                    // Button enabled wenn Actions fertig sind (Gates werden beim Abschließen geprüft)
                    const canComplete = allActionsDone

                    return (
                      <>
                        <button
                          onClick={handleCompleteStep}
                          disabled={!canComplete}
                          className={`w-full px-6 py-3 rounded-lg font-semibold ${
                            canComplete
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          } disabled:opacity-50`}
                        >
                          Auftrags-Schritt abschließen
                        </button>
                        {!canComplete && (
                          <p className="mt-2 text-sm text-gray-600 text-center">
                            Bitte alle Arbeitsschritte abarbeiten
                          </p>
                        )}
                        {canComplete && !allGatesDone && qualityGateItems.length > 0 && (
                          <p className="mt-2 text-sm text-yellow-600 text-center">
                            Hinweis: Bitte Quality Gate Items prüfen, bevor Sie abschließen
                          </p>
                        )}
                      </>
                    )
                  })()}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
