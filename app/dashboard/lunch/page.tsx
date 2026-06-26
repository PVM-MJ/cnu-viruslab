'use client'

import { useState } from 'react'

const CATEGORIES = [
  { label: '치킨', emoji: '🍗', query: '치킨' },
  { label: '한식', emoji: '🍱', query: '한식' },
  { label: '중식', emoji: '🥡', query: '중식' },
  { label: '피자', emoji: '🍕', query: '피자' },
  { label: '분식', emoji: '🍜', query: '분식' },
  { label: '족발/보쌈', emoji: '🥩', query: '족발 보쌈' },
  { label: '일식/돈까스', emoji: '🍣', query: '일식 돈까스' },
  { label: '버거', emoji: '🍔', query: '버거' },
  { label: '카페/디저트', emoji: '☕', query: '카페 디저트' },
  { label: '야식', emoji: '🌙', query: '야식' },
]

export default function LunchPage() {
  const [picked, setPicked] = useState<(typeof CATEGORIES)[0] | null>(null)
  const [spinning, setSpinning] = useState(false)

  function pickRandom() {
    setSpinning(true)
    setPicked(null)

    let count = 0
    const total = 20
    const interval = setInterval(() => {
      setPicked(CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)])
      count++
      if (count >= total) {
        clearInterval(interval)
        setSpinning(false)
      }
    }, 80)
  }

  function openBaemin(query: string) {
    window.open(`https://www.baemin.com/search?q=${encodeURIComponent(query)}`, '_blank')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">🍽️ 오늘 뭐 먹지?</h1>
      <p className="text-sm text-gray-500 mb-8">랜덤 뽑기 후 배달의민족으로 바로 이동</p>

      {/* 뽑기 결과 */}
      <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center mb-6 min-h-[200px] flex flex-col items-center justify-center">
        {picked ? (
          <>
            <div className={`text-7xl mb-4 ${spinning ? 'animate-bounce' : ''}`}>{picked.emoji}</div>
            <div className="text-3xl font-bold text-gray-800 mb-6">{picked.label}</div>
            {!spinning && (
              <button
                onClick={() => openBaemin(picked.query)}
                className="bg-[#2AC1BC] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#22a9a4] transition-colors text-sm"
              >
                배민에서 주문하기 →
              </button>
            )}
          </>
        ) : (
          <div className="text-gray-300 text-5xl">?</div>
        )}
      </div>

      {/* 뽑기 버튼 */}
      <button
        onClick={pickRandom}
        disabled={spinning}
        className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 disabled:opacity-60 transition-colors mb-8"
      >
        {spinning ? '뽑는 중...' : '🎲 랜덤 뽑기'}
      </button>

      {/* 직접 선택 */}
      <div>
        <p className="text-sm font-medium text-gray-500 mb-3">직접 선택</p>
        <div className="grid grid-cols-5 gap-3">
          {CATEGORIES.map(cat => (
            <button
              key={cat.label}
              onClick={() => openBaemin(cat.query)}
              className="flex flex-col items-center gap-1.5 p-3 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <span className="text-2xl">{cat.emoji}</span>
              <span className="text-xs text-gray-600 font-medium">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
