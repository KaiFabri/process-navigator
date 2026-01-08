import Airtable from 'airtable'

// Airtable Client initialisieren
// Credentials kommen aus .env.local
const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_BASE_ID || '')

export default base



