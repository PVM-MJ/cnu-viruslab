'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Reagent } from '@/lib/types'

const empty = { name: '', quantity: '', unit: 'mL', expiry_date: '', location: '', needs_order: false, notes: '' }

export default function ReagentsPage() {
  const [reagents, setReagents] = useState<Reagent[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(empty)
  const [selected, setSelected] = useState<Reagent | null>(null)
  const [loading, setLoading] = useState(false)
  const [filterOrder, setFilterOrder] = useState(false)

  async function fetchReagents() {
    let q = supabase.from('reagents').select('*').order('name')
    if (filterOrder) q = q.eq('needs_order', true)
    const { data } = await q
    setReagents(data ?? [])
  }

  useEffect(() => { fetchReagents() }, [filterOrder])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await supabase.from('reagents').insert([{
      name: form.name,
      quantity: form.quantity ? Number(form.quantity) : null,
      unit: form.unit || null,
      expiry_date: form.expiry_date || null,
      location: form.location || null,
      needs_order: form.needs_order,
      notes: form.notes || null,
    }])
    setForm(empty)
    setShowForm(false)
    setLoading(false)
    fetchReagents()
  }

  async function toggleOrder(id: string, current: boolean) {
    await supabase.from('reagents').update({ needs_order: !current, updated_at: new Date().toISOString() }).eq('id', id)
    fetchReagents()
  }

  async function handleDelete(id: string) {
    if (!confirm('삭제하시겠습니까?')) return
    await supabase.from('reagents').delete().eq('id', id)
    setSelected(null)
    fetchReagents()
  }

  const needsOrderCount = reagents.filter(r => r.needs_order).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">💊 시약 재고</h2>
          {needsOrderCount > 0 && (
            <p className="text-sm text-red-500 mt-1">⚠️ 발주 필요 시약 {needsOrderCount}개</p>
          )}
        </div>
        <button onClick={() => { setShowForm(true); setSelected(null) }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          + 시약 등록
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setFilterOrder(false)} className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${!filterOrder ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`}>전체</button>
        <button onClick={() => setFilterOrder(true)} className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${filterOrder ? 'bg-red-500 text-white border-red-500' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`}>발주 필요만</button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-gray-700 mb-4">새 시약 등록</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">시약명 *</label>
              <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="예: TRIzol Reagent" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">수량</label>
              <input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} placeholder="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">단위</label>
              <input type="text" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="mL, g, 개..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">유효기간</label>
              <input type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">보관 위치</label>
              <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="예: -20℃ 냉동고 2번" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">메모</label>
              <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="기타 메모" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="needs_order" checked={form.needs_order} onChange={e => setForm(f => ({ ...f, needs_order: e.target.checked }))} className="w-4 h-4" />
              <label htmlFor="needs_order" className="text-sm text-gray-600">발주 필요</label>
            </div>
            <div className="col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">취소</button>
              <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">저장</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {reagents.length === 0 && <p className="text-gray-400 text-sm py-8 text-center">등록된 시약이 없습니다.</p>}
        {reagents.map(r => (
          <div key={r.id} onClick={() => setSelected(r === selected ? null : r)} className={`bg-white border rounded-xl p-5 cursor-pointer hover:border-blue-300 transition-colors ${r.needs_order ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-800">{r.name}</h3>
                <div className="flex items-center gap-3 mt-1">
                  {r.quantity != null && <span className="text-sm text-gray-500">{r.quantity} {r.unit}</span>}
                  {r.location && <span className="text-xs text-gray-400">{r.location}</span>}
                  {r.expiry_date && <span className="text-xs text-gray-400">유효: {r.expiry_date}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {r.needs_order && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">발주 필요</span>}
              </div>
            </div>
            {selected?.id === r.id && (
              <div className="mt-4 space-y-3 text-sm text-gray-600 border-t border-gray-100 pt-4">
                {r.notes && <div><span className="font-medium text-gray-700">메모</span><p className="mt-1 whitespace-pre-wrap">{r.notes}</p></div>}
                <div className="flex gap-3">
                  <button onClick={e => { e.stopPropagation(); toggleOrder(r.id, r.needs_order) }}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${r.needs_order ? 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100' : 'bg-red-50 text-red-600 border-red-300 hover:bg-red-100'}`}>
                    {r.needs_order ? '✓ 발주 완료 처리' : '⚠️ 발주 필요 표시'}
                  </button>
                  <button onClick={e => { e.stopPropagation(); handleDelete(r.id) }} className="text-xs text-red-500 hover:text-red-700">삭제</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
