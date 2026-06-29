'use server'

const ORG_GUID    = 'aaeea235-9b00-4312-bbff-e7bd508e62ef'
const TENANT      = 'DefaultTenant'
const FOLDER      = '10abe197-d802-4133-ab53-0243b06788e9'
const RELEASE_KEY = 'b7680ec1-f7c8-4060-bd6f-c3ac3d8e80b4'

const ORC_BASE  = `https://staging.uipath.com/${ORG_GUID}/${TENANT}/orchestrator_`
const PIMS_BASE = `https://staging.uipath.com/${ORG_GUID}/${TENANT}/pims_`

async function safeJson(resp: Response): Promise<Record<string, unknown>> {
  const text = await resp.text()
  if (!text) return {}
  try { return JSON.parse(text) as Record<string, unknown> } catch { return { _raw: text } }
}

function pat(): string {
  const t = process.env.UIPATH_TOKEN
  if (!t) throw new Error('UIPATH_TOKEN not set in .env.local')
  return t
}

function hdrs(extra: Record<string, string> = {}): Record<string, string> {
  return {
    Authorization:        `Bearer ${pat()}`,
    'X-UIPATH-FolderKey': FOLDER,
    ...extra,
  }
}

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

// Find the newest running/pending case instance for our process
async function findNewestCaseId(): Promise<string | null> {
  const resp = await fetch(
    `${PIMS_BASE}/api/v1/cases/sla-summary?pageNumber=1&pageSize=10`,
    { headers: hdrs() },
  )
  if (!resp.ok) return null
  const data = await safeJson(resp) as Record<string, unknown> & { cases?: Array<Record<string, unknown>> }
  const cases = data.cases ?? []
  // Find newest case matching our folder and process that is still active
  const match = cases.find(
    c => c.processKey === RELEASE_KEY
      && c.folderKey === FOLDER
      && !['Completed', 'Cancelled'].includes(c.instanceStatus as string),
  )
  return (match?.caseInstanceId as string) ?? null
}

export async function startCase(): Promise<{
  ok: boolean
  caseInstanceId: string | null
  status: number
  data: Record<string, unknown>
}> {
  const body = JSON.stringify({
    startInfo: {
      ReleaseKey:    RELEASE_KEY,
      Strategy:      'JobsCount',
      JobsCount:     1,
      InputArguments: '{}',
    },
  })

  const resp = await fetch(
    `${ORC_BASE}/odata/Jobs/UiPath.Server.Configuration.OData.StartJobs`,
    { method: 'POST', headers: hdrs({ 'Content-Type': 'application/json' }), body },
  )
  const data = await safeJson(resp)
  if (!resp.ok) return { ok: false, caseInstanceId: null, status: resp.status, data }

  // Poll pims_ until the new case instance appears (usually within a few seconds)
  for (let i = 0; i < 6; i++) {
    await sleep(2000)
    const caseInstanceId = await findNewestCaseId()
    if (caseInstanceId) return { ok: true, caseInstanceId, status: 201, data }
  }

  // Case not visible yet — caller can retry via pollCase with null id
  return { ok: true, caseInstanceId: null, status: 201, data }
}

export async function pollCase(
  caseInstanceId: string | null,
): Promise<{ vars: Record<string, unknown>; caseInstanceId: string | null }> {
  // If we don't have a case ID yet, try to discover it
  let id = caseInstanceId
  if (!id) {
    id = await findNewestCaseId()
    if (!id) return { vars: {}, caseInstanceId: null }
  }

  const resp = await fetch(
    `${PIMS_BASE}/api/v1/caseapp/instances/${id}/variables`,
    { headers: hdrs() },
  )
  if (resp.status === 401) throw new Error('TOKEN_EXPIRED')
  if (!resp.ok) return { vars: {}, caseInstanceId: id }

  const data = await safeJson(resp) as Record<string, unknown> & { globals?: Record<string, unknown> }
  return { vars: data.globals ?? {}, caseInstanceId: id }
}
