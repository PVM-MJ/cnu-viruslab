'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Experiment, ExperimentStatus } from '@/lib/types'

const statusLabel: Record<ExperimentStatus, string> = {
  planned: '예정',
  in_progress: '진행 중',
  completed: '완료',
  paused: '중단',
}
const statusColor: Record<ExperimentStatus, string> = {
  planned: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  paused: 'bg-yellow-100 text-yellow-700',
}

const empty = { researcher: '', name: '', description: '', start_date: '', end_date: '', status: 'planned' as ExperimentStatus, notes: '' }

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(empty)
  const [selected, setSelected] = useState<Experiment | null>(null)
  const [loading, setLoading] = useState(false)

  async function fetchExperiments() {
    const { data } = await supabase.from('experiments').select('*').order('created_at', { ascending: false })
    setExperiments(data ?? [])
  }

  useEffect(() => { fetchExperiments() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await supabase.from('experiments').insert([{
      ...form,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    }])
    setForm(empty)
    setShowForm(false)
    setLoading(false)
    fetchExperiments()
  }

  async function updateStatus(id: string, status: ExperimentStatus) {
    await supabase.from('experiments').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    fetchExperiments()
  }

  async function handleDelete(id: string) {
    if (!confirm('삭제하시겠습니까?')) return
    await supabase.from('experiments').delete().eq('id', id)
    setSelected(null)
    fetchExperiments()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">🔬 실험 스케줄</h2>
        <button onClick={() => { setShowForm(true); setSelected(null) }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          + 실험 추가
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-gray-700 mb-4">새 실험 등록</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">담당자 *</label>
              <input type="text" required value={form.researcher} onChange={e => setForm(f => ({ ...f, researcher: e.target.value }))} placeholder="담당자 이름" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">상태</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ExperimentStatus }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                {Object.entries(statusLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">실험명 *</label>
              <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="실험 이름" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">시작일</label>
              <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">종료(예정)일</label>
              <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">설명</label>
              <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="실험 내용 설명" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" />
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
        {experiments.length === 0 && <p className="text-gray-400 text-sm py-8 text-center">등록된 실험이 없습니다.</p>}
        {experiments.map(exp => (
          <div key={exp.id} onClick={() => setSelected(exp === selected ? null : exp)} className="bg-white border border-gray-200 rounded-xl p-5 cursor-pointer hover:border-blue-300 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[exp.status]}`}>{statusLabel[exp.status]}</span>
                  <span className="text-xs text-gray-400">{exp.researcher}</span>
                </div>
                <h3 className="font-semibold text-gray-800">{exp.name}</h3>
                {(exp.start_date || exp.end_date) && (
                  <p className="text-xs text-gray-400 mt-1">{exp.start_date ?? '-'} ~ {exp.end_date ?? '-'}</p>
                )}
              </div>
            </div>
            {selected?.id === exp.id && (
              <div className="mt-4 space-y-3 text-sm text-gray-600 border-t border-gray-100 pt-4">
                {exp.description && <div><span className="font-medium text-gray-700">설명</span><p className="mt-1 whitespace-pre-wrap">{exp.description}</p></div>}
                {exp.notes && <div><span className="font-medium text-gray-700">메모</span><p className="mt-1 whitespace-pre-wrap">{exp.notes}</p></div>}
                <div>
                  <span className="font-medium text-gray-700 block mb-2">상태 변경</span>
                  <div className="flex gap-2 flex-wrap">
                    {(Object.keys(statusLabel) as ExperimentStatus[]).map(s => (
                      <button key={s} onClick={e => { e.stopPropagation(); updateStatus(exp.id, s) }}
                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${exp.status === s ? statusColor[s] + ' border-current' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}>
                        {statusLabel[s]}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={e => { e.stopPropagation(); handleDelete(exp.id) }} className="text-xs text-red-500 hover:text-red-700">삭제</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
