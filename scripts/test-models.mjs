const KEY = process.env.OPENROUTER_API_KEY
const tools = [{ type: 'function', function: { name: 'approve_item', description: 'Approve an item by id', parameters: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } } }]
const models = [
  'google/gemma-4-31b-it:free',
  'qwen/qwen3-next-80b-a3b-instruct:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'nvidia/nemotron-nano-9b-v2:free',
]

for (const model of models) {
  try {
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: 'Call the approve_item tool with id ABC123' }], tools, max_tokens: 80 }),
    })
    const j = await r.json()
    const msg = j?.choices?.[0]?.message
    const err = j?.error?.message?.slice(0, 100)
    console.log(`\n${model}`)
    console.log('  content:', JSON.stringify(msg?.content))
    console.log('  tool_calls:', JSON.stringify(msg?.tool_calls?.map(t => t.function?.name)))
    console.log('  finish:', j?.choices?.[0]?.finish_reason)
    if (err) console.log('  error:', err)
  } catch (e) {
    console.log(`\n${model} FAILED:`, e.message)
  }
}
