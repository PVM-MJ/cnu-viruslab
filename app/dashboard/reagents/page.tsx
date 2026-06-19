'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { STORAGE_LOCATIONS } from '@/lib/storage-locations'
import type { Reagent } from '@/lib/types'

type Tab = 'inventory' | 'orders'

const EMPTY_REAGENT = { name: '', quantity: '', unit: 'mL', expiry_date: '', location: '', notes: '' }
const EMPTY_ORDER   = { name: '', quantity: '', unit: '', notes: '', requester: '' }

export default function ReagentsPage() {
  const [tab, setTab] = useState<Tab>('inventory')

  // 시약 현황
  const [reagents, setReagents]     = useState<Reagent[]>([])
  const [showForm, setShowForm]     = useState(false)
  const [form, setForm]             = useState(EMPTY_REAGENT)
  const [selected, setSelected]     = useState<Reagent | null>(null)
  const [loading, setLoading]       = useState(false)

  // 시약 주문요청
  const [orders, setOrders]         = useState<Reagent[]>([])
  const [showOrder, setShowOrder]   = useState(false)
  const [orderForm, setOrderForm]   = useState(EMPTY_ORDER)
  const [orderLoading, setOrderLoading] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Reagent | null>(null)

  async function fetchReagents() {
    const { data } = await supabase.from('reagents').select('*').eq('needs_order', false).order('name')
    setReagents(data ?? [])
  }

  async function fetchOrders() {
    const { data } = await supabase.from('reagents').select('*').eq('needs_order', true).order('updated_at', { ascending: false })
    setOrders(data ?? [])
  }

  useEffect(() => {
    fetchReagents()
    fetchOrders()
    setShowForm(false)
    setShowOrder(false)
    setSelected(null)
    setSelectedOrder(null)
  }, [tab])

  // ── 시약 현황 핸들러 ──────────────────────────────────────────
  async function handleAddReagent(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await supabase.from('reagents').insert([{
      name: form.name,
      quantity: form.quantity ? Number(form.quantity) : null,
      unit: form.unit || null,
      expiry_date: form.expiry_date || null,
      location: form.location || null,
      needs_order: false,
      notes: form.notes || null,
    }])
    setForm(EMPTY_REAGENT)
    setShowForm(false)
    setLoading(false)
    fetchReagents()
  }

  async function handleDeleteReagent(id: string) {
    if (!confirm('삭제하시겠습니까?')) return
    await supabase.from('reagents').delete().eq('id', id)
    setSelected(null)
    fetchReagents()
  }

  // ── 시약 주문요청 핸들러 ──────────────────────────────────────
  async function handleAddOrder(e: React.FormEvent) {
    e.preventDefault()
    setOrderLoading(true)
    await supabase.from('reagents').insert([{
      name: orderForm.name,
      quantity: orderForm.quantity ? Number(orderForm.quantity) : null,
      unit: orderForm.unit || null,
      needs_order: true,
      notes: orderForm.notes
        ? `[요청자: ${orderForm.requester || '미입력'}] ${orderForm.notes}`
        : orderForm.requester ? `[요청자: ${orderForm.requester}]` : null,
    }])
    setOrderForm(EMPTY_ORDER)
    setShowOrder(false)
    setOrderLoading(false)
    fetchOrders()
  }

  async function handleOrderDone(id: string) {
    await supabase.from('reagents').update({ needs_order: false, updated_at: new Date().toISOString() }).eq('id', id)
    fetchOrders()
    fetchReagents()
  }

  async function handleDeleteOrder(id: string) {
    if (!confirm('삭제하시겠습니까?')) return
    await supabase.from('reagents').delete().eq('id', id)
    setSelectedOrder(null)
    fetchOrders()
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">💊 시약 재고</h2>

      {/* 탭 */}
      <div className="flex gap-2 mb-6">
        {([
          { key: 'inventory', label: '시약 현황', icon: '🧴', count: reagents.length },
          { key: 'orders',    label: '시약 주문요청', icon: '📋', count: orders.length },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border transition-colors ${
              tab === t.key
                ? t.key === 'orders'
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
            }`}>
            <span>{t.icon}</span>
            {t.label}
            {t.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                tab === t.key ? 'bg-white/20 text-white' : t.key === 'orders' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'
              }`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── 시약 현황 탭 ── */}
      {tab === 'inventory' && (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={() => { setShowForm(v => !v); setSelected(null) }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
              + 시약 등록
            </button>
          </div>

          {showForm && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
              <h3 className="font-semibold text-gray-700 mb-4">새 시약 등록</h3>
              <form onSubmit={handleAddReagent} className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">시약명 *</label>
                  <input type="text" required value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="예: TRIzol Reagent"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">수량</label>
                  <input type="number" value={form.quantity}
                    onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">단위</label>
                  <input type="text" value={form.unit}
                    onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                    placeholder="mL, g, 개..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">유효기간</label>
                  <input type="date" value={form.expiry_date}
                    onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">보관 위치</label>
                  <select value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" />
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

          <div className="space-y-3">
            {reagents.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-3">🧴</div>
                <p className="text-sm">등록된 시약이 없습니다.</p>
              </div>
            )}
            {reagents.map(r => (
              <div key={r.id}
                onClick={() => setSelected(selected?.id === r.id ? null : r)}
                className={`bg-white border rounded-xl p-5 cursor-pointer transition-colors ${
                  selected?.id === r.id ? 'border-blue-300 shadow-sm' : 'border-gray-200 hover:border-blue-200'
                }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800">{r.name}</h3>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {r.quantity != null && (
                        <span className="text-sm text-gray-500">{r.quantity} {r.unit}</span>
                      )}
                      {r.expiry_date && (
                        <span className="text-xs text-gray-400">유효: {r.expiry_date}</span>
                      )}
                    </div>
                  </div>
                  {r.location && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded shrink-0 ml-4">{r.location}</span>
                  )}
                </div>
                {selected?.id === r.id && (
                  <div className="mt-4 space-y-2 text-sm border-t border-gray-100 pt-4">
                    {r.notes && (
                      <p className="text-gray-600 whitespace-pre-wrap text-xs">{r.notes}</p>
                    )}
                    <button onClick={e => { e.stopPropagation(); handleDeleteReagent(r.id) }}
                      className="text-xs text-red-400 hover:text-red-600">삭제</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── 시약 주문요청 탭 ── */}
      {tab === 'orders' && (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={() => { setShowOrder(v => !v); setSelectedOrder(null) }}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium">
              + 주문 요청
            </button>
          </div>

          {showOrder && (
            <div className="bg-white border border-orange-100 rounded-xl p-6 mb-6 shadow-sm">
              <h3 className="font-semibold text-gray-700 mb-4">📋 새 주문 요청</h3>
              <form onSubmit={handleAddOrder} className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">시약명 *</label>
                  <input type="text" required value={orderForm.name}
                    onChange={e => setOrderForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="예: SYBR Green Master Mix"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">수량</label>
                  <input type="number" value={orderForm.quantity}
                    onChange={e => setOrderForm(f => ({ ...f, quantity: e.target.value }))}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">단위</label>
                  <input type="text" value={orderForm.unit}
                    onChange={e => setOrderForm(f => ({ ...f, unit: e.target.value }))}
                    placeholder="mL, g, 개..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">요청자</label>
                  <input type="text" value={orderForm.requester}
                    onChange={e => setOrderForm(f => ({ ...f, requester: e.target.value }))}
                    placeholder="이름"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">메모 (카탈로그 번호, 제조사 등)</label>
                  <textarea rows={2} value={orderForm.notes}
                    onChange={e => setOrderForm(f => ({ ...f, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" />
                </div>
                <div className="col-span-2 flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowOrder(false)}
                    className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">취소</button>
                  <button type="submit" disabled={orderLoading}
                    className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">요청 등록</button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-3">
            {orders.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-sm">주문 요청된 시약이 없습니다.</p>
              </div>
            )}
            {orders.map(r => (
              <div key={r.id}
                onClick={() => setSelectedOrder(selectedOrder?.id === r.id ? null : r)}
                className={`bg-white border rounded-xl p-5 cursor-pointer transition-colors ${
                  selectedOrder?.id === r.id ? 'border-orange-300 shadow-sm' : 'border-orange-200 bg-orange-50 hover:border-orange-300'
                }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800">{r.name}</h3>
                    {r.quantity != null && (
                      <p className="text-sm text-gray-500 mt-0.5">{r.quantity} {r.unit}</p>
                    )}
                  </div>
                  <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium shrink-0 ml-4">주문 대기</span>
                </div>
                {r.notes && (
                  <p className="text-xs text-gray-500 mt-2 truncate">{r.notes}</p>
                )}
                {selectedOrder?.id === r.id && (
                  <div className="mt-4 space-y-3 border-t border-orange-100 pt-4">
                    {r.notes && (
                      <p className="text-xs text-gray-600 whitespace-pre-wrap">{r.notes}</p>
                    )}
                    <div className="flex gap-2">
                      <button onClick={e => { e.stopPropagation(); handleOrderDone(r.id) }}
                        className="px-3 py-1.5 text-xs bg-green-50 text-green-700 border border-green-300 rounded-lg hover:bg-green-100">
                        ✓ 주문 완료 — 시약 현황으로 이동
                      </button>
                      <button onClick={e => { e.stopPropagation(); handleDeleteOrder(r.id) }}
                        className="text-xs text-red-400 hover:text-red-600 px-2">삭제</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
