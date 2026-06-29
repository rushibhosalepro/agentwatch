import { NextRequest } from 'next/server'
import { createSession, getSession, sessions } from '@/lib/sessions'

// Track the most recent session across all requests
declare global {
  var __latestSessionId: string | undefined
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    systemPrompt: string
    model: string
    tools: string[]
    apiKey?: string
  }

  const session = createSession(
    body.systemPrompt,
    body.model,
    body.tools ?? [],
    body.apiKey ?? '',
  )

  global.__latestSessionId = session.sessionId

  return Response.json({ sessionId: session.sessionId })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('sessionId') ?? global.__latestSessionId

  if (!sessionId) {
    return Response.json({ sessions: [] })
  }

  const session = getSession(sessionId)
  if (!session) {
    // Return all active sessions for debug
    const all = [...sessions.values()].map(s => ({
      sessionId: s.sessionId,
      model: s.model,
      messageCount: s.transcript.length,
      createdAt: s.createdAt,
    }))
    return Response.json({ sessions: all })
  }

  return Response.json({
    sessionId: session.sessionId,
    model: session.model,
    transcript: session.transcript,
    toolCallLog: session.toolCallLog,
    createdAt: session.createdAt,
    lastActivityAt: session.lastActivityAt,
  })
}
