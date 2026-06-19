'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface Announcement {
  id: string
  title: string
  content: string
  author: string
  pinned: boolean
  created_at: string
}

const EMPTY_FORM = { title: '', content: '', author: '' }

function parseKakaoMessage(raw: string): { author: string; content: string } | null {
  // KakaoTalk format: "[이름] [오전/오후 H:MM] 내용"
  const match = raw.match(/^\[(.+?)\]\s*\[(?:오전|오후)\s*\d+:\d+\]\s*([\s\S]+)/)
  if (!match) return null
  return { author: match[1].trim(), content: match[2].trim() }
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}

function AnnouncementCard({
  a, expanded, setExpanded, togglePin, handleDelete,
}: {
  a: Announcement
  expanded: string | null
  setExpanded: (id: string | null) => void
  togglePin: (id: string, pinned: boolean) => void
  handleDelete: (id: string) => void
}) {
  const isOpen = expanded === a.id
  return (
    <div className={`bg-white rounded-xl border transition-colors ${
      a.pinned ? 'border-amber-200 bg-amber-50/40' : 'border-gray-200'
    }`}>
      <button
        className="w-full text-left px-5 py-4 flex items-start gap-3"
        onClick={() => setExpanded(isOpen ? null : a.id)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {a.pinned && <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">📌 고정</span>}
            <span className="text-sm font-semibold text-gray-800 truncate">{a.title}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-400">{a.author}</span>
            <span className="text-xs text-gray-300">·</span>
            <span className="text-xs text-gray-400">{formatDate(a.created_at)}</span>
          </div>
          {!isOpen && (
            <p className="text-xs text-gray-400 mt-1.5 line-clamp-1 whitespace-pre-wrap">{a.content}</p>
          )}
        </div>
        <span className={`text-gray-300 text-sm mt-0.5 shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`}>›</span>
      </button>

      {isOpen && (
        <div className="px-5 pb-4 border-t border-gray-100">
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed mt-3">{a.content}</p>
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => togglePin(a.id, a.pinned)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                a.pinned
                  ? 'border-amber-300 text-amber-600 hover:bg-amber-50'
                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {a.pinned ? '📌 고정 해제' : '📌 고정하기'}
            </button>
            <button
              onClick={() => handleDelete(a.id)}
              className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-400 hover:bg-red-50 transition-colors"
            >
              삭제
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showKakao, setShowKakao] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [kakaoText, setKakaoText] = useState('')

  const [saving, setSaving] = useState(false)
  const [summarizing, setSummarizing] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  const fetchAnnouncements = useCallback(async () => {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
    setAnnouncements(data ?? [])
  }, [])

  useEffect(() => { fetchAnnouncements() }, [fetchAnnouncements])

  function openWriteForm() {
    setShowForm(v => !v)
    setShowKakao(false)
  }

  function openKakaoPanel() {
    setShowKakao(v => !v)
    setShowForm(false)
  }

  function handleKakaoImport() {
    const text = kakaoText.trim()
    if (!text) return
    const parsed = parseKakaoMessage(text)
    // 형식 일치 시 작성자 자동 채움, 아니면 내용만 가져옴
    setForm({ title: '', content: parsed ? parsed.content : text, author: parsed ? parsed.author : '' })
    setKakaoText('')
    setShowKakao(false)
    setShowForm(true)
  }

  async function handleSummarize() {
    if (!form.content.trim()) return
    setSummarizing(true)
    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: form.content }),
      })
      const data = await res.json()
      if (data.summary) setForm(f => ({ ...f, content: data.summary }))
      else alert('요약 실패: ' + (data.error ?? '알 수 없는 오류'))
    } catch {
      alert('요약 중 오류가 발생했습니다')
    } finally {
      setSummarizing(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('announcements').insert([{
      title: form.title,
      content: form.content,
      author: form.author,
      pinned: false,
    }])
    setSaving(false)
    if (error) { alert('저장 실패: ' + error.message); return }
    setForm(EMPTY_FORM)
    setShowForm(false)
    fetchAnnouncements()
  }

  async function togglePin(id: string, pinned: boolean) {
    await supabase.from('announcements').update({ pinned: !pinned }).eq('id', id)
    fetchAnnouncements()
  }

  async function handleDelete(id: string) {
    if (!confirm('삭제하시겠습니까?')) return
    await supabase.from('announcements').delete().eq('id', id)
    setExpanded(null)
    fetchAnnouncements()
  }

  const pinned = announcements.filter(a => a.pinned)
  const normal = announcements.filter(a => !a.pinned)

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">📢 공지사항</h2>
          <p className="text-sm text-gray-400 mt-1">랩실 주요 공지를 모아봅니다</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={openKakaoPanel}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
              showKakao
                ? 'bg-amber-400 text-amber-900 border-amber-400'
                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
            }`}
          >
            💬 카카오톡 가져오기
          </button>
          <button
            onClick={openWriteForm}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              showForm
                ? 'bg-blue-700 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            + 공지 작성
          </button>
        </div>
      </div>

      {/* 카카오톡 붙여넣기 패널 */}
      {showKakao && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-5">
          <p className="text-sm font-semibold text-amber-800 mb-0.5">💬 카카오톡 메시지 붙여넣기</p>
          <p className="text-xs text-amber-600 mb-3">
            단톡방에서 메시지를 <strong>길게 눌러 복사</strong>한 뒤 아래에 붙여넣으세요.<br />
            내용이 자동으로 채워지고, 작성자는 직접 입력하면 됩니다.
          </p>
          <textarea
            rows={4}
            value={kakaoText}
            onChange={e => { setKakaoText(e.target.value); setKakaoError('') }}
            placeholder="여기에 복사한 카카오톡 메시지를 붙여넣으세요"
            className="w-full px-3 py-2.5 border border-amber-300 rounded-lg text-sm bg-white resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
          />

          <div className="flex gap-2 mt-3">
            <button
              onClick={() => { setShowKakao(false); setKakaoText('') }}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600"
            >
              취소
            </button>
            <button
              onClick={handleKakaoImport}
              disabled={!kakaoText.trim()}
              className="px-4 py-2 text-sm bg-amber-400 text-amber-900 font-semibold rounded-lg hover:bg-amber-500 disabled:opacity-40 transition-colors"
            >
              내용 가져오기 →
            </button>
          </div>
        </div>
      )}

      {/* 공지 작성 폼 */}
      {showForm && (
        <div className="bg-white border border-blue-100 rounded-xl p-6 mb-5 shadow-sm">
          <p className="font-semibold text-gray-700 mb-4">새 공지사항</p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">제목 *</label>
              <input
                required type="text" value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="공지 제목을 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-500">내용 *</label>
                <button
                  type="button"
                  onClick={handleSummarize}
                  disabled={!form.content.trim() || summarizing}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 bg-purple-50 text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-100 disabled:opacity-40 transition-colors font-medium"
                >
                  {summarizing ? (
                    <><span className="animate-spin inline-block">⟳</span> 요약 중…</>
                  ) : (
                    <>✨ AI 요약</>
                  )}
                </button>
              </div>
              <textarea
                required rows={6} value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="공지 내용을 입력하거나, 카카오톡에서 가져온 뒤 AI 요약을 사용해보세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">작성자 *</label>
                <input
                  required type="text" value={form.author}
                  onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
                  placeholder="이름"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600"
                >
                  취소
                </button>
                <button
                  type="submit" disabled={saving}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  등록
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* 목록 없을 때 */}
      {announcements.length === 0 && !showForm && !showKakao && (
        <div className="text-center py-24 text-gray-300">
          <div className="text-5xl mb-3">📋</div>
          <p className="text-sm">등록된 공지사항이 없습니다</p>
        </div>
      )}

      {/* 고정 공지 */}
      {pinned.length > 0 && (
        <section className="mb-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">고정</p>
          <div className="space-y-2">
            {pinned.map(a => (
              <AnnouncementCard key={a.id} a={a} expanded={expanded} setExpanded={setExpanded} togglePin={togglePin} handleDelete={handleDelete} />
            ))}
          </div>
        </section>
      )}

      {/* 일반 공지 */}
      {normal.length > 0 && (
        <section>
          {pinned.length > 0 && (
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">전체</p>
          )}
          <div className="space-y-2">
            {normal.map(a => (
              <AnnouncementCard key={a.id} a={a} expanded={expanded} setExpanded={setExpanded} togglePin={togglePin} handleDelete={handleDelete} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
