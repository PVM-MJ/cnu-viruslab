import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { content, results, next_plan } = await req.json()

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Vercel 환경변수에 ANTHROPIC_API_KEY가 설정되지 않았습니다' }, { status: 500 })
    }

    const combined = [
      content && `[오늘 한 일]\n${content}`,
      results && `[결과 / 관찰]\n${results}`,
      next_plan && `[다음 계획]\n${next_plan}`,
    ].filter(Boolean).join('\n\n')

    if (!combined.trim()) {
      return NextResponse.json({ error: '내용이 없습니다' }, { status: 400 })
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `아래는 식물바이러스 연구실 실험 일지입니다. 두 가지 작업을 해주세요.

1. 한국어로 체계적으로 정리: 실험 목적, 방법, 결과, 고찰 흐름으로 다듬어줘. 핵심 내용은 빠뜨리지 말고, 명확하게 정리해.
2. 영문 요약: 랩미팅 발표에 바로 쓸 수 있는 수준의 영어 과학 글쓰기로 요약해. Methods, Results, Next Steps 순서로 작성해.

반드시 아래 형식으로만 응답해 (다른 말 붙이지 마):
[KO]
(한국어 정리 내용)

[EN]
(English summary)

---

${combined}`,
      }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const koMatch = raw.match(/\[KO\]\n([\s\S]*?)\n\n\[EN\]/)
    const enMatch = raw.match(/\[EN\]\n([\s\S]+)/)

    return NextResponse.json({
      korean: koMatch?.[1]?.trim() ?? '',
      english: enMatch?.[1]?.trim() ?? '',
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
