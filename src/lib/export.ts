import JSZip from 'jszip'
import { supabase } from './supabase'
import { downloadFile } from './storage'
import { STATUSES } from '../constants/statuses'
import type { StatusKey } from '../constants/statuses'

// ---------------------------------------------------------------------------
// CSV helper
// ---------------------------------------------------------------------------

type CsvColumn<T> = { key: keyof T; header: string }

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(';') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

export function toCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: CsvColumn<T>[],
): string {
  const BOM = '\uFEFF'
  const header = columns.map((c) => escapeCsvValue(c.header)).join(';')
  const body = rows
    .map((row) =>
      columns.map((c) => escapeCsvValue(row[c.key])).join(';'),
    )
    .join('\n')
  return BOM + header + '\n' + body
}

// ---------------------------------------------------------------------------
// Filename helpers (today's date, no date-fns needed — just formatting)
// ---------------------------------------------------------------------------

function todayStr(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function getReservationsFilename(): string {
  return `reservations-${todayStr()}.csv`
}

export function getFinancesFilename(): string {
  return `finances-${todayStr()}.zip`
}

export function getFullExportFilename(): string {
  return `export-gites-complet-${todayStr()}.zip`
}

// ---------------------------------------------------------------------------
// Per-table CSV builders
// ---------------------------------------------------------------------------

export async function getReservationsCsv(): Promise<string> {
  const { data: gites, error: gError } = await supabase
    .from('gites')
    .select('id, name')
  if (gError) throw new Error('Could not load gites')

  const giteMap = new Map((gites ?? []).map((g) => [g.id, g.name]))

  const { data: reservations, error } = await supabase
    .from('reservations')
    .select('*')
    .order('start_date', { ascending: true })
  if (error) throw new Error('Could not load reservations')

  type Row = {
    gite: string
    client_name: string
    start_date: string
    end_date: string
    status: string
    guest_count: number | string
    total_amount: number
    paid_amount: number
    remaining: number
    linen_sets_double: number | string
    linen_sets_single: number | string
    contract: string
    notes: string
    created_at: string
  }

  const rows: Row[] = (reservations ?? []).map((r) => ({
    gite: giteMap.get(r.gite_id) ?? r.gite_id,
    client_name: r.client_name,
    start_date: r.start_date,
    end_date: r.end_date,
    status: STATUSES[r.status as StatusKey]?.label ?? r.status,
    guest_count: r.guest_count ?? '',
    total_amount: r.total_amount,
    paid_amount: r.paid_amount,
    remaining: r.total_amount - r.paid_amount,
    linen_sets_double: r.linen_sets_double ?? '',
    linen_sets_single: r.linen_sets_single ?? '',
    contract: r.contract_path ? (r.contract_path.split('/').pop() ?? '') : '',
    notes: r.notes ?? '',
    created_at: r.created_at,
  }))

  return toCsv(rows, [
    { key: 'gite', header: 'Gîte' },
    { key: 'client_name', header: 'Client' },
    { key: 'start_date', header: 'Date arrivée' },
    { key: 'end_date', header: 'Date départ' },
    { key: 'status', header: 'Statut' },
    { key: 'guest_count', header: 'Nb personnes' },
    { key: 'total_amount', header: 'Total (€)' },
    { key: 'paid_amount', header: 'Payé (€)' },
    { key: 'remaining', header: 'Reste (€)' },
    { key: 'linen_sets_double', header: 'Draps doubles' },
    { key: 'linen_sets_single', header: 'Draps simples' },
    { key: 'contract', header: 'Contrat (fichier)' },
    { key: 'notes', header: 'Notes' },
    { key: 'created_at', header: 'Créée le' },
  ])
}

export async function getRevenuesCsv(): Promise<string> {
  const { data, error } = await supabase
    .from('revenue_entries')
    .select('*')
    .order('year', { ascending: true })
    .order('quarter', { ascending: true })
  if (error) throw new Error('Could not load revenue_entries')

  type Row = {
    year: number
    quarter: number
    gite_label: string
    entry_date: string | null
    amount: number
    notes: string | null
    created_at: string
  }

  return toCsv<Row>(data ?? [], [
    { key: 'year', header: 'Année' },
    { key: 'quarter', header: 'Trimestre' },
    { key: 'gite_label', header: 'Gîte' },
    { key: 'entry_date', header: 'Date' },
    { key: 'amount', header: 'Montant (€)' },
    { key: 'notes', header: 'Notes' },
    { key: 'created_at', header: 'Créée le' },
  ])
}

export async function getTaxStaysCsv(): Promise<string> {
  const { data, error } = await supabase
    .from('tax_stays')
    .select('*')
    .order('year', { ascending: true })
    .order('quarter', { ascending: true })
  if (error) throw new Error('Could not load tax_stays')

  type Row = {
    year: number
    quarter: number
    gite_label: string
    stay_dates: string | null
    nights_count: number
    adult_count: number
    amount: number | null
    notes: string | null
    created_at: string
  }

  return toCsv<Row>(data ?? [], [
    { key: 'year', header: 'Année' },
    { key: 'quarter', header: 'Trimestre' },
    { key: 'gite_label', header: 'Gîte' },
    { key: 'stay_dates', header: 'Dates séjour' },
    { key: 'nights_count', header: 'Nuits' },
    { key: 'adult_count', header: 'Adultes' },
    { key: 'amount', header: 'Montant (€)' },
    { key: 'notes', header: 'Notes' },
    { key: 'created_at', header: 'Créée le' },
  ])
}

export async function getMiscEntriesCsv(): Promise<string> {
  const { data, error } = await supabase
    .from('misc_entries')
    .select('*')
    .order('year', { ascending: true })
    .order('quarter', { ascending: true })
  if (error) throw new Error('Could not load misc_entries')

  type Row = {
    year: number
    quarter: number
    label: string
    amount: number
    notes: string | null
    created_at: string
  }

  return toCsv<Row>(data ?? [], [
    { key: 'year', header: 'Année' },
    { key: 'quarter', header: 'Trimestre' },
    { key: 'label', header: 'Description' },
    { key: 'amount', header: 'Montant (€)' },
    { key: 'notes', header: 'Notes' },
    { key: 'created_at', header: 'Créée le' },
  ])
}

// ---------------------------------------------------------------------------
// ZIP builders
// ---------------------------------------------------------------------------

export async function buildFinancesZip(): Promise<Blob> {
  const [revenues, taxStays, miscEntries] = await Promise.all([
    getRevenuesCsv(),
    getTaxStaysCsv(),
    getMiscEntriesCsv(),
  ])

  const zip = new JSZip()
  zip.file('revenues.csv', revenues)
  zip.file('tax_stays.csv', taxStays)
  zip.file('misc_entries.csv', miscEntries)

  return zip.generateAsync({ type: 'blob' })
}

export async function buildFullZip(
  onProgress?: (done: number, total: number) => void,
): Promise<Blob> {
  // Build all 4 CSVs concurrently
  const [reservationsCsv, revenuesCsv, taxStaysCsv, miscEntriesCsv] =
    await Promise.all([
      getReservationsCsv(),
      getRevenuesCsv(),
      getTaxStaysCsv(),
      getMiscEntriesCsv(),
    ])

  // Collect storage paths (contracts + invoices)
  const { data: reservations, error: rError } = await supabase
    .from('reservations')
    .select('contract_path')
  if (rError) throw new Error('Could not load reservations for ZIP')

  const { data: invoices, error: iError } = await supabase
    .from('invoices')
    .select('file_path')
  if (iError) throw new Error('Could not load invoices for ZIP')

  const contractPaths = (reservations ?? [])
    .map((r) => r.contract_path)
    .filter((p): p is string => Boolean(p))

  const invoicePaths = (invoices ?? []).map((i) => i.file_path)

  const total = contractPaths.length + invoicePaths.length
  let done = 0

  const zip = new JSZip()
  zip.file('reservations.csv', reservationsCsv)
  zip.file('revenues.csv', revenuesCsv)
  zip.file('tax_stays.csv', taxStaysCsv)
  zip.file('misc_entries.csv', miscEntriesCsv)

  // Download contracts sequentially — avoid saturating storage
  for (const path of contractPaths) {
    try {
      const blob = await downloadFile('contracts', path)
      const filename = path.split('/').pop() ?? path
      zip.folder('contracts')!.file(filename, blob)
    } catch (err) {
      // Missing or inaccessible file — skip silently, do not abort export
      console.error('Skipping missing contract:', path, err)
    }
    done++
    onProgress?.(done, total)
  }

  // Download invoices sequentially
  for (const path of invoicePaths) {
    try {
      const blob = await downloadFile('invoices', path)
      const filename = path.split('/').pop() ?? path
      zip.folder('invoices')!.file(filename, blob)
    } catch (err) {
      console.error('Skipping missing invoice:', path, err)
    }
    done++
    onProgress?.(done, total)
  }

  return zip.generateAsync({ type: 'blob' })
}

// ---------------------------------------------------------------------------
// Browser download trigger
// ---------------------------------------------------------------------------

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ---------------------------------------------------------------------------
// Invoice ZIP builder (quarter export)
// ---------------------------------------------------------------------------

/** Replace characters invalid in filenames across major OS. */
function sanitizeFilename(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'facture'
}

/**
 * Build a ZIP of invoice files for a given quarter.
 * Files are downloaded sequentially; missing files are skipped silently.
 * Duplicate names are deduplicated with a numeric suffix (-2, -3…).
 */
export async function buildInvoicesZip(
  invoices: Array<{ file_path: string; name: string }>,
): Promise<Blob> {
  const zip = new JSZip()
  // Track how many times each sanitized base name has been used
  const usedNames = new Map<string, number>()

  for (const invoice of invoices) {
    try {
      const blob = await downloadFile('invoices', invoice.file_path)
      const ext = invoice.file_path.split('.').pop() ?? ''
      const base = sanitizeFilename(invoice.name)
      const key = `${base}.${ext}`
      const count = usedNames.get(key) ?? 0
      usedNames.set(key, count + 1)
      const filename = count === 0 ? `${base}.${ext}` : `${base}-${count + 1}.${ext}`
      zip.file(filename, blob)
    } catch (err) {
      console.error('Skipping missing invoice in ZIP:', invoice.file_path, err)
    }
  }

  return zip.generateAsync({ type: 'blob' })
}
