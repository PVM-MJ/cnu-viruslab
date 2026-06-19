import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { title, protocol, results, notes } = await req.json()

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Vercel 환경변수에 ANTHROPIC_API_KEY가 설정되지 않았습니다' }, { status: 500 })
    }

    const combined = [
      title    && `[실험명]\n${title}`,
      protocol && `[프로토콜]\n${protocol}`,
      results  && `[결과]\n${results}`,
      notes    && `[기타 내용]\n${notes}`,
    ].filter(Boolean).join('\n\n')

    if (!combined.trim()) {
      return NextResponse.json({ error: '내용이 없습니다' }, { status: 400 })
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `아래는 식물바이러스 연구실 실험 노트입니다. 세 가지 작업을 해주세요.

1. [ORGANIZED] 프로토콜·결과·기타 내용을 과학적으로 체계적으로 다듬어줘. 핵심 내용은 빠뜨리지 말고 논리적인 흐름으로 정리해.
2. [FEEDBACK] 이 실험 노트를 검토해서 빠진 정보, 보완이 필요한 부분, 다음 실험 제안을 구체적으로 알려줘. 잘된 부분도 짧게 언급해줘.
3. [ENGLISH] 랩미팅 발표용 영문 요약을 Methods / Results / Discussion 순서로 작성해.

반드시 아래 형식으로만 응답해 (다른 말 붙이지 마):
[ORGANIZED]
(정리 내용)

[FEEDBACK]
(피드백 내용)

[ENGLISH]
(English summary)

---

${combined}`,
      }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const orgMatch  = raw.match(/\[ORGANIZED\]\n([\s\S]*?)\n\n\[FEEDBACK\]/)
    const fbMatch   = raw.match(/\[FEEDBACK\]\n([\s\S]*?)\n\n\[ENGLISH\]/)
    const enMatch   = raw.match(/\[ENGLISH\]\n([\s\S]+)/)

    return NextResponse.json({
      organized: orgMatch?.[1]?.trim() ?? '',
      feedback:  fbMatch?.[1]?.trim()  ?? '',
      english:   enMatch?.[1]?.trim()  ?? '',
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
