import { useCallback, useEffect, useRef, useState } from 'react'
import { useVoxioSession } from 'voxioagent/react'

const FLOW_KEY = import.meta.env.VITE_VOXIO_FLOW_KEY as string | undefined
type Entry = { sessionId: string; startedAt: string; recordingUrl: string | null; status: string | null; duration: number | string | null }
type Detail = {
  status: string | null
  duration: number | string | null
  recordingUrl: string | null
  transcript: { role: string; text: string }[]
}

// The SDK can't list a flow's sessions, so every call started here is kept in a
// shared JSON list (/api/sessions, stored in Vercel Blob).
async function fetchList(): Promise<Entry[]> {
  const r = await fetch('/api/sessions')
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? 'Could not load the list.')
  return r.json()
}

const STATE_TEXT: Record<string, string> = {
  idle: 'Ready', connecting: 'Connecting…', listening: 'Listening', speaking: 'Agent speaking', ended: 'Call ended', error: 'Something went wrong',
}

export default function App() {
  const [list, setList] = useState<Entry[] | null>(null)
  const [listErr, setListErr] = useState('')
  const [callId, setCallId] = useState(() => crypto.randomUUID())

  const refresh = useCallback(() => {
    fetchList().then((l) => { setList(l); setListErr('') }, (e: Error) => setListErr(e.message))
  }, [])
  useEffect(refresh, [refresh])

  const remember = useCallback((id: string) => {
    fetch('/api/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Could not save the call to the list.'))))
      .then((l: Entry[]) => setList(l), (e: Error) => setListErr(e.message))
  }, [])

  if (!FLOW_KEY) {
    return <main className="page"><p className="err">Set VITE_VOXIO_FLOW_KEY (see .env.example).</p></main>
  }

  return (
    <main className="page">
      <header className="head">
        <h1>Voice sessions</h1>
        <p className="muted">Talk to the agent, then listen back to each call.</p>
      </header>
      {/* A fresh session id per call: remounting starts a new session. */}
      <Call key={callId} sessionId={callId} onStarted={remember} onNext={() => { setCallId(crypto.randomUUID()); refresh() }} />
      <section className="card">
        <div className="row spread">
          <h2>Recordings</h2>
          <span className="row">
            <button className="link" onClick={refresh}>Refresh</button>
            <a className="link" href="/api/sessions" target="_blank" rel="noreferrer">JSON</a>
          </span>
        </div>
        {listErr && <p className="err">{listErr}</p>}
        {list === null ? <p className="muted">Loading…</p>
          : list.length === 0 ? <p className="muted">No calls yet. Start one above.</p>
          : <ul className="list">{list.map((e) => <Recording key={e.sessionId} item={e} />)}</ul>}
      </section>
    </main>
  )
}

function Call({ sessionId, onStarted, onNext }: { sessionId: string; onStarted: (id: string) => void; onNext: () => void }) {
  // media.video asks the voice server for the agent's lip-synced face.
  const v = useVoxioSession({ flowKey: FLOW_KEY, environment: 'gpu', sessionId, recording: true, media: { audio: true, video: true } })
  const face = useRef<HTMLVideoElement>(null)
  useEffect(() => { if (face.current) face.current.srcObject = v.agentStream }, [v.agentStream])
  const live = v.state === 'connecting' || v.state === 'listening' || v.state === 'speaking'
  const done = v.state === 'ended' || v.state === 'error'

  useEffect(() => { if (live) onStarted(sessionId) }, [live, sessionId, onStarted])

  return (
    <section className="card call">
      {v.agentStream
        ? <video ref={face} className="face" autoPlay playsInline />
        : <div className={`orb is-${v.state}`} style={{ ['--lvl' as string]: String(Math.max(v.level.user, v.level.agent)) }} />}
      <div className="call-body">
        <b>{STATE_TEXT[v.state] ?? v.state}</b>
        {v.error && <p className="err">{v.error.message}</p>}
        {v.reply?.text && <p className="reply">{v.reply.text}</p>}
      </div>
      <div className="actions">
        {!live && !done && <button className="primary" onClick={() => void v.start()}>Start call</button>}
        {live && <button onClick={() => v.mute(!v.muted)}>{v.muted ? 'Unmute' : 'Mute'}</button>}
        {live && <button className="danger" onClick={() => void v.stop()}>End call</button>}
        {done && <button className="primary" onClick={onNext}>New call</button>}
      </div>
    </section>
  )
}

function Recording({ item }: { item: Entry }) {
  const [open, setOpen] = useState(false)
  const [detail, setDetail] = useState<Detail | null>(null)
  const [msg, setMsg] = useState('')
  const loading = useRef(false)

  const load = async () => {
    if (loading.current) return
    loading.current = true
    setMsg('Loading…')
    try {
      const r = await fetch(`/api/session?id=${encodeURIComponent(item.sessionId)}`)
      const body = await r.json()
      if (r.ok) { setDetail(body); setMsg('') }
      else setMsg(r.status === 404 ? 'The recording is still being saved. Try again in a minute.' : body.error ?? 'Could not load.')
    } catch { setMsg('Could not load.') }
    loading.current = false
  }

  const toggle = () => { setOpen(!open); if (!open && !detail) void load() }

  return (
    <li className="item">
      <button className="item-head" onClick={toggle} aria-expanded={open}>
        <span>{new Date(item.startedAt).toLocaleString()}</span>
        <span className="muted">{(detail ?? item).recordingUrl ? `Recorded ${fmtDuration((detail ?? item).duration)}` : 'Recording pending'}</span>
      </button>
      {open && (
        <div className="item-body">
          {msg && <p className="muted">{msg} {!detail && msg !== 'Loading…' && <button className="link" onClick={() => void load()}>Retry</button>}</p>}
          {detail && (detail.recordingUrl
            ? <audio controls preload="none" src={detail.recordingUrl} />
            : <p className="muted">No recording for this call.</p>)}
          {detail && detail.transcript.length > 0 && (
            <ol className="transcript">
              {detail.transcript.map((t, i) => <li key={i} className={`t-${t.role}`}><b>{t.role === 'user' ? 'You' : 'Agent'}</b> {t.text}</li>)}
            </ol>
          )}
          <div className="row">
            {detail && <button className="link" onClick={() => void load()}>Refresh</button>}
          </div>
        </div>
      )}
    </li>
  )
}

function fmtDuration(d: number | string | null) {
  const n = typeof d === 'string' ? Number(d) : d
  if (!n || Number.isNaN(n)) return ''
  const s = Math.round(n)
  return `· ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
