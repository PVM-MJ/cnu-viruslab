'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { STORAGE_LOCATIONS } from '@/lib/storage-locations'
import type { Sample, Reagent } from '@/lib/types'

const STAGE_KO: Record<string, string> = {
  collected: '수집 완료', dna_extraction: 'DNA 추출',
  sequencing: '시퀀싱', analysis: '분석 중', completed: '완료',
}

// SVG layout: viewBox "0 0 975 730"
const STORAGE_SVG = [
  { id: 'freezer_20_1', lines: ['-20°C', '냉동고①'], x: 218, y: 20,  w: 108, h: 95,  fill: '#DBEAFE', stroke: '#3B82F6', tf: '#1E40AF' },
  { id: 'cabinet_powder', lines: ['분말시약', '캐비닛'],    x: 331, y: 20,  w: 163, h: 95,  fill: '#FEF9C3', stroke: '#CA8A04', tf: '#713F12' },
  { id: 'freezer_4_1',  lines: ['4°C', '냉장고①'],   x: 78,  y: 315, w: 50,  h: 100, fill: '#D1FAE5', stroke: '#059669', tf: '#064E3B' },
  { id: 'freezer_20_2', lines: ['-20°C', '냉동고②'], x: 78,  y: 430, w: 50,  h: 95,  fill: '#DBEAFE', stroke: '#3B82F6', tf: '#1E40AF' },
  { id: 'freezer_20_3', lines: ['-20°C', '냉동고③'], x: 78,  y: 545, w: 50,  h: 50,  fill: '#DBEAFE', stroke: '#3B82F6', tf: '#1E40AF' },
  { id: 'freezer_4_2',  lines: ['4°C', '냉장고②'],   x: 589, y: 545, w: 45,  h: 50,  fill: '#D1FAE5', stroke: '#059669', tf: '#064E3B' },
  { id: 'freezer_4_3',  lines: ['4°C', '냉장고③'],   x: 589, y: 598, w: 45,  h: 55,  fill: '#D1FAE5', stroke: '#059669', tf: '#064E3B' },
  { id: 'freezer_20_4', lines: ['-20°C', '냉동고④'], x: 860, y: 20,  w: 105, h: 80,  fill: '#DBEAFE', stroke: '#3B82F6', tf: '#1E40AF' },
  { id: 'freezer_80',   lines: ['-80°C', '냉동고'],   x: 860, y: 105, w: 105, h: 80,  fill: '#EDE9FE', stroke: '#7C3AED', tf: '#3B0764' },
  { id: 'cabinet_liquid', lines: ['액체시약', '캐비닛'],  x: 695, y: 590, w: 150, h: 95,  fill: '#FEF9C3', stroke: '#CA8A04', tf: '#713F12' },
]

interface Selected { id: string; label: string; temp?: string }

