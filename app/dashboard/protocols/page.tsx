'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Protocol, ProtocolCategory } from '@/lib/types'

type Tab = 'wet' | 'dry'

const EMPTY_FORM = { title: '', subtitle: '', content: '', created_by: '' }

const LAB_MEMBERS = ['광호', '예연', '지민', '민재', '주호']

export default function ProtocolsPage() {
  const [tab, setTab]             = useState<Tab>('wet')
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)

  const [expanded, setExpanded]   = useState<string | null>(null)
  const [editing, setEditing]     = useState<Protocol | null>(null)
  const [editForm, setEditForm]   = useState(EMPTY_FORM)

  async function fetchProtocols() {
    setLoading(true)
    const { data } = await supabase
      .from('protocols')
      .select('*')
      .order('created_at', { ascending: false })
    setProtocols(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchProtocols() }, [])

  const listed = protocols.filter(p => p.category === tab)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('protocols').insert([{
      title:      form.title,
      category:   tab as ProtocolCategory,
      subtitle:   form.subtitle || null,
      content:    form.content,
      created_by: form.created_by || null,
    }])
    setForm(EMPTY_FORM)
    setShowForm(false)
    setSaving(false)
    fetchProtocols()
  }

  async function handleDelete(id: string) {
    if (!confirm('삭제하시겠습니까?')) return
    await supabase.from('protocols').delete().eq('id', id)
    setExpanded(null)
    fetchProtocols()
  }

  function startEdit(p: Protocol) {
    setEditing(p)
    setEditForm({
      title:      p.title,
      subtitle:   p.subtitle ?? '',
      content:    p.content,
      created_by: p.created_by ?? '',
    })
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editing) return
    setSaving(true)
    await supabase.from('protocols').update({
      title:      editForm.title,
      subtitle:   editForm.subtitle || null,
      content:    editForm.content,
      created_by: editForm.created_by || null,
      updated_at: new Date().toISOString(),
    }).eq('id', editing.id)
    setEditing(null)
    setSaving(false)
    fetchProtocols()
  }

  const accentWet = 'bg-teal-600'
  const accentDry = 'bg-indigo-600'
  const accent    = tab === 'wet' ? accentWet : accentDry
  const accentLight = tab === 'wet' ? 'bg-teal-50 border-teal-200' : 'bg-indigo-50 border-indigo-200'
  const ring      = tab === 'wet' ? 'focus:ring-teal-400' : 'focus:ring-indigo-400'

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">📋 공용 프로토콜</h2>

      {/* 탭 */}
      <div className="flex gap-2 mb-6">
        {([
          { key: 'wet', label: 'Wet Lab', icon: '🧫', color: 'teal' },
          { key: 'dry', label: 'Dry Lab', icon: '💻', color: 'indigo' },
        ] as const).map(t => {
          const count = protocols.filter(p => p.category === t.key).length
          return (
            <button key={t.key} onClick={() => { setTab(t.key); setShowForm(false); setExpanded(null); setEditing(null) }}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl border transition-colors ${
                tab === t.key
                  ? t.color === 'teal'
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}>
              <span>{t.icon}</span>
              {t.label}
              {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  tab === t.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                }`}>{count}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* 추가 버튼 */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => { setShowForm(v => !v); setExpanded(null); setEditing(null) }}
          className={`px-4 py-2 text-white rounded-lg text-sm font-medium ${accent} hover:opacity-90`}>
          + 프로토콜 추가
        </button>
      </div>

      {/* 추가 폼 */}
      {showForm && (
        <div className={`border rounded-xl p-6 mb-6 shadow-sm ${accentLight}`}>
          <h3 className="font-semibold text-gray-700 mb-4">
            {tab === 'wet' ? '🧫 Wet Lab' : '💻 Dry Lab'} 프로토콜 추가
          </h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">프로토콜 이름 *</label>
                <input type="text" required value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="예: RNA 추출 (TRIzol법)"
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 ${ring}`} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">한 줄 설명</label>
                <input type="text" value={form.subtitle}
                  onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                  placeholder="어떤 실험인지 간단히"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">작성자</label>
                <select value={form.created_by}
                  onChange={e => setForm(f => ({ ...f, created_by: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                  <option value="">선택</option>
                  {LAB_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">프로토콜 내용 *</label>
              <textarea
                required
                rows={10}
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder={`단계별 절차를 입력하세요.\n\n예)\n1. 샘플 100mg을 1.5mL 튜브에 넣는다.\n2. TRIzol 1mL를 첨가하고 잘 혼합한다.\n3. ...`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none font-mono"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">취소</button>
              <button type="submit" disabled={saving}
                className={`px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50 ${accent} hover:opacity-90`}>저장</button>
            </div>
          </form>
        </div>
      )}

      {/* 편집 모달 */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">프로토콜 수정</h3>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="overflow-y-auto flex-1 p-6">
              <form id="edit-form" onSubmit={handleEditSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">프로토콜 이름 *</label>
                    <input type="text" required value={editForm.title}
                      onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">한 줄 설명</label>
                    <input type="text" value={editForm.subtitle}
                      onChange={e => setEditForm(f => ({ ...f, subtitle: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">작성자</label>
                    <select value={editForm.created_by}
                      onChange={e => setEditForm(f => ({ ...f, created_by: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                      <option value="">선택</option>
                      {LAB_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">프로토콜 내용 *</label>
                  <textarea required rows={14} value={editForm.content}
                    onChange={e => setEditForm(f => ({ ...f, content: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none font-mono" />
                </div>
              </form>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-2 justify-end">
              <button onClick={() => setEditing(null)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">취소</button>
              <button type="submit" form="edit-form" disabled={saving}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">저장</button>
            </div>
          </div>
        </div>
      )}

      {/* 목록 */}
      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">불러오는 중...</div>
      ) : listed.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">{tab === 'wet' ? '🧫' : '💻'}</div>
          <p className="text-sm">등록된 프로토콜이 없습니다.</p>
          <p className="text-xs mt-1">+ 프로토콜 추가 버튼으로 첫 번째를 등록해보세요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {listed.map(p => (
            <div key={p.id}
              className={`bg-white border rounded-xl transition-colors ${
                expanded === p.id ? 'border-gray-300 shadow-sm' : 'border-gray-200 hover:border-gray-300'
              }`}>
              {/* 헤더 */}
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer"
                onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800">{p.title}</h3>
                  <div className="flex items-center gap-3 mt-0.5">
                    {p.subtitle && <p className="text-xs text-gray-400 truncate">{p.subtitle}</p>}
                    {p.created_by && (
                      <span className="text-xs text-gray-400 shrink-0">작성: {p.created_by}</span>
                    )}
                  </div>
                </div>
                <span className="text-gray-300 text-sm ml-4 shrink-0">
                  {expanded === p.id ? '▲' : '▼'}
                </span>
              </div>

              {/* 펼침 내용 */}
              {expanded === p.id && (
                <div className="border-t border-gray-100 px-5 py-4">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                    {p.content}
                  </pre>
                  <div className="flex gap-3 mt-4 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => startEdit(p)}
                      className="text-xs text-blue-500 hover:text-blue-700">수정</button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-xs text-red-400 hover:text-red-600">삭제</button>
                    <span className="text-xs text-gray-300 ml-auto">
                      {new Date(p.updated_at ?? p.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
