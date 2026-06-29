const BASE   = 'https://staging.uipath.com/hackathon26_1008/DefaultTenant/orchestrator_'
const FOLDER = '10abe197-d802-4133-ab53-0243b06788e9'

async function safeJson(resp: Response): Promise<unknown> {
  const text = await resp.text()
  if (!text) return {}
  try { return JSON.parse(text) } catch { return { _raw: text } }
}

export async function POST(request: Request) {
  try {
    const token = process.env.UIPATH_TOKEN
    if (!token) {
      return Response.json({ error: 'UIPATH_TOKEN not set in .env.local' }, { status: 500 })
    }

    const { action, payload } = await request.json()

    const hdrs: Record<string, string> = {
      Authorization:        `Bearer ${token}`,
      'X-UIPATH-FolderKey': FOLDER,
    }

    let url: string
    let method = 'GET'
    let body: string | undefined

    if (action === 'start') {
      url    = `${BASE}/odata/Cases/UiPath.Server.Configuration.OData.StartCase`
      method = 'POST'
      hdrs['Content-Type'] = 'application/json'
      body   = JSON.stringify(payload)
    } else if (action === 'poll') {
      const { caseKey, numericId } = payload as { caseKey: string; numericId: number | null }
      url = numericId
        ? `${BASE}/odata/Cases(${numericId})`
        : `${BASE}/odata/Cases?$filter=Key eq '${caseKey}'`
    } else {
      return Response.json({ error: 'Unknown action' }, { status: 400 })
    }

    const resp = await fetch(url, { method, headers: hdrs, body })
    const data = await safeJson(resp)
    return Response.json(data, { status: resp.status })

  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
