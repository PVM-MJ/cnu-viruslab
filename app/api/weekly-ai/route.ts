import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

interface DayInput {
  day: string
  content: string
}

export async function POST(req: NextRequest) {
  try {
    const { days } = await req.json() as { days: DayInput[] }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY가 설정되지 않았습니다' }, { status: 500 })
    }

    const nonEmpty = days.filter(d => d.content?.trim())
    if (nonEmpty.length === 0) {
      return NextResponse.json({ summaries: {} })
    }

    const prompt = `You are a research assistant for a plant virology lab in Korea.
The following are daily research log entries written in Korean.
Summarize each day's activities into concise English bullet points for a weekly report.

Rules:
- Each bullet: one short sentence, past tense, starting with "I"
- Be specific about experiments and methods (use proper scientific terminology)
- 1–3 bullets per day (combine minor tasks into one bullet if needed)
- Output ONLY the formatted result below, no extra text or explanation

Format (include only days that have content):
[Monday]
I performed X.
I analyzed Y.

[Tuesday]
I conducted Z.

Logs:
${nonEmpty.map(d => `[${d.day}]\n${d.content}`).join('\n\n')}`

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''

    const summaries: Record<string, string[]> = {}
    let currentDay: string | null = null
    for (const line of raw.split('\n')) {
      const dayMatch = line.match(/^\[(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\]/)
      if (dayMatch) {
        currentDay = dayMatch[1]
        summaries[currentDay] = []
      } else if (currentDay && line.trim()) {
        summaries[currentDay].push(line.trim())
      }
    }

    return NextResponse.json({ summaries })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
