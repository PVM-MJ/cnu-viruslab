'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DebugPage() {
  const [result, setResult] = useState<object | null>(null)

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    async function run() {
      const { data, error } = await supabase.from('lab_events').select('*').limit(1)
      setResult({
        url_set: !!url,
        url: url ?? 'MISSING',
        key_set: !!key,
        key: key ? key.slice(0, 20) + '...' : 'MISSING',
        data,
        error: error ? { message: error.message, code: error.code } : null,
      })
    }
    run()
  }, [])

  return (
    <div style={{ padding: 32, fontFamily: 'monospace' }}>
      <h1 style={{ marginBottom: 16 }}>Supabase Debug</h1>
      <pre style={{ background: '#f4f4f4', padding: 16, borderRadius: 8, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
        {result ? JSON.stringify(result, null, 2) : '로딩 중...'}
      </pre>
    </div>
  )
}
