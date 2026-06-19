'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface LabEvent {
  id: string
  date: string
  end_date: string | null
  title: string
  type: string
  description: string | null
  time: string | null
  participants: string | null
  created_by: string | null
  created_at: string
}

const EVENT_TYPES = ['랩 미팅', '발표/세미나', '실험 일정', '외부 일정', '기타']

const TYPE_COLOR: Record<string, { bg: string; text: string; dot: string }> = {
  '랩 미팅':    { bg: '#DBEAFE', text: '#1D4ED8', dot: '#3B82F6' },
  '발표/세미나': { bg: '#EDE9FE', text: '#6D28D9', dot: '#8B5CF6' },
  '실험 일정':  { bg: '#D1FAE5', text: '#065F46', dot: '#10B981' },
  '외부 일정':  { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
  '기타':       { bg: '#F3F4F6', text: '#4B5563', dot: '#9CA3AF' },
}

const DAYS = ['일', '월', '화', '수', '목', '금', '토']
const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
const EMPTY_FORM = { title: '', type: '랩 미팅', description: '', time: '', end_date: '', participants: '', created_by: '' }

export default function LabSchedulePage() {
  const now = new Date()
  const [year, setYear]         = useState(now.getFullYear())
  const [month, setMonth]       = useState(now.getMonth())
  const [selected, setSelected] = useState<string | null>(null)
  const [events, setEvents]     = useState<LabEvent[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)

  const fetchEvents = useCallback(async () => {
    const mm = String(month + 1).padStart(2, '0')
    const lastDay = new Date(year, month + 1, 0).getDate()
    const monthStart = `${year}-${mm}-01`
    const monthEnd   = `${year}-${mm}-${String(lastDay).padStart(2, '0')}`

    // 전달 1일부터 이달 말까지 시작한 이벤트를 가져온 뒤 JS에서 이달 범위 필터
    const prevYear = month === 0 ? year - 1 : year
    const prevMM   = String(month === 0 ? 12 : month).padStart(2, '0')
    const fetchFrom = `${prevYear}-${prevMM}-01`

    const { data } = await supabase
      .from('lab_events')
      .select('*')
      .gte('date', fetchFrom)
      .lte('date', monthEnd)
      .order('time', { ascending: true, nullsFirst: true })

    // 이달에 실제로 겹치는 이벤트만 남김 (end_date 없으면 date 자체가 종료일)
    setEvents((data ?? []).filter(ev => {
      const end = ev.end_date ?? ev.date
      return end >= monthStart
    }))
  }, [year, month])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  // 특정 날짜를 포함하는 이벤트 반환
  function getEventsForDate(dateStr: string): LabEvent[] {
    return events.filter(ev => {
      const end = ev.end_date ?? ev.date
      return ev.date <= dateStr && end >= dateStr
    })
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
    setSelected(null)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
    setSelected(null)
  }
  function goToday() {
    setYear(now.getFullYear())
    setMonth(now.getMonth())
    setSelected(todayStr)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    setSaving(true)
    const { error: err } = await supabase.from('lab_events').insert([{
      date: selected,
      end_date: form.end_date && form.end_date > selected ? form.end_date : null,
      title: form.title,
      type: form.type,
      description: form.description || null,
      time: form.time || null,
      participants: form.participants || null,
      created_by: form.created_by || null,
    }])
    setSaving(false)
    if (err) return
    setForm(EMPTY_FORM)
    setShowForm(false)
    fetchEvents()
  }

  async function handleDelete(id: string) {
    if (!confirm('삭제하시겠습니까?')) return
    await supabase.from('lab_events').delete().eq('id', id)
    fetchEvents()
  }

  const todayStr   = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
  const firstDay   = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  function ds(d: number) {
    return `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
  }

  const dayEvents = selected ? getEventsForDate(selected) : []

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">📅 실험실 일정</h2>

      <div className="flex gap-5 items-start">
        {/* ── 캘린더 ── */}
        <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden min-w-0">

          {/* 월 네비게이션 */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 text-lg">‹</button>
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-gray-800 text-lg">{year}년 {MONTHS[month]}</h3>
              <button onClick={goToday} className="text-xs px-2.5 py-1 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50">오늘</button>
            </div>
            <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 text-lg">›</button>
          </div>

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
            {DAYS.map((d, i) => (
              <div key={d} className={`py-2 text-center text-xs font-semibold ${
                i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-500' : 'text-gray-500'
              }`}>{d}</div>
            ))}
          </div>

          {/* 날짜 셀 */}
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }, (_, i) => (
              <div key={`e${i}`} className="h-24 border-b border-r border-gray-50 bg-gray-50/50" />
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => {
              const d    = i + 1
              const date = ds(d)
              const col  = (firstDay + i) % 7
              const isToday    = date === todayStr
              const isSelected = date === selected

              const allEvs   = getEventsForDate(date)
              const startEvs = allEvs.filter(ev => ev.date === date)
              const contEvs  = allEvs.filter(ev => ev.date !== date)
              const total    = allEvs.length

              // 최대 2줄 표시 (시작 이벤트 우선, 나머지는 연속 바)
              const showStart = startEvs.slice(0, 2)
              const showCont  = contEvs.slice(0, Math.max(0, 2 - showStart.length))
              const remaining = total - showStart.length - showCont.length

              return (
                <div key={d}
                  onClick={() => { setSelected(isSelected ? null : date); setShowForm(false) }}
                  className={`h-24 border-b border-r border-gray-100 p-1.5 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                  }`}>

                  {/* 날짜 숫자 */}
                  <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold mb-1 ${
                    isToday   ? 'bg-blue-600 text-white' :
                    col === 0 ? 'text-red-400' :
                    col === 6 ? 'text-blue-500' : 'text-gray-700'
                  }`}>{d}</div>

                  <div className="space-y-0.5">
                    {/* 이 날 시작하는 이벤트 */}
                    {showStart.map(ev => {
                      const c = TYPE_COLOR[ev.type] ?? TYPE_COLOR['기타']
                      const isMultiDay = !!ev.end_date && ev.end_date !== ev.date
                      return (
                        <div key={ev.id}
                          className="text-xs px-1 py-0.5 rounded truncate leading-tight"
                          style={{ backgroundColor: c.bg, color: c.text }}>
                          {ev.time && <span className="opacity-60 mr-0.5">{ev.time}</span>}
                          {ev.title}
                          {isMultiDay && <span className="ml-0.5 opacity-50">›</span>}
                        </div>
                      )
                    })}

                    {/* 이전에 시작해서 이어지는 이벤트 - 얇은 색 바 */}
                    {showCont.map(ev => {
                      const c = TYPE_COLOR[ev.type] ?? TYPE_COLOR['기타']
                      const isEndDay = ev.end_date === date
                      return (
                        <div key={`c-${ev.id}`}
                          className="text-xs px-1 leading-[14px] h-[14px] truncate"
                          style={{
                            backgroundColor: c.dot,
                            color: 'white',
                            opacity: 0.75,
                            borderRadius: isEndDay ? '0 3px 3px 0' : '0',
                          }}>
                          {isEndDay ? `‹ ${ev.title}` : ev.title}
                        </div>
                      )
                    })}

                    {remaining > 0 && (
                      <div className="text-xs text-gray-400 px-1">+{remaining}개 더</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── 사이드 패널 ── */}
        {selected && (
          <div className="w-68 shrink-0 bg-white border border-gray-200 rounded-xl p-5" style={{ width: 272 }}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-bold text-gray-800 text-sm leading-snug">
                {new Date(selected + 'T00:00:00').toLocaleDateString('ko-KR', {
                  year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
                })}
              </h3>
              <button onClick={() => { setSelected(null); setShowForm(false) }}
                className="text-gray-300 hover:text-gray-500 text-xl shrink-0 ml-2">×</button>
            </div>

            <button onClick={() => setShowForm(v => !v)}
              className="w-full py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 mb-4 transition-colors font-medium">
              + 일정 추가
            </button>

            {showForm && (
              <form onSubmit={handleSubmit} className="space-y-2.5 mb-4 p-3 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-xs text-gray-600 mb-0.5">제목 *</label>
                  <input required type="text" value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="일정 제목"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-0.5">종류</label>
                  <select value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs bg-white">
                    {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>

                {/* 날짜 범위 */}
                <div className="flex gap-1.5 items-center">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-0.5">시작일</label>
                    <div className="px-2 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-500">
                      {selected}
                    </div>
                  </div>
                  <span className="text-gray-300 mt-4">→</span>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-0.5">종료일 (선택)</label>
                    <input type="date" value={form.end_date}
                      min={selected}
                      onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-0.5">시간</label>
                  <input type="time" value={form.time}
                    onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-0.5">참석자</label>
                  <input type="text" value={form.participants}
                    onChange={e => setForm(f => ({ ...f, participants: e.target.value }))}
                    placeholder="예: 민재, 광호"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-0.5">내용</label>
                  <textarea rows={2} value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs resize-none" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-0.5">작성자</label>
                  <input type="text" value={form.created_by}
                    onChange={e => setForm(f => ({ ...f, created_by: e.target.value }))}
                    placeholder="이름"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs" />
                </div>
<div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 py-1.5 text-xs border border-gray-300 rounded hover:bg-white">취소</button>
                  <button type="submit" disabled={saving}
                    className="flex-1 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">저장</button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {dayEvents.length === 0 ? (
                <p className="text-xs text-gray-300 text-center py-6">등록된 일정이 없습니다</p>
              ) : dayEvents.map(ev => {
                const c = TYPE_COLOR[ev.type] ?? TYPE_COLOR['기타']
                const isMultiDay = !!ev.end_date && ev.end_date !== ev.date
                return (
                  <div key={ev.id} className="rounded-lg p-3 border border-gray-100">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className="text-xs px-1.5 py-0.5 rounded font-medium"
                            style={{ backgroundColor: c.bg, color: c.text }}>{ev.type}</span>
                          {ev.time && <span className="text-xs text-gray-400">{ev.time}</span>}
                        </div>
                        <p className="text-sm font-semibold text-gray-800">{ev.title}</p>
                        {/* 날짜 범위 표시 */}
                        {isMultiDay && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            📅 {ev.date} ~ {ev.end_date}
                          </p>
                        )}
                        {ev.participants && (
                          <p className="text-xs text-gray-400 mt-0.5">👥 {ev.participants}</p>
                        )}
                        {ev.description && (
                          <p className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">{ev.description}</p>
                        )}
                        {ev.created_by && (
                          <p className="text-xs text-gray-300 mt-1">작성: {ev.created_by}</p>
                        )}
                      </div>
                      <button onClick={() => handleDelete(ev.id)}
                        className="text-gray-200 hover:text-red-400 text-lg leading-none ml-2 shrink-0 transition-colors">×</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* 범례 */}
      <div className="flex flex-wrap gap-4 mt-4">
        {EVENT_TYPES.map(t => {
          const c = TYPE_COLOR[t]
          return (
            <div key={t} className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.dot }} />
              {t}
            </div>
          )
        })}
      </div>
    </div>
  )
}
