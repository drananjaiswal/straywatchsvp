import { useEffect, useMemo, useState } from 'react'
import {
  getAdminSightings,
  getSession,
  hideAllSightings,
  isCurrentUserAdmin,
  onAuthStateChange,
  restoreAllSightings,
  signInAdminWithGoogle,
  signOutAdmin
} from '../lib/supabase'

export default function AdminPage() {
  const [session, setSession] = useState(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [adminReady, setAdminReady] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [startingGoogleSignIn, setStartingGoogleSignIn] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [submittingAction, setSubmittingAction] = useState(false)
  const [sightings, setSightings] = useState([])
  const [reason, setReason] = useState('')

  useEffect(() => {
    let mounted = true

    getSession().then(async ({ data }) => {
      if (!mounted) return
      setSession(data)
      if (data) {
        await refreshAdminState()
      } else {
        setCheckingAuth(false)
      }
    })

    const { data: listener } = onAuthStateChange(async (nextSession) => {
      if (!mounted) return
      setSession(nextSession)
      if (nextSession) {
        await refreshAdminState()
      } else {
        setAdminReady(false)
        setSightings([])
        setCheckingAuth(false)
      }
    })

    return () => {
      mounted = false
      listener?.subscription?.unsubscribe()
    }
  }, [])

  async function refreshAdminState() {
    setCheckingAuth(true)
    setError('')

    const [{ data: isAdmin, error: adminError }, { data: rows, error: sightingsError }] = await Promise.all([
      isCurrentUserAdmin(),
      getAdminSightings()
    ])

    if (adminError) {
      setAdminReady(false)
      setError('Could not verify admin access right now.')
      setCheckingAuth(false)
      return
    }

    if (!isAdmin) {
      setAdminReady(false)
      setSightings([])
      setCheckingAuth(false)
      return
    }

    if (sightingsError) {
      setError('Admin access is active, but heatmap data could not be loaded.')
    }

    setAdminReady(true)
    setSightings(rows || [])
    setCheckingAuth(false)
  }

  async function refreshSightings() {
    setLoadingData(true)
    const { data, error: sightingsError } = await getAdminSightings()
    if (sightingsError) {
      setError('Could not refresh admin sighting data.')
    } else {
      setSightings(data)
    }
    setLoadingData(false)
  }

  async function handleGoogleSignIn() {
    setStartingGoogleSignIn(true)
    setError('')
    setMessage('')
    const { error: signInError } = await signInAdminWithGoogle()
    setStartingGoogleSignIn(false)

    if (signInError) {
      setError(signInError.message || 'Could not start Google sign-in.')
      return
    }

    setMessage('Redirecting to Google sign-in...')
  }

  async function handleHideAll() {
    setSubmittingAction(true)
    setError('')
    setMessage('')
    const { data, error: actionError } = await hideAllSightings(reason.trim())
    setSubmittingAction(false)

    if (actionError) {
      setError(actionError.message || 'Could not clear the heatmap.')
      return
    }

    setMessage(`Heatmap cleared. ${data || 0} sighting${data === 1 ? '' : 's'} hidden.`)
    await refreshSightings()
  }

  async function handleRestoreAll() {
    setSubmittingAction(true)
    setError('')
    setMessage('')
    const { data, error: actionError } = await restoreAllSightings(reason.trim())
    setSubmittingAction(false)

    if (actionError) {
      setError(actionError.message || 'Could not restore the heatmap.')
      return
    }

    setMessage(`Heatmap restored. ${data || 0} sighting${data === 1 ? '' : 's'} made visible again.`)
    await refreshSightings()
  }

  async function handleSignOut() {
    await signOutAdmin()
    setMessage('')
    setReason('')
  }

  const counts = useMemo(() => {
    const total = sightings.length
    const hidden = sightings.filter((s) => s.is_hidden).length
    return { total, hidden, visible: total - hidden }
  }, [sightings])

  if (checkingAuth) {
    return <PageShell><p className="text-sm text-gray-500">Checking admin access...</p></PageShell>
  }

  if (!session) {
    return (
      <PageShell>
        <div className="max-w-md space-y-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Admin Access</h1>
            <p className="text-sm text-gray-500 mt-1">
              Sign in with your approved Google account to manage heatmap visibility.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
            <div className="rounded-xl border border-green-100 bg-green-50/70 px-4 py-3 text-sm text-green-900">
              Use the same Google account that has been approved in the <code>admin_users</code> table.
            </div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={startingGoogleSignIn}
              className="w-full py-3 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-black disabled:opacity-60"
            >
              {startingGoogleSignIn ? 'Opening Google sign-in...' : 'Continue with Google'}
            </button>
            <p className="text-xs text-gray-500">
              After Google signs you in, StrayWatch still checks whether your email is approved for admin access.
            </p>
          </div>

          {message && <Notice tone="success">{message}</Notice>}
          {error && <Notice tone="error">{error}</Notice>}
        </div>
      </PageShell>
    )
  }

  if (!adminReady) {
    return (
      <PageShell>
        <div className="max-w-lg space-y-4">
          <h1 className="text-2xl font-semibold text-gray-900">Admin Access</h1>
          <Notice tone="error">
            This signed-in account is not approved for admin controls yet. Add the email address to the `admin_users`
            table in Supabase, then refresh this page.
          </Notice>
          <p className="text-sm text-gray-500">Signed in as {session.user.email}</p>
          <button
            onClick={handleSignOut}
            className="py-2 px-4 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
          >
            Sign out
          </button>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Signed in as {session.user.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="py-2 px-4 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
          >
            Sign out
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Visible sightings" value={counts.visible} />
          <StatCard label="Hidden sightings" value={counts.hidden} />
          <StatCard label="Tracked sightings" value={counts.total} />
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Heatmap controls</h2>
            <p className="text-sm text-gray-500 mt-1">
              Clearing the heatmap hides all current sightings without deleting them. You can restore them later.
            </p>
          </div>

          <label className="block text-sm text-gray-700">
            Reason for this action
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, 160))}
              rows={3}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-green-400"
              placeholder="Optional note for your admin log"
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleHideAll}
              disabled={submittingAction}
              className="py-2.5 px-4 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-60"
            >
              {submittingAction ? 'Saving...' : 'Clear heatmap'}
            </button>
            <button
              onClick={handleRestoreAll}
              disabled={submittingAction}
              className="py-2.5 px-4 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-60"
            >
              {submittingAction ? 'Saving...' : 'Restore heatmap'}
            </button>
            <button
              onClick={refreshSightings}
              disabled={loadingData}
              className="py-2.5 px-4 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              {loadingData ? 'Refreshing...' : 'Refresh counts'}
            </button>
          </div>

          {message && <Notice tone="success">{message}</Notice>}
          {error && <Notice tone="error">{error}</Notice>}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Recent sightings</h2>
            <p className="text-sm text-gray-500 mt-1">Latest 500 rows, including hidden ones.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-left px-5 py-3 font-medium">Ward</th>
                  <th className="text-left px-5 py-3 font-medium">Created</th>
                  <th className="text-left px-5 py-3 font-medium">Hidden at</th>
                </tr>
              </thead>
              <tbody>
                {sightings.map((sighting) => (
                  <tr key={sighting.id} className="border-t border-gray-100">
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        sighting.is_hidden ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                      }`}>
                        {sighting.is_hidden ? 'Hidden' : 'Visible'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-700">{sighting.ward_name}</td>
                    <td className="px-5 py-3 text-gray-500">{formatTimestamp(sighting.created_at)}</td>
                    <td className="px-5 py-3 text-gray-500">{formatTimestamp(sighting.hidden_at)}</td>
                  </tr>
                ))}
                {sightings.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-5 py-8 text-center text-gray-400">
                      No sightings available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageShell>
  )
}

function PageShell({ children }) {
  return <div className="max-w-5xl mx-auto px-4 py-6">{children}</div>
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-gray-900">{value}</div>
    </div>
  )
}

function Notice({ tone, children }) {
  const className = tone === 'error'
    ? 'bg-red-50 border-red-200 text-red-700'
    : 'bg-green-50 border-green-200 text-green-700'

  return <div className={`border rounded-xl px-4 py-3 text-sm ${className}`}>{children}</div>
}

function formatTimestamp(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}
