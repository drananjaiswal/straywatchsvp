import { useEffect, useState } from 'react'
import { validateBackendSchema } from '../lib/supabase'

export default function BackendGuard({ children }) {
  const [status, setStatus] = useState('checking')
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    validateBackendSchema().then((result) => {
      if (!mounted) return
      if (result.ok) {
        setStatus('ready')
        return
      }

      setError(result.error)
      setStatus('failed')
    })

    return () => {
      mounted = false
    }
  }, [])

  if (status === 'checking') {
    return (
      <div className="mx-auto flex min-h-[40vh] max-w-3xl items-center justify-center px-4 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500 shadow-sm">
          Verifying StrayWatch data connection...
        </div>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-[28px] border border-red-200 bg-white p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)]">
          <div className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-red-700">
            Backend mismatch detected
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">StrayWatch is connected to the wrong Supabase schema</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            The frontend expects the StrayWatch SVP tables and columns, but the connected backend does not match.
            This usually means Vercel is using the wrong `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY`, or the
            StrayWatch migration has not been applied to the active Supabase project.
          </p>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
            <div className="font-semibold text-slate-900">What to check</div>
            <div className="mt-2">1. Vercel environment variables point to the StrayWatch Supabase project</div>
            <div>2. The live database has `sightings` columns like `latitude`, `longitude`, `ward_id`, and `dog_count`</div>
            <div>3. The live database has the `wards` table from `supabase/migration.sql`</div>
          </div>

          <div className="mt-5 text-xs text-slate-500">
            Error code: {error?.code || 'unknown'}
            {error?.details ? ` · ${error.details}` : ''}
          </div>
        </div>
      </div>
    )
  }

  return children
}
