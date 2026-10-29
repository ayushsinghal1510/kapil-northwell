// GET /api/session?id=<sessionId>: a finished session's recording and
// transcript, read with the flow key on the server.
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Voxio, VoxioServerError } from 'voxioagent/server'

const voxio = new Voxio({ flowKey: process.env.VITE_VOXIO_FLOW_KEY, environment: 'gpu' })

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = typeof req.query.id === 'string' ? req.query.id : ''
  if (!id) return res.status(400).json({ error: 'Missing session id.' })
  try {
    const s = await voxio.sessions.get(id)
    res.setHeader('Cache-Control', 'no-store')
    return res.json({
      sessionId: s.sessionId,
      status: s.status ?? null,
      startTime: s.startTime ?? null,
      endTime: s.endTime ?? null,
      duration: s.totalConnectedTime ?? null,
      recordingUrl: s.recordingUrl ?? null,
      transcript: (s.transcription ?? []).map((t) => ({ role: t.role, text: t.content ?? t.text ?? '' })),
    })
  } catch (e) {
    // Recordings are saved a little after a call ends; until then the session isn't found.
    if (e instanceof VoxioServerError && e.code === 'not-found') return res.status(404).json({ error: 'Not ready yet.' })
    return res.status(502).json({ error: e instanceof Error ? e.message : 'Could not reach Voxio.' })
  }
}
