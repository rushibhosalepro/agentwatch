export async function GET() {
  return new Response(JSON.stringify({ valid: true, message: 'AgentWatch MCP server authenticated' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
