'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface PlantRecord {
  id: string
  shelf_id: string
  plant_name: string
  experiment: string | null
  stage: string | null
  notes: string | null
  start_date: string | null
  created_at: string
}

const STAGES = ['파종', '발아', '생육', '접종', '관찰 중', '완료']
const C = 46 // cell size in SVG units

const EMPTY_FORM = { plant_name: '', experiment: '', stage: '파종', notes: '', start_date: '' }

function sectionLabel(id: string) {
  if (id.startsWith('LU')) return '좌측 상단'
  if (id.startsWith('LL')) return '좌측 하단'
  return '우측'
}

export default function PlantRoomPage() {
  const [selected, setSelected] = useState<string | null>(null)
  const [records, setRecords] = useState<PlantRecord[]>([])
  const [occupied, setOccupied] = useState<Set<string>>(new Set())
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const fetchOccupied = useCallback(async () => {
    const { data } = await supabase.from('plant_records').select('shelf_id')
    setOccupied(new Set((data ?? []).map((r: { shelf_id: string }) => r.shelf_id)))
  }, [])

  const fetchRecords = useCallback(async (id: string) => {
    const { data } = await supabase.from('plant_records').select('*').eq('shelf_id', id).order('created_at', { ascending: false })
    setRecords(data ?? [])
  }, [])

  useEffect(() => { fetchOccupied() }, [fetchOccupied])

  function selectCell(id: string) {
    if (selected === id) { setSelected(null); setRecords([]); setShowForm(false); return }
    setSelected(id)
    fetchRecords(id)
    setShowForm(false)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    setSaving(true)
    await supabase.from('plant_records').insert([{
      shelf_id: selected,
      plant_name: form.plant_name,
      experiment: form.experiment || null,
      stage: form.stage || null,
      notes: form.notes || null,
      start_date: form.start_date || null,
    }])
    setForm(EMPTY_FORM)
    setShowForm(false)
    setSaving(false)
    fetchRecords(selected)
    fetchOccupied()
  }

  async function handleDelete(id: string) {
    if (!confirm('삭제하시겠습니까?')) return
    await supabase.from('plant_records').delete().eq('id', id)
    if (selected) fetchRecords(selected)
    fetchOccupied()
  }

  // Render a single shelf cell
  function Cell({ section, row, col, x, y }: { section: string; row: number; col: number; x: number; y: number }) {
    const id = `${section}-${row}-${col}`
    const isSel = selected === id
    const hasPlant = occupied.has(id)
    return (
      <g onClick={() => selectCell(id)} style={{ cursor: 'pointer' }}>
        <rect x={x} y={y} width={C} height={C}
          fill={isSel ? '#2563EB' : hasPlant ? '#D1FAE5' : 'white'}
          stroke={isSel ? '#1D4ED8' : hasPlant ? '#6EE7B7' : '#D1D5DB'}
          strokeWidth={isSel ? 2 : 1}
        />
        <text x={x + C / 2} y={y + C / 2} textAnchor="middle" dominantBaseline="middle"
          fontSize={8.5} fill={isSel ? 'white' : '#9CA3AF'} fontFamily="system-ui">
          {section}{row}-{col}
        </text>
        {hasPlant && !isSel && (
          <circle cx={x + C - 6} cy={y + 6} r={4.5} fill="#10B981" />
        )}
      </g>
    )
  }

  // Layout constants (C=46: LU 4×4=184, LL 3×5=138×230, R 4×8=184×368)
  const LU_X = 15, LU_Y = 20
  const LL_X = 15, LL_Y = LU_Y + 4 * C
  const R_X  = 15 + 4 * C + 140, R_Y = 20  // 15+184+140=339

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">🌱 식물방 도면</h2>
      <p className="text-sm text-gray-400 mb-5">선반 칸을 클릭하면 재배 현황을 확인하고 추가할 수 있습니다</p>

      <div className="flex gap-5 items-start">
        {/* SVG Floor Plan */}
        <div className="bg-white border border-gray-200 rounded-xl p-3 overflow-x-auto">
          <svg viewBox="0 0 660 480" className="w-full" style={{ minWidth: 500, maxWidth: 700 }}>
            {/* Room background — 650×470 */}
            <rect x={5} y={5} width={650} height={468} fill="#F8FAFC" stroke="#374151" strokeWidth={2} rx={2} />

            {/* Section background fills */}
            <rect x={LU_X - 1} y={LU_Y - 1} width={4 * C + 2} height={4 * C + 2} fill="#EFF6FF" rx={1} />
            <rect x={LL_X - 1} y={LL_Y - 1} width={3 * C + 2} height={5 * C + 2} fill="#EFF6FF" rx={1} />
            <rect x={R_X  - 1} y={R_Y  - 1} width={4 * C + 2} height={8 * C + 2} fill="#F0FDF4" rx={1} />

            {/* Left upper shelf (4 × 4) */}
            {Array.from({ length: 4 }, (_, r) =>
              Array.from({ length: 4 }, (_, c) => (
                <Cell key={`LU-${r+1}-${c+1}`} section="LU" row={r+1} col={c+1}
                  x={LU_X + c * C} y={LU_Y + r * C} />
              ))
            )}

            {/* Left lower shelf (3 × 5) */}
            {Array.from({ length: 5 }, (_, r) =>
              Array.from({ length: 3 }, (_, c) => (
                <Cell key={`LL-${r+1}-${c+1}`} section="LL" row={r+1} col={c+1}
                  x={LL_X + c * C} y={LL_Y + r * C} />
              ))
            )}

            {/* Right shelf (4 × 8) */}
            {Array.from({ length: 8 }, (_, r) =>
              Array.from({ length: 4 }, (_, c) => (
                <Cell key={`R-${r+1}-${c+1}`} section="R" row={r+1} col={c+1}
                  x={R_X + c * C} y={R_Y + r * C} />
              ))
            )}

            {/* Section labels */}
            <text x={LU_X + 2 * C} y={LU_Y - 8} textAnchor="middle" fontSize={11} fill="#6B7280" fontFamily="system-ui">좌측 상단</text>
            <text x={R_X  + 2 * C} y={R_Y  - 8} textAnchor="middle" fontSize={11} fill="#6B7280" fontFamily="system-ui">우측</text>

            {/* Door — gap in bottom wall + arc */}
            <rect x={280} y={469} width={90} height={8} fill="#F8FAFC" />
            <path d="M 280 471 A 45 45 0 0 1 370 471" fill="none" stroke="#9CA3AF" strokeWidth={1.5} />
            <text x={325} y={490} textAnchor="middle" fontSize={10} fill="#9CA3AF" fontFamily="system-ui">출입문</text>
          </svg>
        </div>

        {/* Side panel */}
        {selected && (
          <div className="w-64 shrink-0 bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-gray-800 text-sm">{selected}</h3>
                <p className="text-xs text-gray-400">{sectionLabel(selected)} 선반</p>
              </div>
              <button onClick={() => { setSelected(null); setShowForm(false) }}
                className="text-gray-300 hover:text-gray-500 text-xl">×</button>
            </div>

            <button onClick={() => setShowForm(v => !v)}
              className="w-full py-2 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 mb-3 transition-colors">
              + 식물 추가
            </button>

            {showForm && (
              <form onSubmit={handleAdd} className="space-y-2 mb-4 p-3 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-xs text-gray-600 mb-0.5">식물/품종 *</label>
                  <input required type="text" value={form.plant_name}
                    onChange={e => setForm(f => ({ ...f, plant_name: e.target.value }))}
                    placeholder="예: N. benthamiana"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-0.5">실험명</label>
                  <input type="text" value={form.experiment}
                    onChange={e => setForm(f => ({ ...f, experiment: e.target.value }))}
                    placeholder="관련 실험"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-0.5">생육 단계</label>
                  <select value={form.stage}
                    onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs bg-white">
                    {STAGES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-0.5">파종일</label>
                  <input type="date" value={form.start_date}
                    onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-0.5">메모</label>
                  <textarea rows={2} value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs resize-none" />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50">취소</button>
                  <button type="submit" disabled={saving}
                    className="flex-1 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">저장</button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {records.length === 0 ? (
                <p className="text-xs text-gray-300 text-center py-4">재배 중인 식물 없음</p>
              ) : (
                records.map(r => (
                  <div key={r.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <p className="text-xs font-semibold text-gray-700 flex-1">{r.plant_name}</p>
                      <button onClick={() => handleDelete(r.id)}
                        className="text-xs text-red-400 hover:text-red-600 ml-2 shrink-0">×</button>
                    </div>
                    {r.experiment && <p className="text-xs text-gray-500 mt-0.5">{r.experiment}</p>}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {r.stage && (
                        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">{r.stage}</span>
                      )}
                      {r.start_date && <span className="text-xs text-gray-400">{r.start_date}</span>}
                    </div>
                    {r.notes && <p className="text-xs text-gray-400 mt-1 whitespace-pre-wrap">{r.notes}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-4 flex-wrap">
        {[
          { bg: 'bg-white border-gray-200', label: '비어있음' },
          { bg: 'bg-green-100 border-green-400', label: '식물 있음' },
          { bg: 'bg-blue-600 border-blue-700', label: '선택됨' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className={`w-3.5 h-3.5 rounded border ${l.bg}`} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  )
}
