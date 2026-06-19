'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const LAB_MEMBERS = ['광호', '예연', '지민', '민재', '주호']

export default function DashboardPage() {
  const [counts, setCounts] = useState({ meetings: 0, logs: 0, samples: 0, reagents: 0, needsOrder: 0 })
  const [todayLoggers, setTodayLoggers] = useState<string[]>([])

  useEffect(() => {
    async function fetchCounts() {
      const todayStr = new Date().toISOString().split('T')[0]
      const [m, l, s, r, todayLogs] = await Promise.all([
        supabase.from('lab_events').select('id', { count: 'exact', head: true })
          .gte('date', `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-01`),
        supabase.from('research_logs').select('id', { count: 'exact', head: true }).eq('date', todayStr),
        supabase.from('samples').select('id', { count: 'exact', head: true }),
        supabase.from('reagents').select('id', { count: 'exact', head: true }),
        supabase.from('research_logs').select('researcher').eq('date', todayStr),
      ])
      const { count: needsOrder } = await supabase.from('reagents').select('id', { count: 'exact', head: true }).eq('needs_order', true)
      setCounts({ meetings: m.count ?? 0, logs: l.count ?? 0, samples: s.count ?? 0, reagents: r.count ?? 0, needsOrder: needsOrder ?? 0 })
      const names = Array.from(new Set((todayLogs.data ?? []).map((r: { researcher: string }) => r.researcher)))
      setTodayLoggers(names)
    }
    fetchCounts()
  }, [])

  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })

  const notWritten = LAB_MEMBERS.filter(name => !todayLoggers.includes(name))
  const allWritten = notWritten.length === 0

  const cards = [
    { href: '/dashboard/meetings', icon: '📅', label: '이번 달 일정', value: `${counts.meetings}건`, color: 'bg-blue-50 border-blue-200' },
    { href: '/dashboard/experiments', icon: '📓', label: '오늘 연구 일지', value: `${counts.logs}건 작성`, color: 'bg-indigo-50 border-indigo-200', sub: todayLoggers.length > 0 ? todayLoggers.join(', ') : '아직 없음' },
    { href: '/dashboard/samples', icon: '🧪', label: '등록 샘플', value: `${counts.samples}개`, color: 'bg-purple-50 border-purple-200' },
    { href: '/dashboard/reagents', icon: '💊', label: '발주 필요 시약', value: `${counts.needsOrder}개`, color: counts.needsOrder > 0 ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-200' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">대시보드</h2>
        <p className="text-gray-500 mt-1">{today}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {cards.map((card) => (
          <Link key={card.href} href={card.href}>
            <div className={`border rounded-xl p-5 cursor-pointer hover:shadow-md transition-shadow ${card.color}`}>
              <div className="text-3xl mb-2">{card.icon}</div>
              <div className="text-sm text-gray-600">{card.label}</div>
              <div className="text-2xl font-bold text-gray-800 mt-1">{card.value}</div>
              {'sub' in card && card.sub && (
                <div className="text-xs text-gray-400 mt-1 truncate">{card.sub}</div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* 연구 일지 현황 */}
      <Link href="/dashboard/experiments">
        <div className={`rounded-xl border p-5 mb-6 transition-shadow hover:shadow-md cursor-pointer ${allWritten ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-700">오늘 연구 일지 현황</h3>
            {allWritten
              ? <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">전원 완료 ✓</span>
              : <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">미작성 {notWritten.length}명</span>
            }
          </div>
          <div className="flex flex-wrap gap-2">
            {LAB_MEMBERS.map(name => {
              const done = todayLoggers.includes(name)
              return (
                <div key={name} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${
                  done ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${done ? 'bg-green-500' : 'bg-red-500'}`} />
                  {name}
                </div>
              )
            })}
          </div>
        </div>
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-700 mb-3">빠른 이동</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { href: '/dashboard/meetings', label: '+ 일정 등록' },
            { href: '/dashboard/experiments', label: '+ 연구 일지 작성' },
            { href: '/dashboard/samples', label: '+ 샘플 등록' },
            { href: '/dashboard/reagents', label: '+ 시약 등록' },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <span className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
