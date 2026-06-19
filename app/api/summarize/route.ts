import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { content } = await req.json()
    if (!content?.trim()) {
      return NextResponse.json({ error: '내용이 없습니다' }, { status: 400 })
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Vercel 환경변수에 ANTHROPIC_API_KEY가 설정되지 않았습니다' }, { status: 500 })
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `아래는 연구실 단톡방 메시지입니다. 랩 구성원들이 바로 이해할 수 있도록 핵심 내용만 간결하게 공지문 형태로 정리해줘. 날짜/시간/장소 등 중요한 정보는 빠뜨리지 말고, 3~5문장 이내로 작성해. 요약문만 출력하고 다른 설명은 붙이지 마.\n\n${content}`,
      }],
    })

    const summary = message.content[0].type === 'text' ? message.content[0].text : ''
    return NextResponse.json({ summary })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
