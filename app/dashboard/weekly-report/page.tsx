'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const LAB_MEMBERS = ['광호', '예연', '지민', '민재', '주호']
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const DEFAULT_EN_NAMES: Record<string, string> = {
  '광호': 'Kwang-Ho-Kim',
  '예연': 'Ye-Yeon-Kim',
  '지민': 'Ji-Min-Kim',
  '민재': 'Min-Jae-Kim',
  '주호': 'Ju-Ho-Kim',
}

interface ResearchLog {
  id: string
  researcher: string
  date: string
  projects: string | null
  content: string
}

function getWeekRange(dateStr: string): { monday: string; sunday: string } {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const dow = date.getDay()
  const diffToMon = dow === 0 ? -6 : 1 - dow
  const mon = new Date(date)
  mon.setDate(date.getDate() + diffToMon)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  const fmt = (dt: Date) =>
    `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
  return { monday: fmt(mon), sunday: fmt(sun) }
}

function getDayIndex(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dow = new Date(y, m - 1, d).getDay()
  return dow === 0 ? 6 : dow - 1
}

function formatWeekLabel(monday: string, sunday: string) {
  const fmt = (s: string) => {
    const [y, m, d] = s.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
  return `${fmt(monday)} – ${fmt(sunday)}`
}

const thStyle: React.CSSProperties = {
  border: '1px solid #1a1a1a',
  padding: '8px 14px',
  textAlign: 'center',
  fontWeight: 'bold',
  backgroundColor: '#f5f5f5',
  fontSize: '13px',
}

const tdStyle: React.CSSProperties = {
  border: '1px solid #1a1a1a',
  padding: '10px 14px',
  verticalAlign: 'top',
  lineHeight: '1.7',
  fontSize: '12px',
}

export default function WeeklyReportPage() {
  const todayStr = new Date().toISOString().split('T')[0]
  const [researcher, setResearcher] = useState('민재')
  const [weekDate, setWeekDate] = useState(todayStr)
  const [englishName, setEnglishName] = useState(DEFAULT_EN_NAMES['민재'])
  const [logs, setLogs] = useState<ResearchLog[]>([])
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiApplied, setAiApplied] = useState(false)

  const [dayProjects, setDayProjects] = useState<Record<string, string>>({})
  const [dayWorks, setDayWorks] = useState<Record<string, string>>({})
  const [editing, setEditing] = useState<{ day: string; field: 'projects' | 'works' } | null>(null)

  const { monday, sunday } = getWeekRange(weekDate)

  useEffect(() => {
    const saved = localStorage.getItem(`weekly-en-name-${researcher}`)
    setEnglishName(saved ?? DEFAULT_EN_NAMES[researcher] ?? researcher)
  }, [researcher])

  function handleEnglishNameChange(v: string) {
    setEnglishName(v)
    localStorage.setItem(`weekly-en-name-${researcher}`, v)
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      setAiApplied(false)
      setEditing(null)

      const { data } = await supabase
        .from('research_logs')
        .select('id, researcher, date, projects, content')
        .eq('researcher', researcher)
        .gte('date', monday)
        .lte('date', sunday)
        .order('date', { ascending: true })

      const fetched = data ?? []
      setLogs(fetched)

      // Group logs by day
      const byDay: Record<string, ResearchLog[]> = {}
      for (const log of fetched) {
        const dayName = DAYS[getDayIndex(log.date)]
        if (!byDay[dayName]) byDay[dayName] = []
        byDay[dayName].push(log)
      }

      // Build initial per-day state from raw DB data
      const projState: Record<string, string> = {}
      const worksState: Record<string, string> = {}
      for (const day of DAYS) {
        const dayLogs = byDay[day] ?? []
        projState[day] = dayLogs
          .flatMap(l => (l.projects ?? '').split(',').map(s => s.trim()))
          .filter(Boolean)
          .filter((v, i, arr) => arr.indexOf(v) === i)
          .join('\n')
        worksState[day] = dayLogs
          .flatMap(l => l.content.split('\n').map(s => s.trim()).filter(Boolean))
          .join('\n')
      }
      setDayProjects(projState)
      setDayWorks(worksState)
      setLoading(false)
    }
    load()
  }, [researcher, monday, sunday])

  async function handleAiSummarize() {
    const daysData = DAYS
      .map(day => ({ day, content: dayWorks[day] ?? '' }))
      .filter(d => d.content.trim())

    if (daysData.length === 0) {
      alert('연구 일지 내용이 없습니다.')
      return
    }

    setAiLoading(true)
    try {
      const res = await fetch('/api/weekly-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: daysData }),
      })
      const data = await res.json()
      if (data.error) { alert('AI 오류: ' + data.error); return }

      const { summaries } = data as { summaries: Record<string, string[]> }
      setDayWorks(prev => {
        const next = { ...prev }
        for (const [day, lines] of Object.entries(summaries)) {
          next[day] = lines.join('\n')
        }
        return next
      })
      setAiApplied(true)
    } catch (err) {
      alert('AI 오류: ' + (err instanceof Error ? err.message : '네트워크 오류'))
    } finally {
      setAiLoading(false)
    }
  }

  function renderBullets(text: string) {
    return text.split('\n').map(s => s.trim()).filter(Boolean).map((line, i) => (
      <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '2px' }}>
        <span style={{ flexShrink: 0 }}>•</span>
        <span>{line}</span>
      </div>
    ))
  }

  function renderLines(text: string) {
    return text.split('\n').map(s => s.trim()).filter(Boolean).map((line, i) => (
      <div key={i}>{line}</div>
    ))
  }

  function isEditing(day: string, field: 'projects' | 'works') {
    return editing?.day === day && editing?.field === field
  }

  return (
    <>
      <style>{`
        @media print {
          aside, .no-print { display: none !important; }
          main { padding: 24px !important; }
          @page { margin: 18mm 20mm; size: A4 portrait; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          textarea { display: none !important; }
          .print-text { display: block !important; }
        }
        .print-text { display: none; }
        textarea {
          width: 100%;
          border: 1.5px solid #6366f1;
          border-radius: 4px;
          padding: 6px 8px;
          font-size: 12px;
          line-height: 1.6;
          font-family: Arial, sans-serif;
          resize: vertical;
          outline: none;
          box-sizing: border-box;
          background: #f5f3ff;
        }
        .edit-hint {
          display: none;
        }
        td:hover .edit-hint {
          display: inline;
        }
      `}</style>

      {/* 컨트롤 패널 */}
      <div className="no-print mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-5">📄 위클리 리포트</h2>

        <div className="flex flex-wrap gap-4 items-end mb-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">연구원</label>
            <select value={researcher} onChange={e => setResearcher(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              {LAB_MEMBERS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">영문 이름</label>
            <input type="text" value={englishName} onChange={e => handleEnglishNameChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-44 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">날짜 선택 (해당 주)</label>
            <input type="date" value={weekDate} onChange={e => setWeekDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <button
            onClick={handleAiSummarize}
            disabled={aiLoading || loading || logs.length === 0}
            className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
          >
            {aiLoading
              ? <><span className="animate-spin inline-block">⟳</span> AI 요약 중…</>
              : aiApplied
                ? <>✨ AI 재요약</>
                : <>✨ AI 영문 요약</>}
          </button>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            🖨️ PDF로 저장
          </button>
        </div>

        <p className="text-xs text-gray-400">
          주간: {formatWeekLabel(monday, sunday)}
          {loading && <span className="ml-2">불러오는 중…</span>}
          {!loading && logs.length === 0 && <span className="ml-2 text-amber-500">이 주에 작성된 기록이 없습니다</span>}
          {!loading && logs.length > 0 && !aiApplied && (
            <span className="ml-2 text-gray-500">{logs.length}개 기록 로드됨 — ✨ AI 영문 요약을 눌러 영어로 변환하세요</span>
          )}
          {aiApplied && <span className="ml-2 text-purple-600">AI 영문 요약 완료 — 셀을 클릭하면 수정할 수 있어요</span>}
        </p>
      </div>

      {/* 리포트 본문 */}
      <div style={{ fontFamily: 'Arial, sans-serif' }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '20px' }}>
          <div style={{ flex: 1 }} />
          <p style={{ flex: 1, textAlign: 'center', fontWeight: 'bold', fontSize: '16px', margin: 0 }}>
            Weekly report
          </p>
          <p style={{ flex: 1, textAlign: 'right', fontSize: '13px', margin: 0 }}>
            Name: {englishName}
          </p>
        </div>

        {/* 테이블 */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <colgroup>
            <col style={{ width: '11%' }} />
            <col style={{ width: '22%' }} />
            <col style={{ width: '67%' }} />
          </colgroup>
          <thead>
            <tr>
              <th style={thStyle}></th>
              <th style={thStyle}>Projects</th>
              <th style={thStyle}>Works done</th>
            </tr>
          </thead>
          <tbody>
            {DAYS.map(day => {
              const projText = dayProjects[day] ?? ''
              const worksText = dayWorks[day] ?? ''

              return (
                <tr key={day}>
                  {/* 요일 */}
                  <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 'bold', verticalAlign: 'middle', fontSize: '13px' }}>
                    {day}
                  </td>

                  {/* Projects */}
                  <td
                    style={{ ...tdStyle, cursor: 'pointer', minHeight: '52px', position: 'relative' }}
                    onClick={() => !isEditing(day, 'projects') && setEditing({ day, field: 'projects' })}
                  >
                    {isEditing(day, 'projects') ? (
                      <textarea
                        autoFocus
                        rows={3}
                        value={projText}
                        onChange={e => setDayProjects(prev => ({ ...prev, [day]: e.target.value }))}
                        onBlur={() => setEditing(null)}
                        placeholder="프로젝트명 (줄바꿈으로 구분)"
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <>
                        <div style={{ minHeight: '24px' }}>
                          {projText
                            ? renderLines(projText)
                            : <span style={{ color: '#d1d5db', fontSize: '11px' }}>클릭하여 입력</span>}
                        </div>
                        <span className="edit-hint" style={{ position: 'absolute', top: 6, right: 8, fontSize: '10px', color: '#9ca3af' }}>✏️</span>
                      </>
                    )}
                  </td>

                  {/* Works done */}
                  <td
                    style={{ ...tdStyle, cursor: 'pointer', minHeight: '52px', position: 'relative' }}
                    onClick={() => !isEditing(day, 'works') && setEditing({ day, field: 'works' })}
                  >
                    {isEditing(day, 'works') ? (
                      <textarea
                        autoFocus
                        rows={4}
                        value={worksText}
                        onChange={e => setDayWorks(prev => ({ ...prev, [day]: e.target.value }))}
                        onBlur={() => setEditing(null)}
                        placeholder="한 줄에 하나씩 입력 (각 줄이 bullet point가 됩니다)"
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <>
                        <div style={{ minHeight: '24px' }}>
                          {worksText
                            ? renderBullets(worksText)
                            : <span style={{ color: '#d1d5db', fontSize: '11px' }}>클릭하여 입력</span>}
                        </div>
                        <span className="edit-hint" style={{ position: 'absolute', top: 6, right: 8, fontSize: '10px', color: '#9ca3af' }}>✏️</span>
                      </>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
