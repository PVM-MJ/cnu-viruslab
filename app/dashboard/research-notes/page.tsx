'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface Project {
  id: string
  title: string
  description: string | null
  researcher: string
  created_at: string
  note_count?: number
}

interface ResearchNote {
  id: string
  project_id: string
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
const EMPTY_PROJECT = { title: '', description: '', researcher: LAB_MEMBERS[0] }
const EMPTY_NOTE    = { title: '', researcher: LAB_MEMBERS[0], protocol: '', results: '', notes: '' }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
}

export default function ResearchNotesPage() {
  // 프로젝트 목록
  const [projects, setProjects] = useState<Project[]>([])
  const [filterBy, setFilterBy] = useState('전체')
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [projectForm, setProjectForm] = useState(EMPTY_PROJECT)
  const [savingProject, setSavingProject] = useState(false)

  // 선택된 프로젝트 (노트 뷰)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [noteList, setNoteList] = useState<ResearchNote[]>([])
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [noteForm, setNoteForm] = useState(EMPTY_NOTE)
  const [savingNote, setSavingNote] = useState(false)

  // 노트 상세
  const [expanded, setExpanded] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState<string | null>(null)
  const [aiResults, setAiResults] = useState<Record<string, AiResult>>({})
  const [aiTab, setAiTab] = useState<Record<string, 'organized' | 'feedback' | 'english'>>({})

  // ── 프로젝트 패치 ──
  const fetchProjects = useCallback(async () => {
    const { data: proj } = await supabase
      .from('research_projects')
      .select('*')
      .order('created_at', { ascending: false })
    if (!proj) return

    const { data: notes } = await supabase
      .from('research_notes')
      .select('project_id')
    const counts: Record<string, number> = {}
    for (const n of notes ?? []) {
      counts[n.project_id] = (counts[n.project_id] ?? 0) + 1
    }
    setProjects(proj.map(p => ({ ...p, note_count: counts[p.id] ?? 0 })))
  }, [])

  const fetchNotes = useCallback(async (projectId: string) => {
    const { data } = await supabase
      .from('research_notes')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    setNoteList(data ?? [])
  }, [])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  // ── 프로젝트 저장 ──
  async function handleSaveProject(e: React.FormEvent) {
    e.preventDefault()
    setSavingProject(true)
    const { error } = await supabase.from('research_projects').insert([{
      title: projectForm.title,
      description: projectForm.description || null,
      researcher: projectForm.researcher,
    }])
    setSavingProject(false)
    if (error) { alert('저장 실패: ' + error.message); return }
    setProjectForm(EMPTY_PROJECT)
    setShowProjectForm(false)
    fetchProjects()
  }

  async function handleDeleteProject(id: string) {
    if (!confirm('프로젝트와 포함된 모든 노트가 삭제됩니다. 계속하시겠습니까?')) return
    await supabase.from('research_projects').delete().eq('id', id)
    fetchProjects()
  }

  // ── 노트 저장 ──
  async function handleSaveNote(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedProject) return
    setSavingNote(true)
    const { error } = await supabase.from('research_notes').insert([{
      project_id: selectedProject.id,
      title: noteForm.title,
      researcher: noteForm.researcher,
      protocol: noteForm.protocol || null,
      results:  noteForm.results  || null,
      notes:    noteForm.notes    || null,
    }])
    setSavingNote(false)
    if (error) { alert('저장 실패: ' + error.message); return }
    setNoteForm(EMPTY_NOTE)
    setShowNoteForm(false)
    fetchNotes(selectedProject.id)
    fetchProjects()
  }

  async function handleDeleteNote(id: string) {
    if (!confirm('삭제하시겠습니까?')) return
    await supabase.from('research_notes').delete().eq('id', id)
    setExpanded(null)
    if (selectedProject) fetchNotes(selectedProject.id)
    fetchProjects()
  }

  // ── AI ──
  async function handleAI(note: ResearchNote) {
    setAiLoading(note.id)
    try {
      const res = await fetch('/api/notes-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: note.title, protocol: note.protocol, results: note.results, notes: note.notes }),
      })
      const data = await res.json()
      if (data.error) { alert('AI 오류: ' + data.error); return }
      setAiResults(prev => ({ ...prev, [note.id]: data }))
      setAiTab(prev => ({ ...prev, [note.id]: 'organized' }))
    } catch (err) {
      alert('AI 오류: ' + (err instanceof Error ? err.message : '네트워크 오류'))
    } finally {
      setAiLoading(null)
    }
  }

  // ── 프로젝트 선택 ──
  function openProject(project: Project) {
    setSelectedProject(project)
    setExpanded(null)
    setShowNoteForm(false)
    setNoteForm(EMPTY_NOTE)
    fetchNotes(project.id)
  }

  function backToProjects() {
    setSelectedProject(null)
    setNoteList([])
    setShowNoteForm(false)
    setExpanded(null)
    fetchProjects()
  }

  const filteredProjects = filterBy === '전체'
    ? projects
    : projects.filter(p => p.researcher === filterBy)

  // ════════════════════════════════════════
  // 노트 뷰
  // ════════════════════════════════════════
  if (selectedProject) {
    return (
      <div>
        {/* 상단 네비 */}
        <button onClick={backToProjects}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-4 transition-colors">
          ← 프로젝트 목록
        </button>

        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">📁</span>
              <h2 className="text-xl font-bold text-gray-800">{selectedProject.title}</h2>
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                {selectedProject.researcher}
              </span>
            </div>
            {selectedProject.description && (
              <p className="text-sm text-gray-400 ml-8">{selectedProject.description}</p>
            )}
          </div>
          <button
            onClick={() => setShowNoteForm(v => !v)}
            className="shrink-0 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            + 실험 노트
          </button>
        </div>

        {/* 노트 작성 폼 */}
        {showNoteForm && (
          <div className="bg-white border border-blue-100 rounded-xl p-5 mb-5 shadow-sm">
            <p className="font-semibold text-gray-700 mb-4 text-sm">새 실험 노트</p>
            <form onSubmit={handleSaveNote} className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">실험명 *</label>
                  <input required type="text" value={noteForm.title}
                    onChange={e => setNoteForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="예: PVY 접종 후 ELISA 확인"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="w-28">
                  <label className="block text-xs font-medium text-gray-500 mb-1">담당자</label>
                  <select value={noteForm.researcher}
                    onChange={e => setNoteForm(f => ({ ...f, researcher: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {LAB_MEMBERS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              {[
                { key: 'protocol', label: '프로토콜', placeholder: '실험 재료, 방법, 조건 등' },
                { key: 'results',  label: '결과',     placeholder: '관찰 결과, 측정값, 이미지 설명 등' },
                { key: 'notes',    label: '기타 내용', placeholder: '고찰, 문제점, 다음 계획 등' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{field.label}</label>
                  <textarea rows={3} value={noteForm[field.key as keyof typeof noteForm]}
                    onChange={e => setNoteForm(f => ({ ...f, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => { setShowNoteForm(false); setNoteForm(EMPTY_NOTE) }}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600">취소</button>
                <button type="submit" disabled={savingNote}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">저장</button>
              </div>
            </form>
          </div>
        )}

        {/* 노트 없을 때 */}
        {noteList.length === 0 && !showNoteForm && (
          <div className="text-center py-16 text-gray-300">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-sm">아직 실험 노트가 없습니다</p>
          </div>
        )}

        {/* 노트 목록 */}
        <div className="space-y-2">
          {noteList.map((note, idx) => {
            const isOpen = expanded === note.id
            const ai = aiResults[note.id]
            const tab = aiTab[note.id] ?? 'organized'
            return (
              <div key={note.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <button className="w-full text-left px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : note.id)}>
                  <span className="text-xs font-bold text-gray-300 w-5 shrink-0">#{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{note.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{note.researcher} · {formatDate(note.created_at)}</p>
                  </div>
                  <span className={`text-gray-300 text-sm shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`}>›</span>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100 px-5 py-4 space-y-4">
                    {[
                      { label: '프로토콜', value: note.protocol },
                      { label: '결과',     value: note.results },
                      { label: '기타 내용', value: note.notes },
                    ].filter(s => s.value).map(s => (
                      <div key={s.label}>
                        <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5">{s.label}</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{s.value}</p>
                      </div>
                    ))}

                    <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                      <button onClick={() => handleAI(note)} disabled={aiLoading === note.id}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-purple-50 text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-100 disabled:opacity-50 transition-colors font-medium">
                        {aiLoading === note.id
                          ? <><span className="animate-spin inline-block">⟳</span> AI 분석 중…</>
                          : <>✨ AI 정리 · 피드백</>}
                      </button>
                      <button onClick={() => handleDeleteNote(note.id)}
                        className="text-xs px-3 py-1.5 border border-red-200 text-red-400 rounded-lg hover:bg-red-50 transition-colors">삭제</button>
                    </div>

                    {ai && (
                      <div className="rounded-xl overflow-hidden border border-purple-100">
                        <div className="flex border-b border-purple-100 bg-purple-50">
                          {([
                            { key: 'organized', label: '✦ 정리' },
                            { key: 'feedback',  label: '💡 피드백' },
                            { key: 'english',   label: '🌐 English' },
                          ] as const).map(t => (
                            <button key={t.key}
                              onClick={() => setAiTab(prev => ({ ...prev, [note.id]: t.key }))}
                              className={`px-4 py-2.5 text-xs font-semibold transition-colors ${
                                tab === t.key
                                  ? 'text-purple-700 border-b-2 border-purple-500 bg-white'
                                  : 'text-purple-400 hover:text-purple-600'
                              }`}>{t.label}</button>
                          ))}
                          <div className="flex-1" />
                          <button onClick={() => navigator.clipboard.writeText(
                            tab === 'organized' ? ai.organized : tab === 'feedback' ? ai.feedback : ai.english
                          )} className="px-3 text-xs text-purple-400 hover:text-purple-600">복사</button>
                        </div>
                        <div className="px-4 py-3 bg-white">
                          <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {tab === 'organized' ? ai.organized : tab === 'feedback' ? ai.feedback : ai.english}
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

  // ════════════════════════════════════════
  // 프로젝트 목록 뷰
  // ════════════════════════════════════════
  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🔬 연구 노트</h2>
          <p className="text-sm text-gray-400 mt-1">연구 프로젝트별로 실험 노트를 관리하세요</p>
        </div>
        <button onClick={() => setShowProjectForm(v => !v)}
          className="shrink-0 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
          + 새 프로젝트
        </button>
      </div>

      {/* 프로젝트 작성 폼 */}
      {showProjectForm && (
        <div className="bg-white border border-blue-100 rounded-xl p-5 mb-5 shadow-sm">
          <p className="font-semibold text-gray-700 mb-4 text-sm">새 연구 프로젝트</p>
          <form onSubmit={handleSaveProject} className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">프로젝트명 *</label>
                <input required type="text" value={projectForm.title}
                  onChange={e => setProjectForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="예: PVY 병저항성 기작 연구"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="w-28">
                <label className="block text-xs font-medium text-gray-500 mb-1">담당자</label>
                <select value={projectForm.researcher}
                  onChange={e => setProjectForm(f => ({ ...f, researcher: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {LAB_MEMBERS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">설명</label>
              <input type="text" value={projectForm.description}
                onChange={e => setProjectForm(f => ({ ...f, description: e.target.value }))}
                placeholder="연구 목적이나 간략한 설명"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => { setShowProjectForm(false); setProjectForm(EMPTY_PROJECT) }}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600">취소</button>
              <button type="submit" disabled={savingProject}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">생성</button>
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
            }`}>{name}</button>
        ))}
      </div>

      {/* 프로젝트 없을 때 */}
      {filteredProjects.length === 0 && (
        <div className="text-center py-20 text-gray-300">
          <div className="text-5xl mb-3">📁</div>
          <p className="text-sm">아직 연구 프로젝트가 없습니다</p>
        </div>
      )}

      {/* 프로젝트 목록 */}
      <div className="space-y-2">
        {filteredProjects.map(project => (
          <div key={project.id}
            className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center gap-4 hover:border-blue-200 transition-colors group cursor-pointer"
            onClick={() => openProject(project)}>
            <div className="text-2xl">📁</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                {project.title}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-400">{project.researcher}</span>
                {project.description && (
                  <>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-gray-400 truncate">{project.description}</span>
                  </>
                )}
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-3">
              <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                노트 {project.note_count ?? 0}개
              </span>
              <span className="text-xs text-gray-300">{formatDate(project.created_at)}</span>
              <button
                onClick={e => { e.stopPropagation(); handleDeleteProject(project.id) }}
                className="text-xs text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity px-1">
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
