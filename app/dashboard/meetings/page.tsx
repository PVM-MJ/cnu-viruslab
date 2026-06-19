'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { LabMeeting } from '@/lib/types'

const empty = { date: '', presenter: '', title: '', content: '', decisions: '', next_meeting: '', created_by: '' }

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<LabMeeting[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(empty)
  const [selected, setSelected] = useState<LabMeeting | null>(null)
  const [loading, setLoading] = useState(false)

  async function fetchMeetings() {
    const { data } = await supabase.from('lab_meetings').select('*').order('date', { ascending: false })
    setMeetings(data ?? [])
  }

  useEffect(() => { fetchMeetings() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await supabase.from('lab_meetings').insert([{
      ...form,
      next_meeting: form.next_meeting || null,
    }])
    setForm(empty)
    setShowForm(false)
    setLoading(false)
    fetchMeetings()
  }

  async function handleDelete(id: string) {
    if (!confirm('삭제하시겠습니까?')) return
    await supabase.from('lab_meetings').delete().eq('id', id)
    setSelected(null)
    fetchMeetings()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">📋 랩 미팅 기록</h2>
        <button onClick={() => { setShowForm(true); setSelected(null) }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          + 새 미팅 기록
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-gray-700 mb-4">새 미팅 기록</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">날짜 *</label>
              <input type="date" required value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">발표자</label>
              <input type="text" value={form.presenter} onChange={e => setForm(f => ({ ...f, presenter: e.target.value }))} placeholder="발표자 이름" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">제목 *</label>
              <input type="text" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="미팅 주제" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">내용</label>
              <textarea rows={4} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="미팅 내용을 입력하세요" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">결정 사항</label>
              <textarea rows={2} value={form.decisions} onChange={e => setForm(f => ({ ...f, decisions: e.target.value }))} placeholder="오늘 결정된 사항" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">다음 미팅 날짜</label>
              <input type="date" value={form.next_meeting} onChange={e => setForm(f => ({ ...f, next_meeting: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">작성자</label>
              <input type="text" value={form.created_by} onChange={e => setForm(f => ({ ...f, created_by: e.target.value }))} placeholder="작성자 이름" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div className="col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">취소</button>
              <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">저장</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {meetings.length === 0 && <p className="text-gray-400 text-sm py-8 text-center">등록된 미팅 기록이 없습니다.</p>}
        {meetings.map(m => (
          <div key={m.id} onClick={() => setSelected(m === selected ? null : m)} className="bg-white border border-gray-200 rounded-xl p-5 cursor-pointer hover:border-blue-300 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs text-gray-400">{m.date}</span>
                {m.presenter && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{m.presenter}</span>}
                <h3 className="font-semibold text-gray-800 mt-1">{m.title}</h3>
              </div>
            </div>
            {selected?.id === m.id && (
              <div className="mt-4 space-y-3 text-sm text-gray-600 border-t border-gray-100 pt-4">
                {m.content && <div><span className="font-medium text-gray-700">내용</span><p className="mt-1 whitespace-pre-wrap">{m.content}</p></div>}
                {m.decisions && <div><span className="font-medium text-gray-700">결정 사항</span><p className="mt-1 whitespace-pre-wrap">{m.decisions}</p></div>}
                {m.next_meeting && <div><span className="font-medium text-gray-700">다음 미팅</span><span className="ml-2">{m.next_meeting}</span></div>}
                {m.created_by && <div className="text-xs text-gray-400">작성: {m.created_by}</div>}
                <button onClick={(e) => { e.stopPropagation(); handleDelete(m.id) }} className="text-xs text-red-500 hover:text-red-700">삭제</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
