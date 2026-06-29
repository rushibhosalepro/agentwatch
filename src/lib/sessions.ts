import type { BaseMessage } from '@langchain/core/messages'

export interface ToolCallRecord {
  tool: string
  input: Record<string, unknown>
  output: unknown
  timestamp: string
}

export interface MessageRecord {
  role: 'attacker' | 'target'
  content: string
  toolCalls?: ToolCallRecord[]
  timestamp: string
}

export interface AgentSession {
  sessionId: string
  systemPrompt: string
  model: string
  tools: string[]
  apiKey: string
  history: BaseMessage[]
  transcript: MessageRecord[]
  toolCallLog: ToolCallRecord[]
  createdAt: string
  lastActivityAt: string
}

// Global in-memory store — survives across requests in Next.js dev
// In production this would be Redis/DB
declare global {
  // eslint-disable-next-line no-var
  var __agentSessions: Map<string, AgentSession> | undefined
}

export const sessions: Map<string, AgentSession> =
  global.__agentSessions ?? (global.__agentSessions = new Map())

export function createSession(
  systemPrompt: string,
  model: string,
  tools: string[],
  apiKey: string,
): AgentSession {
  const sessionId = crypto.randomUUID()
  const now = new Date().toISOString()
  const session: AgentSession = {
    sessionId,
    systemPrompt,
    model,
    tools,
    apiKey,
    history: [],
    transcript: [],
    toolCallLog: [],
    createdAt: now,
    lastActivityAt: now,
  }
  sessions.set(sessionId, session)
  return session
}

export function getSession(sessionId: string): AgentSession | undefined {
  return sessions.get(sessionId)
}

export function appendMessage(sessionId: string, record: MessageRecord) {
  const s = sessions.get(sessionId)
  if (s) {
    s.transcript.push(record)
    s.lastActivityAt = new Date().toISOString()
  }
}

export function appendToolCall(sessionId: string, record: ToolCallRecord) {
  const s = sessions.get(sessionId)
  if (s) {
    s.toolCallLog.push(record)
  }
}
