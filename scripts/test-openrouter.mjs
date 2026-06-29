import { ChatOpenAI } from '@langchain/openai'
import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { HumanMessage } from '@langchain/core/messages'

const apiKey = process.env.OPENROUTER_API_KEY
console.log('Key:', apiKey?.slice(0, 12))

const llm = new ChatOpenAI({
  model: 'google/gemma-4-26b-a4b-it:free',
  apiKey,
  configuration: { baseURL: 'https://openrouter.ai/api/v1' },
  maxTokens: 200,
})

const sayHello = tool(async ({ name }) => `Hello ${name}!`, {
  name: 'say_hello',
  description: 'Say hello to someone by name',
  schema: z.object({ name: z.string().describe('The name to greet') }),
})

const bound = llm.bindTools([sayHello])
const resp = await bound.invoke([new HumanMessage('Use the say_hello tool for Alice')])
console.log('content:', resp.content)
console.log('tool_calls:', JSON.stringify(resp.tool_calls, null, 2))
console.log('finish_reason:', resp.response_metadata?.finish_reason)
