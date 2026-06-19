'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface ResearchNote {
  id: string
  title: string
  researcher: string
  protocol: string | null
  results: string | null
  notes: string | null
  created_at: string
}

interface AiResult {
  organized: string
  feedback: string
  english: string
}

const LAB_MEMBERS = ['광호', '예연', '지민', '민재', '주호']
const today = new Date().toISOString().split('T')[0]
const EMPTY_FORM = { title: '', researcher: LAB_MEMBERS[0], protocol: '', results: '', notes: '' }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function ResearchNotesPage() {
  const [notes, setNotes] = useState<ResearchNote[]>([])
  const [filterBy, setFilterBy] = useState<string>('전체')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState<string | null>(null)
  const [aiResults, setAiResults] = useState<Record<string, AiResult>>({})
  const [activeAiTab, setActiveAiTab] = useState<Record<string, 'organized' | 'feedback' | 'english'>>({})

  const fetchNotes = useCallback(async () => {
    const { data } = await supabase
      .from('research_notes')
      .select('*')
      .order('created_at', { ascending: false })
    setNotes(data ?? [])
  }, [])

  useEffect(() => { fetchNotes() }, [fetchNotes])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('research_notes').insert([{
      title: form.title,
      researcher: form.researcher,
      protocol: form.protocol || null,
      results: form.results || null,
      notes: form.notes || null,
    }])
    setSaving(false)
    if (error) { alert('저장 실패: ' + error.message); return }
    setForm(EMPTY_FORM)
    setShowForm(false)
    fetchNotes()
  }

  async function handleDelete(id: string) {
    if (!confirm('삭제하시겠습니까?')) return
    await supabase.from('research_notes').delete().eq('id', id)
    setExpanded(null)
    fetchNotes()
  }

  async function handleAI(note: ResearchNote) {
    setAiLoading(note.id)
    try {
      const res = await fetch('/api/notes-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: note.title,
          protocol: note.protocol,
          results: note.results,
          notes: note.notes,
        }),
      })
      const data = await res.json()
      if (data.error) { alert('AI 오류: ' + data.error); return }
      setAiResults(prev => ({ ...prev, [note.id]: data }))
      setActiveAiTab(prev => ({ ...prev, [note.id]: 'organized' }))
    } catch (err) {
      alert('AI 오류: ' + (err instanceof Error ? err.message : '네트워크 오류'))
    } finally {
      setAiLoading(null)
    }
  }

  const filtered = filterBy === '전체' ? notes : notes.filter(n => n.researcher === filterBy)

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🔬 연구 노트</h2>
          <p className="text-sm text-gray-400 mt-1">실험별 프로토콜·결과를 기록하고 AI 피드백을 받아보세요</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className={`shrink-0 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            showForm ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          + 새 노트
        </button>
      </div>

      {/* 작성 폼 */}
      {showForm && (
        <div className="bg-white border border-blue-100 rounded-xl p-6 mb-6 shadow-sm">
          <p className="font-semibold text-gray-700 mb-4">새 실험 노트</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">실험명 *</label>
                <input
                  required type="text" value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="예: PVY 접종 후 ELISA 확인"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="w-32">
                <label className="block text-xs font-medium text-gray-500 mb-1">담당자 *</label>
                <select
                  value={form.researcher}
                  onChange={e => setForm(f => ({ ...f, researcher: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {LAB_MEMBERS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">프로토콜</label>
              <textarea
                rows={4} value={form.protocol}
                onChange={e => setForm(f => ({ ...f, protocol: e.target.value }))}
                placeholder="실험 재료, 방법, 조건 등"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">결과</label>
              <textarea
                rows={4} value={form.results}
                onChange={e => setForm(f => ({ ...f, results: e.target.value }))}
                placeholder="관찰 결과, 측정값, 이미지 설명 등"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">기타 내용</label>
              <textarea
                rows={3} value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="고찰, 문제점, 다음 계획, 참고사항 등"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600">
                취소
              </button>
              <button type="submit" disabled={saving}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
                저장
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 담당자 필터 */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {['전체', ...LAB_MEMBERS].map(name => (
          <button key={name} onClick={() => setFilterBy(name)}
            className={`px-3 py-1.5 text-sm rounded-lg border font-medium transition-colors ${
              filterBy === name
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
            }`}>
            {name}
          </button>
        ))}
      </div>

      {/* 노트 없을 때 */}
      {filtered.length === 0 && (
        <div className="text-center py-20 text-gray-300">
          <div className="text-5xl mb-3">🔬</div>
          <p className="text-sm">아직 실험 노트가 없습니다</p>
        </div>
      )}

      {/* 노트 목록 */}
      <div className="space-y-3">
        {filtered.map(note => {
          const isOpen = expanded === note.id
          const ai = aiResults[note.id]
          const aiTab = activeAiTab[note.id] ?? 'organized'

          return (
            <div key={note.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              {/* 카드 헤더 */}
              <button
                className="w-full text-left px-5 py-4 flex items-start gap-3 hover:bg-gray-50 transition-colors"
                onClick={() => setExpanded(isOpen ? null : note.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-800">{note.title}</span>
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                      {note.researcher}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(note.created_at)}</p>
                  {!isOpen && note.protocol && (
                    <p className="text-xs text-gray-400 mt-1.5 line-clamp-1">{note.protocol}</p>
                  )}
                </div>
                <span className={`text-gray-300 text-sm mt-0.5 shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`}>›</span>
              </button>

              {/* 확장 내용 */}
              {isOpen && (
                <div className="border-t border-gray-100 px-5 py-4 space-y-4">
                  {note.protocol && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5">프로토콜</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{note.protocol}</p>
                    </div>
                  )}
                  {note.results && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5">결과</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{note.results}</p>
                    </div>
                  )}
                  {note.notes && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5">기타 내용</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{note.notes}</p>
                    </div>
                  )}

                  {/* 액션 버튼 */}
                  <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                    <button
                      onClick={() => handleAI(note)}
                      disabled={aiLoading === note.id}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-purple-50 text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-100 disabled:opacity-50 transition-colors font-medium"
                    >
                      {aiLoading === note.id
                        ? <><span className="animate-spin inline-block">⟳</span> AI 분석 중…</>
                        : <>✨ AI 정리 · 피드백</>}
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="text-xs px-3 py-1.5 border border-red-200 text-red-400 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      삭제
                    </button>
                  </div>

                  {/* AI 결과 */}
                  {ai && (
                    <div className="rounded-xl overflow-hidden border border-purple-100">
                      {/* 탭 */}
                      <div className="flex border-b border-purple-100 bg-purple-50">
                        {([
                          { key: 'organized', label: '✦ 정리' },
                          { key: 'feedback',  label: '💡 피드백' },
                          { key: 'english',   label: '🌐 English' },
                        ] as const).map(tab => (
                          <button
                            key={tab.key}
                            onClick={() => setActiveAiTab(prev => ({ ...prev, [note.id]: tab.key }))}
                            className={`px-4 py-2.5 text-xs font-semibold transition-colors ${
                              aiTab === tab.key
                                ? 'text-purple-700 border-b-2 border-purple-500 bg-white'
                                : 'text-purple-400 hover:text-purple-600'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                        <div className="flex-1" />
                        <button
                          onClick={() => {
                            const text = aiTab === 'organized' ? ai.organized : aiTab === 'feedback' ? ai.feedback : ai.english
                            navigator.clipboard.writeText(text)
                          }}
                          className="px-3 text-xs text-purple-400 hover:text-purple-600"
                        >
                          복사
                        </button>
                      </div>
                      {/* 탭 내용 */}
                      <div className="px-4 py-3 bg-white">
                        <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {aiTab === 'organized' ? ai.organized : aiTab === 'feedback' ? ai.feedback : ai.english}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
