// The shared list of calls, kept as one JSON file in Vercel Blob
// (recordings.json): the SDK can't list a flow's sessions, so every call
// started from the page is added here.
//   GET  /api/sessions          the list; recording URLs Voxio has saved since are filled in
//   POST /api/sessions {id}     adds a call when it starts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { head, put } from '@vercel/blob'
import { Voxio } from 'voxioagent/server'

export type Entry = {
  sessionId: string
  startedAt: string
  recordingUrl: string | null
  status: string | null
  duration: number | string | null
}

const FILE = 'recordings.json'
const voxio = new Voxio({ flowKey: process.env.VITE_VOXIO_FLOW_KEY, environment: 'gpu' })

async function read(): Promise<Entry[]> {
  try {
    const { url } = await head(FILE)
    // The query string skips the Blob CDN's copy, so a write is seen at once.
    const r = await fetch(`${url}?t=${Date.now()}`, { cache: 'no-store' })
    return r.ok ? ((await r.json()) as Entry[]) : []
  } catch {
    return [] // not created yet
  }
}

const write = (list: Entry[]) => put(FILE, JSON.stringify(list, null, 2), {
  access: 'public', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json', cacheControlMaxAge: 60,
})

/** Fills in recordings Voxio has saved since; recordings arrive a little after a call ends. */
async function fill(list: Entry[]): Promise<boolean> {
  const missing = list.filter((e) => !e.recordingUrl).slice(0, 10)
  const found = await Promise.all(missing.map(async (e) => {
    try {
      const s = await voxio.sessions.get(e.sessionId)
      if (!s.recordingUrl) return false
      Object.assign(e, { recordingUrl: s.recordingUrl, status: s.status ?? null, duration: s.totalConnectedTime ?? null })
      return true
    } catch { return false }
  }))
  return found.some(Boolean)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')
  try {
    if (req.method === 'POST') {
      const id = typeof req.body?.id === 'string' ? req.body.id.trim() : ''
      if (!/^[\w-]{8,80}$/.test(id)) return res.status(400).json({ error: 'Bad session id.' })
      const list = await read()
      if (!list.some((e) => e.sessionId === id)) {
        list.unshift({ sessionId: id, startedAt: new Date().toISOString(), recordingUrl: null, status: null, duration: null })
        await write(list)
      }
      return res.json(list)
    }
    if (req.method === 'GET') {
      const list = await read()
      if (await fill(list)) await write(list)
      return res.json(list)
    }
    return res.status(405).json({ error: 'GET or POST only.' })
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : 'Could not read the list.' })
  }
}
