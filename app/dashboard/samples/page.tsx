'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { STORAGE_LOCATIONS } from '@/lib/storage-locations'
import type { Sample } from '@/lib/types'

const CATEGORIES = ['핵산 추출', '프라이머', '플라스미드', '기타'] as const
type Category = typeof CATEGORIES[number]

const CATEGORY_ICONS: Record<Category, string> = {
  '핵산 추출': '🧬',
  '프라이머': '🔬',
  '플라스미드': '⭕',
  '기타': '📦',
}

const LABELS: Record<Category, { id: string; source: string; date: string }> = {
  '핵산 추출': { id: '샘플 ID', source: '출처 / 시료명', date: '추출일' },
  '프라이머':  { id: '프라이머명', source: '타겟 유전자 / 용도', date: '제조일' },
  '플라스미드': { id: '플라스미드명', source: '인서트 / 설명', date: '제작일' },
  '기타':      { id: '샘플 ID', source: '출처 / 설명', date: '날짜' },
}

const EMPTY = (cat: Category) => ({
  sample_id: '', type: cat as string, source: '', collection_date: '', location: '', notes: '',
})

export default function SamplesPage() {
  const [activeTab, setActiveTab] = useState<Category>('핵산 추출')
  const [samples, setSamples] = useState<Sample[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY('핵산 추출'))
  const [selected, setSelected] = useState<Sample | null>(null)
  const [loading, setLoading] = useState(false)
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [error, setError] = useState<string | null>(null)

  async function fetchSamples(tab: Category) {
    const { data } = await supabase
      .from('samples')
      .select('*')
      .eq('type', tab)
      .order('created_at', { ascending: false })
    setSamples(data ?? [])
  }

  async function fetchCounts() {
    const results = await Promise.all(
      CATEGORIES.map(cat =>
        supabase.from('samples').select('id', { count: 'exact', head: true }).eq('type', cat)
      )
    )
    const c: Record<string, number> = {}
    CATEGORIES.forEach((cat, i) => { c[cat] = results[i].count ?? 0 })
    setCounts(c)
  }

  useEffect(() => {
    fetchSamples(activeTab)
    setShowForm(false)
    setSelected(null)
    setForm(EMPTY(activeTab))
  }, [activeTab])

  useEffect(() => { fetchCounts() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error: err } = await supabase.from('samples').insert([{
      sample_id: form.sample_id,
      type: activeTab,
      source: form.source || null,
      collection_date: form.collection_date || null,
      stage: 'collected',
      location: form.location || null,
      notes: form.notes || null,
    }])
    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }
    setForm(EMPTY(activeTab))
    setShowForm(false)
    setLoading(false)
    fetchSamples(activeTab)
    fetchCounts()
  }

  async function handleDelete(id: string) {
    if (!confirm('삭제하시겠습니까?')) return
    await supabase.from('samples').delete().eq('id', id)
    setSelected(null)
    fetchSamples(activeTab)
    fetchCounts()
  }

  const labels = LABELS[activeTab]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">🧪 샘플 현황</h2>
        <button
          onClick={() => { setShowForm(v => !v); setSelected(null) }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          + 등록
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-mono break-all">
          ⚠️ 저장 오류: {error}
        </div>
      )}

      {/* 카테고리 탭 */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveTab(cat)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border transition-colors ${
              activeTab === cat
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
            }`}>
            <span>{CATEGORY_ICONS[cat]}</span>
            {cat}
            {counts[cat] > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                activeTab === cat ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'
              }`}>{counts[cat]}</span>
            )}
          </button>
        ))}
      </div>

      {/* 등록 폼 */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
          <h3 className="font-semibold text-gray-700 mb-4">
            {CATEGORY_ICONS[activeTab]} 새 {activeTab} 등록
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{labels.id} *</label>
              <input type="text" required value={form.sample_id}
                onChange={e => setForm(f => ({ ...f, sample_id: e.target.value }))}
                placeholder={activeTab === '프라이머' ? '예: PVX-F1' : activeTab === '플라스미드' ? '예: pBIN19-GFP' : '예: NA-2026-001'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{labels.source}</label>
              <input type="text" value={form.source}
                onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{labels.date}</label>
              <input type="date" value={form.collection_date}
                onChange={e => setForm(f => ({ ...f, collection_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">보관 위치</label>
              <select value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">선택하세요</option>
                {STORAGE_LOCATIONS.map(l => (
                  <option key={l.id} value={l.id}>{l.label} ({l.temp})</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">메모</label>
              <textarea rows={2} value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder={activeTab === '프라이머' ? '서열 정보, Tm 등' : '기타 메모'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">취소</button>
              <button type="submit" disabled={loading}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">저장</button>
            </div>
          </form>
        </div>
      )}

      {/* 목록 */}
      <div className="space-y-3">
        {samples.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-3">{CATEGORY_ICONS[activeTab]}</div>
            <p className="text-sm">등록된 {activeTab} 항목이 없습니다.</p>
          </div>
        )}
        {samples.map(s => (
          <div key={s.id}
            onClick={() => setSelected(selected?.id === s.id ? null : s)}
            className={`bg-white border rounded-xl p-5 cursor-pointer transition-colors ${
              selected?.id === s.id ? 'border-blue-300 shadow-sm' : 'border-gray-200 hover:border-blue-200'
            }`}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800 truncate">{s.sample_id}</h3>
                {s.source && <p className="text-xs text-gray-400 mt-0.5 truncate">{s.source}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                {s.collection_date && (
                  <span className="text-xs text-gray-400">{s.collection_date}</span>
                )}
                {s.location && (
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{s.location}</span>
                )}
              </div>
            </div>

            {selected?.id === s.id && (
              <div className="mt-4 space-y-2 text-sm border-t border-gray-100 pt-4">
                {s.collection_date && (
                  <div className="flex gap-2">
                    <span className="font-medium text-gray-600 w-16 shrink-0">{labels.date}</span>
                    <span className="text-gray-700">{s.collection_date}</span>
                  </div>
                )}
                {s.location && (
                  <div className="flex gap-2">
                    <span className="font-medium text-gray-600 w-16 shrink-0">보관 위치</span>
                    <span className="text-gray-700">{s.location}</span>
                  </div>
                )}
                {s.notes && (
                  <div>
                    <span className="font-medium text-gray-600">메모</span>
                    <p className="mt-1 text-gray-600 whitespace-pre-wrap text-xs leading-relaxed">{s.notes}</p>
                  </div>
                )}
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(s.id) }}
                  className="text-xs text-red-400 hover:text-red-600 mt-2">
                  삭제
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
