'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { STORAGE_LOCATIONS } from '@/lib/storage-locations'
import type { Sample, SampleStage } from '@/lib/types'

const stageLabel: Record<SampleStage, string> = {
  collected: '수집 완료',
  dna_extraction: 'DNA 추출',
  sequencing: '시퀀싱',
  analysis: '분석 중',
  completed: '완료',
}
const stageColor: Record<SampleStage, string> = {
  collected: 'bg-gray-100 text-gray-600',
  dna_extraction: 'bg-yellow-100 text-yellow-700',
  sequencing: 'bg-orange-100 text-orange-700',
  analysis: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
}

const sampleTypes = ['PM2.5', '농업용수', '토양', '식물체', '기타']
const empty = { sample_id: '', type: 'PM2.5', source: '', collection_date: '', stage: 'collected' as SampleStage, location: '', notes: '' }

export default function SamplesPage() {
  const [samples, setSamples] = useState<Sample[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(empty)
  const [selected, setSelected] = useState<Sample | null>(null)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<SampleStage | 'all'>('all')

  async function fetchSamples() {
    let q = supabase.from('samples').select('*').order('created_at', { ascending: false })
    if (filter !== 'all') q = q.eq('stage', filter)
    const { data } = await q
    setSamples(data ?? [])
  }

  useEffect(() => { fetchSamples() }, [filter])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await supabase.from('samples').insert([{
      ...form,
      collection_date: form.collection_date || null,
    }])
    setForm(empty)
    setShowForm(false)
    setLoading(false)
    fetchSamples()
  }

  async function updateStage(id: string, stage: SampleStage) {
    await supabase.from('samples').update({ stage, updated_at: new Date().toISOString() }).eq('id', id)
    fetchSamples()
  }

  async function handleDelete(id: string) {
    if (!confirm('삭제하시겠습니까?')) return
    await supabase.from('samples').delete().eq('id', id)
    setSelected(null)
    fetchSamples()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">🧪 샘플 현황</h2>
        <button onClick={() => { setShowForm(true); setSelected(null) }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          + 샘플 등록
        </button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => setFilter('all')} className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${filter === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`}>전체</button>
        {(Object.keys(stageLabel) as SampleStage[]).map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${filter === s ? stageColor[s] + ' border-current font-medium' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`}>{stageLabel[s]}</button>
        ))}
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-gray-700 mb-4">새 샘플 등록</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">샘플 ID *</label>
              <input type="text" required value={form.sample_id} onChange={e => setForm(f => ({ ...f, sample_id: e.target.value }))} placeholder="예: PM-2026-001" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">샘플 종류</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                {sampleTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">출처/채취 장소</label>
              <input type="text" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} placeholder="예: 광주 북구 측정소" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">채취일</label>
              <input type="date" value={form.collection_date} onChange={e => setForm(f => ({ ...f, collection_date: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">단계</label>
              <select value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value as SampleStage }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                {(Object.entries(stageLabel)).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">보관 위치</label>
              <select value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                <option value="">선택하세요</option>
                {STORAGE_LOCATIONS.map(l => (
                  <option key={l.id} value={l.id}>{l.label} ({l.temp})</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">메모</label>
              <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="기타 메모" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" />
            </div>
            <div className="col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">취소</button>
              <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">저장</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {samples.length === 0 && <p className="text-gray-400 text-sm py-8 text-center">등록된 샘플이 없습니다.</p>}
        {samples.map(s => (
          <div key={s.id} onClick={() => setSelected(s === selected ? null : s)} className="bg-white border border-gray-200 rounded-xl p-5 cursor-pointer hover:border-blue-300 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stageColor[s.stage]}`}>{stageLabel[s.stage]}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s.type}</span>
                </div>
                <h3 className="font-semibold text-gray-800">{s.sample_id}</h3>
                {s.source && <p className="text-xs text-gray-400 mt-0.5">{s.source}</p>}
              </div>
              {s.location && <span className="text-xs text-gray-400">{s.location}</span>}
            </div>
            {selected?.id === s.id && (
              <div className="mt-4 space-y-3 text-sm text-gray-600 border-t border-gray-100 pt-4">
                {s.collection_date && <div><span className="font-medium text-gray-700">채취일</span><span className="ml-2">{s.collection_date}</span></div>}
                {s.notes && <div><span className="font-medium text-gray-700">메모</span><p className="mt-1 whitespace-pre-wrap">{s.notes}</p></div>}
                <div>
                  <span className="font-medium text-gray-700 block mb-2">단계 변경</span>
                  <div className="flex gap-2 flex-wrap">
                    {(Object.keys(stageLabel) as SampleStage[]).map(st => (
                      <button key={st} onClick={e => { e.stopPropagation(); updateStage(s.id, st) }}
                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${s.stage === st ? stageColor[st] + ' border-current' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}>
                        {stageLabel[st]}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={e => { e.stopPropagation(); handleDelete(s.id) }} className="text-xs text-red-500 hover:text-red-700">삭제</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
