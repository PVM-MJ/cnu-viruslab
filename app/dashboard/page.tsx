'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function DashboardPage() {
  const [counts, setCounts] = useState({ meetings: 0, experiments: 0, samples: 0, reagents: 0, needsOrder: 0 })

  useEffect(() => {
    async function fetchCounts() {
      const [m, e, s, r] = await Promise.all([
        supabase.from('lab_meetings').select('id', { count: 'exact', head: true }),
        supabase.from('experiments').select('id', { count: 'exact', head: true }).eq('status', 'in_progress'),
        supabase.from('samples').select('id', { count: 'exact', head: true }).neq('stage', 'completed'),
        supabase.from('reagents').select('id', { count: 'exact', head: true }),
      ])
      const { count: needsOrder } = await supabase.from('reagents').select('id', { count: 'exact', head: true }).eq('needs_order', true)
      setCounts({
        meetings: m.count ?? 0,
        experiments: e.count ?? 0,
        samples: s.count ?? 0,
        reagents: r.count ?? 0,
        needsOrder: needsOrder ?? 0,
      })
    }
    fetchCounts()
  }, [])

  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })

  const cards = [
    { href: '/dashboard/meetings', icon: '📋', label: '랩 미팅', value: `총 ${counts.meetings}건`, color: 'bg-blue-50 border-blue-200' },
    { href: '/dashboard/experiments', icon: '🔬', label: '진행 중 실험', value: `${counts.experiments}개`, color: 'bg-green-50 border-green-200' },
    { href: '/dashboard/samples', icon: '🧪', label: '처리 중 샘플', value: `${counts.samples}개`, color: 'bg-purple-50 border-purple-200' },
    { href: '/dashboard/reagents', icon: '💊', label: '발주 필요 시약', value: `${counts.needsOrder}개`, color: counts.needsOrder > 0 ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-200' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">대시보드</h2>
        <p className="text-gray-500 mt-1">{today}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {cards.map((card) => (
          <Link key={card.href} href={card.href}>
            <div className={`border rounded-xl p-5 cursor-pointer hover:shadow-md transition-shadow ${card.color}`}>
              <div className="text-3xl mb-2">{card.icon}</div>
              <div className="text-sm text-gray-600">{card.label}</div>
              <div className="text-2xl font-bold text-gray-800 mt-1">{card.value}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-700 mb-3">빠른 이동</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { href: '/dashboard/meetings', label: '+ 랩 미팅 기록' },
            { href: '/dashboard/experiments', label: '+ 실험 추가' },
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
