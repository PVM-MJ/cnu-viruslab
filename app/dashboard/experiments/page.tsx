'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface ResearchLog {
  id: string
  researcher: string
  date: string
  projects: string | null
  content: string
  results: string | null
  next_plan: string | null
  created_at: string
}

const LAB_MEMBERS = ['광호', '예연', '지민', '민재', '주호']
const today = new Date().toISOString().split('T')[0]
const EMPTY_FORM = { date: today, projects: '', content: '', results: '', next_plan: '' }

export default function ResearchLogPage() {
  const [myName, setMyName] = useState<string | null>(null)
  const [nameInput, setNameInput] = useState('')
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [logs, setLogs] = useState<ResearchLog[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState<string | null>(null)
  const [aiResult, setAiResult] = useState<{ id: string; korean: string; english: string } | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('lab-my-name')
    if (saved) { setMyName(saved); setActiveTab(saved) }
  }, [])

  const fetchLogs = useCallback(async (researcher: string) => {
    const { data } = await supabase
      .from('research_logs')
      .select('*')
      .eq('researcher', researcher)
      .order('date', { ascending: false })
    setLogs(data ?? [])
  }, [])

  useEffect(() => {
    if (activeTab) fetchLogs(activeTab)
  }, [activeTab, fetchLogs])

  function saveName() {
    const name = nameInput.trim()
    if (!name) return
    localStorage.setItem('lab-my-name', name)
    setMyName(name)
    setActiveTab(name)
  }

  function switchTab(name: string) {
    setActiveTab(name)
    setShowForm(false)
    setSelected(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!activeTab) return
    setSaving(true)
    const { error } = await supabase.from('research_logs').insert([{
      researcher: activeTab,
      date: form.date,
      projects: form.projects || null,
      content: form.content,
      results: form.results || null,
      next_plan: form.next_plan || null,
    }])
    setSaving(false)
    if (error) { alert('저장 실패: ' + error.message); return }
    setForm({ ...EMPTY_FORM, date: today })
    setShowForm(false)
    fetchLogs(activeTab)
  }

  async function handleAI(log: ResearchLog) {
    setAiLoading(log.id)
    setAiResult(null)
    try {
      const res = await fetch('/api/research-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: log.content, results: log.results, next_plan: log.next_plan }),
      })
      const data = await res.json()
      if (data.korean || data.english) setAiResult({ id: log.id, ...data })
      else alert('AI 오류: ' + (data.error ?? '알 수 없는 오류'))
    } catch (err) {
      alert('AI 오류: ' + (err instanceof Error ? err.message : '네트워크 오류'))
    } finally {
      setAiLoading(null)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('삭제하시겠습니까?')) return
    await supabase.from('research_logs').delete().eq('id', id)
    setSelected(null)
    if (activeTab) fetchLogs(activeTab)
  }

  // 이름 선택 화면
  if (!myName) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 w-80 shadow-sm">
          <div className="text-3xl mb-3">👋</div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">안녕하세요!</h3>
          <p className="text-sm text-gray-500 mb-5">이름을 선택하거나 입력하세요</p>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {LAB_MEMBERS.map(name => (
              <button key={name} onClick={() => setNameInput(name)}
                className={`py-2 text-sm rounded-lg border font-medium transition-colors ${
                  nameInput === name
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-200 text-gray-600 hover:border-blue-300'
                }`}>
                {name}
              </button>
            ))}
          </div>

          <input type="text" value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && saveName()}
            placeholder="직접 입력..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />

          <button onClick={saveName} disabled={!nameInput.trim()}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors">
            시작하기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">📓 연구 일지</h2>
          <p className="text-sm text-gray-400 mt-1">일별 연구 기록</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            접속자: <span className="font-semibold text-gray-800">{myName}</span>
          </span>
          <button
            onClick={() => { localStorage.removeItem('lab-my-name'); setMyName(null); setNameInput('') }}
            className="text-xs text-gray-400 hover:text-gray-600 underline">
            변경
          </button>
        </div>
      </div>

      {/* 인원 탭 */}
      <div className="flex gap-1.5 mb-6 flex-wrap">
        {LAB_MEMBERS.map(name => (
          <button key={name} onClick={() => switchTab(name)}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors border ${
              activeTab === name
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
            }`}>
            {name}
            {name === myName && (
              <span className="ml-1.5 text-xs opacity-70">나</span>
            )}
          </button>
        ))}
      </div>

      {/* 기록 추가 버튼 — 자기 탭에서만 */}
      {activeTab === myName && (
        <button onClick={() => { setShowForm(v => !v); setSelected(null) }}
          className="mb-5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          + 기록 추가
        </button>
      )}

      {/* 기록 작성 폼 */}
      {showForm && (
        <div className="bg-white border border-blue-100 rounded-xl p-6 mb-6 shadow-sm">
          <h3 className="font-semibold text-gray-700 mb-4">
            새 연구 기록 <span className="text-blue-600">— {activeTab}</span>
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">날짜 *</label>
              <input type="date" required value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">관련 프로젝트</label>
              <input type="text" value={form.projects}
                onChange={e => setForm(f => ({ ...f, projects: e.target.value }))}
                placeholder="예: Curdlan, TSWV, dsRNA review paper (쉼표로 구분)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p className="text-xs text-gray-400 mt-0.5">위클리 리포트 Projects 열에 표시됩니다</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">오늘 한 일 *</label>
              <textarea required rows={4} value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="오늘 수행한 실험 및 연구 내용을 적어주세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">결과 / 관찰</label>
              <textarea rows={3} value={form.results}
                onChange={e => setForm(f => ({ ...f, results: e.target.value }))}
                placeholder="실험 결과나 관찰 내용"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">다음 계획</label>
              <textarea rows={2} value={form.next_plan}
                onChange={e => setForm(f => ({ ...f, next_plan: e.target.value }))}
                placeholder="다음에 할 일"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                취소
              </button>
              <button type="submit" disabled={saving}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                저장
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 기록 목록 */}
      <div className="space-y-3">
        {logs.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-3">📝</div>
            <p className="text-sm">아직 기록이 없습니다.</p>
            {activeTab === myName && (
              <p className="text-xs mt-1">위 버튼을 눌러 첫 기록을 남겨보세요.</p>
            )}
          </div>
        )}

        {logs.map(log => (
          <div key={log.id}
            onClick={() => setSelected(selected === log.id ? null : log.id)}
            className="bg-white border border-gray-200 rounded-xl p-5 cursor-pointer hover:border-blue-200 transition-colors">

            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-700">{log.date}</span>
              <span className="text-xs text-gray-400">
                {new Date(log.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 작성
              </span>
            </div>

            <p className="text-sm text-gray-600 mt-2 leading-relaxed line-clamp-2">{log.content}</p>

            {selected === log.id && (
              <div className="mt-4 space-y-4 border-t border-gray-100 pt-4 text-sm">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5">오늘 한 일</p>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{log.content}</p>
                </div>
                {log.results && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5">결과 / 관찰</p>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{log.results}</p>
                  </div>
                )}
                {log.next_plan && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5">다음 계획</p>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{log.next_plan}</p>
                  </div>
                )}
                {/* AI 정리 버튼 */}
                <div className="pt-2 border-t border-gray-100">
                  <button
                    onClick={e => { e.stopPropagation(); handleAI(log) }}
                    disabled={aiLoading === log.id}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-purple-50 text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-100 disabled:opacity-50 transition-colors font-medium"
                  >
                    {aiLoading === log.id
                      ? <><span className="animate-spin inline-block">⟳</span> AI 정리 중…</>
                      : <>✨ AI 정리 · 영문 요약</>}
                  </button>
                </div>

                {/* AI 결과 패널 */}
                {aiResult?.id === log.id && (
                  <div onClick={e => e.stopPropagation()} className="mt-3 rounded-xl overflow-hidden border border-purple-100">
                    {/* 한국어 정리 */}
                    <div className="bg-purple-50 px-4 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-purple-700">✦ 정리된 내용 (KO)</p>
                        <button
                          onClick={() => navigator.clipboard.writeText(aiResult.korean)}
                          className="text-xs text-purple-400 hover:text-purple-600"
                        >복사</button>
                      </div>
                      <p className="text-xs text-purple-900 whitespace-pre-wrap leading-relaxed">{aiResult.korean}</p>
                    </div>
                    {/* 영문 요약 */}
                    <div className="bg-indigo-50 px-4 py-3 border-t border-purple-100">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-indigo-700">✦ English Summary</p>
                        <button
                          onClick={() => navigator.clipboard.writeText(aiResult.english)}
                          className="text-xs text-indigo-400 hover:text-indigo-600"
                        >Copy</button>
                      </div>
                      <p className="text-xs text-indigo-900 whitespace-pre-wrap leading-relaxed">{aiResult.english}</p>
                    </div>
                  </div>
                )}

                {activeTab === myName && (
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(log.id) }}
                    className="text-xs text-red-400 hover:text-red-600">
                    삭제
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
