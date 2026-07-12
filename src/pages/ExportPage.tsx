import { useState, useEffect } from 'react'
import Button from '../components/ui/Button'
import { LABELS } from '../constants/labels'
import {
  getReservationsCsv,
  buildFinancesZip,
  buildFullZip,
  downloadBlob,
  getReservationsFilename,
  getFinancesFilename,
  getFullExportFilename,
} from '../lib/export'

const LAST_FULL_EXPORT_KEY = 'gites:lastFullExport'

type Message = { type: 'success' | 'error'; text: string }

function Spinner({ white }: { white?: boolean }) {
  return (
    <span
      className={`w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin ${white ? 'border-white' : 'border-current'}`}
    />
  )
}

export default function ExportPage() {
  const [lastExport, setLastExport] = useState<string | null>(null)

  const [loadingReservations, setLoadingReservations] = useState(false)
  const [msgReservations, setMsgReservations] = useState<Message | null>(null)

  const [loadingFinances, setLoadingFinances] = useState(false)
  const [msgFinances, setMsgFinances] = useState<Message | null>(null)

  const [loadingFull, setLoadingFull] = useState(false)
  const [msgFull, setMsgFull] = useState<Message | null>(null)
  const [progressDone, setProgressDone] = useState(0)
  const [progressTotal, setProgressTotal] = useState(0)

  useEffect(() => {
    setLastExport(localStorage.getItem(LAST_FULL_EXPORT_KEY))
  }, [])

  async function handleExportReservations() {
    setLoadingReservations(true)
    setMsgReservations(null)
    try {
      const csv = await getReservationsCsv()
      downloadBlob(
        new Blob([csv], { type: 'text/csv;charset=utf-8' }),
        getReservationsFilename(),
      )
      setMsgReservations({ type: 'success', text: LABELS.exportSuccessReservations })
    } catch (err) {
      console.error('Export reservations error:', err)
      setMsgReservations({ type: 'error', text: LABELS.exportErrorReservations })
    } finally {
      setLoadingReservations(false)
    }
  }

  async function handleExportFinances() {
    setLoadingFinances(true)
    setMsgFinances(null)
    try {
      const blob = await buildFinancesZip()
      downloadBlob(blob, getFinancesFilename())
      setMsgFinances({ type: 'success', text: LABELS.exportSuccessFinances })
    } catch (err) {
      console.error('Export finances error:', err)
      setMsgFinances({ type: 'error', text: LABELS.exportErrorFinances })
    } finally {
      setLoadingFinances(false)
    }
  }

  async function handleExportFull() {
    setLoadingFull(true)
    setMsgFull(null)
    setProgressDone(0)
    setProgressTotal(0)
    try {
      const blob = await buildFullZip((done, total) => {
        setProgressDone(done)
        setProgressTotal(total)
      })
      downloadBlob(blob, getFullExportFilename())
      const today = new Date().toLocaleDateString('fr-FR')
      localStorage.setItem(LAST_FULL_EXPORT_KEY, today)
      setLastExport(today)
      setMsgFull({ type: 'success', text: LABELS.exportSuccessFull })
    } catch (err) {
      console.error('Full export error:', err)
      setMsgFull({ type: 'error', text: LABELS.exportErrorFull })
    } finally {
      setLoadingFull(false)
    }
  }

  return (
    <div className="max-w-[960px] mx-auto px-4 py-5 max-sm:px-3 max-sm:pb-20">
      <h1 className="text-lg font-semibold text-text mb-1">{LABELS.exportTitle}</h1>

      {/* Last full export indicator */}
      <p className="text-sm text-text-secondary mb-4">
        {lastExport
          ? `${LABELS.exportLastFull} ${lastExport}`
          : LABELS.exportNeverDone}
      </p>

      {/* Recommendation banner */}
      <div className="bg-status-blue-bg border border-status-blue-bg rounded-lg px-4 py-3 mb-6 text-sm text-status-blue-text">
        {LABELS.exportRecommendation}
      </div>

      <div className="flex flex-col gap-3">
        {/* Reservations CSV */}
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="font-medium text-text text-sm">{LABELS.exportReservations}</p>
              <p className="text-xs text-text-secondary mt-0.5">{LABELS.exportReservationsDesc}</p>
            </div>
            <Button
              variant="secondary"
              onClick={handleExportReservations}
              disabled={loadingReservations}
            >
              {loadingReservations && <Spinner />}
              {loadingReservations ? LABELS.exportLoading : LABELS.exportReservations}
            </Button>
          </div>
          {msgReservations && (
            <p className={`mt-2 text-xs ${msgReservations.type === 'success' ? 'text-status-green-text' : 'text-status-red-text'}`}>
              {msgReservations.text}
            </p>
          )}
        </div>

        {/* Finances ZIP */}
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="font-medium text-text text-sm">{LABELS.exportFinances}</p>
              <p className="text-xs text-text-secondary mt-0.5">{LABELS.exportFinancesDesc}</p>
            </div>
            <Button
              variant="secondary"
              onClick={handleExportFinances}
              disabled={loadingFinances}
            >
              {loadingFinances && <Spinner />}
              {loadingFinances ? LABELS.exportLoading : LABELS.exportFinances}
            </Button>
          </div>
          {msgFinances && (
            <p className={`mt-2 text-xs ${msgFinances.type === 'success' ? 'text-status-green-text' : 'text-status-red-text'}`}>
              {msgFinances.text}
            </p>
          )}
        </div>

        {/* Full export ZIP */}
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="font-medium text-text text-sm">{LABELS.exportFull}</p>
              <p className="text-xs text-text-secondary mt-0.5">{LABELS.exportFullDesc}</p>
            </div>
            <Button
              variant="primary"
              onClick={handleExportFull}
              disabled={loadingFull}
            >
              {loadingFull && <Spinner white />}
              {loadingFull ? LABELS.exportLoading : LABELS.exportFull}
            </Button>
          </div>

          {/* Progress bar — shown only when downloading storage files */}
          {loadingFull && progressTotal > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-text-secondary mb-1.5">
                <span>{LABELS.exportProgressLabel}</span>
                <span>
                  {progressDone} / {progressTotal} {LABELS.exportProgressFiles}
                </span>
              </div>
              <div className="h-1.5 bg-surface-alt rounded-full overflow-hidden">
                <div
                  className="h-full bg-status-blue rounded-full transition-all duration-200"
                  style={{ width: `${(progressDone / progressTotal) * 100}%` }}
                />
              </div>
            </div>
          )}

          {msgFull && (
            <p className={`mt-2 text-xs ${msgFull.type === 'success' ? 'text-status-green-text' : 'text-status-red-text'}`}>
              {msgFull.text}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
