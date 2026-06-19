import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CNU 식물바이러스 연구실',
  description: '전남대학교 식물바이러스 연구실 관리 시스템',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  )
}