export default function FloorplanPage() {
  const [selected, setSelected] = useState<Selected | null>(null)
  const [samples, setSamples] = useState<Sample[]>([])
  const [reagents, setReagents] = useState<Reagent[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    Promise.all([
      supabase.from('samples').select('*').eq('location', selected.id).order('created_at', { ascending: false }),
      supabase.from('reagents').select('*').eq('location', selected.id).order('name'),
    ]).then(([s, r]) => {
      setSamples(s.data ?? [])
      setReagents(r.data ?? [])
      setLoading(false)
    })
  }, [selected])

  function clickStorage(unit: typeof STORAGE_SVG[number]) {
    if (selected?.id === unit.id) { setSelected(null); return }
    const meta = STORAGE_LOCATIONS.find(l => l.id === unit.id)
    setSelected({ id: unit.id, label: meta?.label ?? unit.id, temp: meta?.temp })
  }

  const wallLabels = [
    { lines: ['Clean-', 'bench I'], y: 20,  h: 95  },
    { lines: ['Digital', 'PCR'],    y: 150, h: 140 },
    { lines: ['Centri-', 'fuge'],   y: 315, h: 100 },
    { lines: ['qPCR'],              y: 430, h: 95  },
    { lines: ['Quality', 'Calc.'],  y: 545, h: 103 },
    { lines: ['Incubator', '& W-B'],y: 665, h: 60  },
  ]

  const equipment = [
    { label: 'Clean-bench II',       x: 78,  y: 20,  w: 135, h: 95  },
    { label: 'Shaking Incubator',    x: 499, y: 20,  w: 135, h: 95  },
    { label: 'PCR-Table',            x: 78,  y: 150, w: 556, h: 55  },
    { label: 'Computer',             x: 383, y: 430, w: 251, h: 95  },
    { label: 'PAGE Gel &\nHeat Block', x: 133, y: 545, w: 150, h: 50 },
    { label: 'Sonicator',            x: 78,  y: 598, w: 90,  h: 55  },
    { label: 'Table',                x: 173, y: 598, w: 411, h: 55  },
    { label: 'Incubator',            x: 78,  y: 665, w: 185, h: 57  },
    { label: 'Autoclave',            x: 268, y: 665, w: 185, h: 57  },
    { label: 'Centrifuge',           x: 458, y: 665, w: 176, h: 57  },
    { label: 'Computer',             x: 860, y: 190, w: 105, h: 60  },
    { label: 'Table',                x: 860, y: 395, w: 105, h: 140 },
    { label: 'Clean-bench III',      x: 860, y: 540, w: 105, h: 150 },
  ]

  const desks = [
    { name: '광호', x: 78,  y: 210, w: 278, h: 80  },
    { name: '예연', x: 356, y: 210, w: 278, h: 80  },
    { name: '지민', x: 133, y: 315, w: 250, h: 100 },
    { name: '나림', x: 383, y: 315, w: 251, h: 100 },
    { name: '민재', x: 133, y: 430, w: 250, h: 95  },
    { name: '주호', x: 288, y: 545, w: 296, h: 50  },
  ]

  function Txt({ x, y, w, h, lines, fs = 9, fill = '#374151', bold = false }: {
    x: number; y: number; w: number; h: number; lines: string[]; fs?: number; fill?: string; bold?: boolean
  }) {
    const lh = fs + 3
    return (
      <>
        {lines.map((line, i) => (
          <text key={i}
            x={x + w / 2}
            y={y + h / 2 + (i - (lines.length - 1) / 2) * lh}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={fs} fill={fill} fontFamily="system-ui, sans-serif"
            fontWeight={bold ? '600' : 'normal'}
          >{line}</text>
        ))}
      </>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">🗺️ 실험실 도면</h2>
      <p className="text-sm text-gray-400 mb-5">냉장고/캐비닛을 클릭하면 보관 내용을 확인할 수 있습니다</p>

      <div className="flex gap-4 items-start">
        {/* Floor Plan SVG */}
        <div className="flex-1 bg-white border border-gray-200 rounded-xl p-3 overflow-x-auto">
          <svg viewBox="0 0 975 730" className="w-full" style={{ minWidth: 580 }}>
            <rect width="975" height="730" fill="#F8FAFC" />

            {/* Wall labels (left) */}
            {wallLabels.map((wl, i) => (
              <g key={i}>
                <rect x={0} y={wl.y} width={73} height={wl.h} fill="#F1F5F9" stroke="#CBD5E1" strokeWidth={0.5} />
                <Txt x={0} y={wl.y} w={73} h={wl.h} lines={wl.lines} fs={7.5} fill="#64748B" />
              </g>
            ))}

            {/* Equipment (non-clickable) */}
            {equipment.map((eq, i) => (
              <g key={i}>
                <rect x={eq.x} y={eq.y} width={eq.w} height={eq.h} fill="white" stroke="#CBD5E1" strokeWidth={0.8} />
                <Txt x={eq.x} y={eq.y} w={eq.w} h={eq.h} lines={eq.label.split('\n')} fs={9} fill="#4B5563" />
              </g>
            ))}

            {/* Person desks */}
            {desks.map((d, i) => (
              <g key={i}>
                <rect x={d.x} y={d.y} width={d.w} height={d.h} fill="#F0FDF4" stroke="#BBF7D0" strokeWidth={0.8} />
                <Txt x={d.x} y={d.y} w={d.w} h={d.h} lines={[d.name]} fs={13} fill="#374151" bold />
              </g>
            ))}

            {/* Storage units (clickable) */}
            {STORAGE_SVG.map(unit => {
              const isSel = selected?.id === unit.id
              const fs = unit.w < 60 ? 7 : 8.5
              return (
                <g key={unit.id} onClick={() => clickStorage(unit)} style={{ cursor: 'pointer' }}>
                  {isSel && (
                    <rect x={unit.x - 3} y={unit.y - 3} width={unit.w + 6} height={unit.h + 6}
                      fill="none" stroke={unit.stroke} strokeWidth={1.5} strokeDasharray="5 2" rx={4} />
                  )}
                  <rect x={unit.x} y={unit.y} width={unit.w} height={unit.h}
                    fill={isSel ? unit.stroke : unit.fill}
                    stroke={unit.stroke} strokeWidth={isSel ? 2 : 1.5} rx={2}
                  />
                  <Txt x={unit.x} y={unit.y} w={unit.w} h={unit.h}
                    lines={unit.lines} fs={fs}
                    fill={isSel ? 'white' : unit.tf} bold />
                </g>
              )
            })}
          </svg>
        </div>

        {/* Side panel */}
        {selected && (
          <div className="w-64 shrink-0 bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-800 text-sm leading-tight">{selected.label}</h3>
                {selected.temp && (
                  <span className="text-xs font-medium text-blue-600 mt-0.5 block">{selected.temp}</span>
                )}
              </div>
              <button onClick={() => setSelected(null)}
                className="text-gray-300 hover:text-gray-500 text-xl leading-none ml-2 shrink-0">×</button>
            </div>

            {loading ? (
              <p className="text-xs text-gray-400 py-4 text-center">불러오는 중...</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-2">🧪 샘플 {samples.length > 0 && `(${samples.length})`}</p>
                  {samples.length === 0 ? (
                    <p className="text-xs text-gray-300">보관 중인 샘플 없음</p>
                  ) : (
                    <div className="space-y-1.5">
                      {samples.map(s => (
                        <div key={s.id} className="bg-gray-50 rounded-lg px-3 py-2">
                          <p className="text-xs font-semibold text-gray-700">{s.sample_id}</p>
                          <p className="text-xs text-gray-400">{s.type} · {STAGE_KO[s.stage] ?? s.stage}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-2">💊 시약 {reagents.length > 0 && `(${reagents.length})`}</p>
                  {reagents.length === 0 ? (
                    <p className="text-xs text-gray-300">보관 중인 시약 없음</p>
                  ) : (
                    <div className="space-y-1.5">
                      {reagents.map(r => (
                        <div key={r.id} className="bg-gray-50 rounded-lg px-3 py-2">
                          <p className="text-xs font-semibold text-gray-700">{r.name}</p>
                          <div className="flex items-center gap-1.5">
                            {r.quantity != null && <span className="text-xs text-gray-400">{r.quantity} {r.unit}</span>}
                            {r.needs_order && <span className="text-xs text-red-400">⚠️ 발주</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4">
        {[
          { color: 'bg-blue-100 border-blue-500', label: '-20°C 냉동고' },
          { color: 'bg-purple-100 border-purple-600', label: '-80°C 냉동고' },
          { color: 'bg-green-100 border-green-600', label: '4°C 냉장고' },
          { color: 'bg-yellow-100 border-yellow-500', label: '시약 캐비닛' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className={`w-3.5 h-3.5 rounded border ${l.color}`} />
            {l.label}
          </div>
        ))}
        <span className="text-xs text-gray-300 ml-1">클릭하면 보관 내용 확인 가능</span>
      </div>
    </div>
  )
}
