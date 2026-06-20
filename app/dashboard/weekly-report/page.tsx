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
  return dow === 0 ? 6 : dow - 1 // 0=Mon, 6=Sun
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
  padding: '12px 14px',
  verticalAlign: 'top',
  lineHeight: '1.7',
  fontSize: '12px',
}

const tdDayStyle: React.CSSProperties = {
  ...tdStyle,
  textAlign: 'center',
  fontWeight: 'bold',
  verticalAlign: 'middle',
  fontSize: '13px',
}

export default function WeeklyReportPage() {
  const todayStr = new Date().toISOString().split('T')[0]
  const [researcher, setResearcher] = useState('민재')
  const [weekDate, setWeekDate] = useState(todayStr)
  const [englishName, setEnglishName] = useState(DEFAULT_EN_NAMES['민재'])
  const [logs, setLogs] = useState<ResearchLog[]>([])
  const [loading, setLoading] = useState(false)

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
      const { data } = await supabase
        .from('research_logs')
        .select('id, researcher, date, projects, content')
        .eq('researcher', researcher)
        .gte('date', monday)
        .lte('date', sunday)
        .order('date', { ascending: true })
      setLogs(data ?? [])
      setLoading(false)
    }
    load()
  }, [researcher, monday, sunday])

  const byDay: Record<string, ResearchLog[]> = {}
  for (const log of logs) {
    const dayName = DAYS[getDayIndex(log.date)]
    if (!byDay[dayName]) byDay[dayName] = []
    byDay[dayName].push(log)
  }

  return (
    <>
      <style>{`
        @media print {
          aside, .no-print { display: none !important; }
          main { padding: 24px !important; }
          @page { margin: 18mm 20mm; size: A4 portrait; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      {/* 컨트롤 패널 (인쇄 시 숨김) */}
      <div className="no-print mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-5">📄 위클리 리포트</h2>

        <div className="flex flex-wrap gap-4 items-end mb-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">연구원</label>
            <select
              value={researcher}
              onChange={e => setResearcher(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {LAB_MEMBERS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">영문 이름 (PDF에 표시)</label>
            <input
              type="text"
              value={englishName}
              onChange={e => handleEnglishNameChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-44 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">주간 날짜 선택</label>
            <input
              type="date"
              value={weekDate}
              onChange={e => setWeekDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={() => window.print()}
            className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            🖨️ PDF로 저장
          </button>
        </div>

        <p className="text-xs text-gray-400">
          주간: {formatWeekLabel(monday, sunday)}
          {loading && <span className="ml-2">불러오는 중…</span>}
          {!loading && logs.length === 0 && <span className="ml-2 text-amber-500">이 주에 작성된 기록이 없습니다</span>}
          {!loading && logs.length > 0 && <span className="ml-2 text-green-600">{logs.length}개 기록 로드됨</span>}
        </p>
      </div>

      {/* 리포트 본문 */}
      <div style={{ fontFamily: 'Arial, sans-serif' }}>
        {/* 헤더 */}
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          marginBottom: '20px',
        }}>
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
              const dayLogs = byDay[day] ?? []

              const projectLines = dayLogs
                .flatMap(l => (l.projects ?? '').split(',').map(s => s.trim()))
                .filter(Boolean)
                .filter((v, i, arr) => arr.indexOf(v) === i) // deduplicate

              const workLines = dayLogs.flatMap(l =>
                l.content.split('\n').map(s => s.trim()).filter(Boolean)
              )

              return (
                <tr key={day}>
                  <td style={tdDayStyle}>{day}</td>
                  <td style={tdStyle}>
                    {projectLines.map((p, i) => (
                      <div key={i}>{p}</div>
                    ))}
                  </td>
                  <td style={tdStyle}>
                    {workLines.map((line, i) => (
                      <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '2px' }}>
                        <span style={{ flexShrink: 0 }}>•</span>
                        <span>{line}</span>
                      </div>
                    ))}
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
