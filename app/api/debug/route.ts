import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  let testResult = null
  let testError = null

  if (url && key) {
    const client = createClient(url, key)
    const { data, error } = await client.from('lab_events').select('count').limit(1)
    testResult = data
    testError = error?.message ?? null
  }

  return NextResponse.json({
    url_set: !!url,
    url_value: url ? url.substring(0, 40) + '...' : 'MISSING',
    key_set: !!key,
    key_prefix: key ? key.substring(0, 15) + '...' : 'MISSING',
    db_test_result: testResult,
    db_test_error: testError,
  })
}
