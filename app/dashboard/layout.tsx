'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

const STORAGE_CHILDREN = [
  { href: '/dashboard/floorplan', label: '실험실 도면', icon: '🗺️' },
  { href: '/dashboard/samples', label: '샘플 현황', icon: '🧪' },
  { href: '/dashboard/reagents', label: '시약 재고', icon: '💊' },
]

const topNavItems = [
  { href: '/dashboard', label: '홈', icon: '🏠' },
  { href: '/dashboard/meetings', label: '실험실 일정', icon: '📅' },
  { href: '/dashboard/experiments', label: '연구 일지', icon: '📓' },
]

const bottomNavItems = [
  { href: '/dashboard/plantroom', label: '식물방 도면', icon: '🌱' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const isStoragePage = STORAGE_CHILDREN.some(c => pathname.startsWith(c.href))
  const [storageOpen, setStorageOpen] = useState(isStoragePage)

  useEffect(() => {
    if (isStoragePage) setStorageOpen(true)
  }, [isStoragePage])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  function NavLink({ href, label, icon, exact = false }: { href: string; label: string; icon: string; exact?: boolean }) {
    const isActive = exact ? pathname === href : pathname.startsWith(href)
    return (
      <Link href={href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
      }`}>
        <span>{icon}</span>{label}
      </Link>
    )
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-5 border-b border-gray-200">
          <div className="text-2xl mb-1">🌿</div>
          <h1 className="text-sm font-bold text-gray-800 leading-tight">CNU 식물바이러스<br />연구실</h1>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {topNavItems.map(item => (
            <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} exact={item.href === '/dashboard'} />
          ))}

          {/* 보관현황 그룹 */}
          <div>
            <button
              onClick={() => setStorageOpen(v => !v)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isStoragePage ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-3"><span>📦</span>보관현황</span>
              <span className={`text-xs transition-transform ${storageOpen ? 'rotate-90' : ''}`}>›</span>
            </button>

            {storageOpen && (
              <div className="mt-1 ml-3 pl-3 border-l border-gray-200 space-y-1">
                {STORAGE_CHILDREN.map(item => (
                  <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} />
                ))}
              </div>
            )}
          </div>

          {bottomNavItems.map(item => (
            <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} />
          ))}
        </nav>

        <div className="p-3 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            🚪 로그아웃
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  )
}
