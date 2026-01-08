'use client'

import { useState } from 'react'

export default function Home() {
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [tablesData, setTablesData] = useState<any>(null)
  const [tablesLoading, setTablesLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-connection')
      const data = await response.json()
      setTestResult(data)
    } catch (error) {
      setTestResult({ success: false, error: 'Fehler beim Testen' })
    } finally {
      setLoading(false)
    }
  }

  const loadTables = async () => {
    setTablesLoading(true)
    try {
      const response = await fetch('/api/tables')
      const data = await response.json()
      setTablesData(data)
    } catch (error) {
      setTablesData({ error: 'Fehler beim Laden' })
    } finally {
      setTablesLoading(false)
    }
  }

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Process Navigator</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Verbindungstest */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Airtable Verbindung testen</h2>
            <button
              onClick={testConnection}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 mb-4"
            >
              {loading ? 'Teste...' : 'Verbindung testen'}
            </button>
            
            {testResult && (
              <div className={`p-4 rounded ${testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                <p className="font-semibold">{testResult.success ? '✓ Erfolgreich' : '✗ Fehler'}</p>
                <pre className="mt-2 text-sm overflow-auto">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Tabellen & Auftrag */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Tabellen & Auftrag</h2>
            <div className="flex gap-2 mb-4">
              <button
                onClick={loadTables}
                disabled={tablesLoading}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {tablesLoading ? 'Lade...' : 'Tabellen & Auftrag laden'}
              </button>
              <button
                onClick={async () => {
                  setTablesLoading(true)
                  try {
                    const response = await fetch('/api/steps')
                    const data = await response.json()
                    setTablesData({ ...tablesData, steps: data })
                  } catch (error) {
                    setTablesData({ ...tablesData, steps: { error: 'Fehler beim Laden' } })
                  } finally {
                    setTablesLoading(false)
                  }
                }}
                disabled={tablesLoading}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
              >
                Steps laden
              </button>
            </div>
            
            {tablesData && (
              <div className="space-y-4">
                {tablesData.error ? (
                  <div className="bg-red-50 text-red-800 p-4 rounded">
                    <p className="font-semibold">Fehler</p>
                    <p className="text-sm">{tablesData.error}</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <h3 className="font-semibold mb-2">Tabellen ({tablesData.tables?.length || 0}):</h3>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {tablesData.tables?.map((table: any) => (
                          <li key={table.id}>{table.name}</li>
                        ))}
                      </ul>
                    </div>
                    
                    {tablesData.auftrag && (
                      <div className="bg-gray-50 p-4 rounded mb-4">
                        <h3 className="font-semibold mb-2">Erster Auftrag:</h3>
                        <pre className="text-xs overflow-auto">
                          {JSON.stringify(tablesData.auftrag, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    {tablesData.steps && (
                      <div className="bg-gray-50 p-4 rounded">
                        <h3 className="font-semibold mb-2">Steps ({tablesData.steps.count || tablesData.steps.steps?.length || 0}):</h3>
                        {tablesData.steps.error ? (
                          <p className="text-red-600 text-sm">{tablesData.steps.error}</p>
                        ) : (
                          <pre className="text-xs overflow-auto max-h-96">
                            {JSON.stringify(tablesData.steps.steps?.slice(0, 5) || [], null, 2)}
                            {tablesData.steps.steps?.length > 5 && <p className="text-gray-500 mt-2">... und {tablesData.steps.steps.length - 5} weitere</p>}
                          </pre>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
