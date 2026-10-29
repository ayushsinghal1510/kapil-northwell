import { useEffect, useState } from 'react'
import { useVoxioSession } from 'voxioagent/react'

const FLOW_KEY = import.meta.env.VITE_VOXIO_FLOW_KEY as string | undefined

const STATE_TEXT: Record<string, string> = {
  idle: 'Ready', connecting: 'Connecting…', listening: 'Listening', speaking: 'Agent speaking', ended: 'Call ended', error: 'Something went wrong',
}

export default function App() {
  const [callId, setCallId] = useState(() => crypto.randomUUID())
  if (!FLOW_KEY) return <p>Set VITE_VOXIO_FLOW_KEY (see .env.example).</p>
  return (
    <main className="page">
      <h1>Voice session</h1>
      {/* A fresh session per call: remounting starts a new session. */}
      <Call key={callId} sessionId={callId} onNext={() => setCallId(crypto.randomUUID())} />
    </main>
  )
}

function Call({ sessionId, onNext }: { sessionId: string; onNext: () => void }) {
  // Audio only: no avatar video is requested.
  const v = useVoxioSession({ flowKey: FLOW_KEY, environment: 'gpu', sessionId, recording: true, media: { audio: true, video: false } })
  const live = v.state === 'connecting' || v.state === 'listening' || v.state === 'speaking'
  const done = v.state === 'ended' || v.state === 'error'

  // Print every message from the agent's data channel, and build the chat from it:
  // `out.user_input` is what the caller said, `out.speak` what the agent said.
  const [log, setLog] = useState<string[]>([])
  const [chat, setChat] = useState<{ who: 'you' | 'ai'; text: string }[]>([])
  useEffect(() => {
    const s = v.session
    if (!s) return
    const add = (kind: string, data: unknown) => setLog((l) => [...l, `${kind} ${JSON.stringify(data)}`].slice(-300))
    const offs = [
      s.on('state', (st) => add('state', st)),
      s.on('agent', (p) => {
        if (typeof p.chunk !== 'string' || p.is_last) add('agent', p)
        const out = p.out as { user_input?: unknown; speak?: unknown } | undefined
        if (typeof out?.user_input === 'string' && out.user_input.trim()) setChat((c) => [...c, { who: 'you', text: out.user_input as string }])
        // Voice tags like [thoughtful] are for the voice, not the reader.
        const said = typeof out?.speak === 'string' ? out.speak.replace(/\[[^\]]*\]\s*/g, '').trim() : ''
        if (said) setChat((c) => [...c, { who: 'ai', text: said }])
      }),
      s.on('message', (m) => add('message', m)),
    ]
    return () => offs.forEach((off) => off())
  }, [v.session])

  return (
    <>
      <section className="card">
        <div className={`orb is-${v.state}`} style={{ ['--lvl' as string]: String(Math.max(v.level.user, v.level.agent)) }} />
        <b>{STATE_TEXT[v.state] ?? v.state}</b>
        {v.error && <p className="err">{v.error.message}</p>}
        {v.reply?.text && <p className="reply">{v.reply.text}</p>}
        <div className="actions">
          {!live && !done && <button className="primary" onClick={() => void v.start()}>Start call</button>}
          {live && <button onClick={() => v.mute(!v.muted)}>{v.muted ? 'Unmute' : 'Mute'}</button>}
          {live && <button className="danger" onClick={() => void v.stop()}>End call</button>}
          {done && <button className="primary" onClick={onNext}>New call</button>}
        </div>
      </section>
      <h2>Conversation</h2>
      <div className="chat">
        {chat.length === 0 && <p className="muted">The conversation appears here.</p>}
        {chat.map((m, i) => <p key={i} className={`bubble ${m.who}`}>{m.text}</p>)}
      </div>
      <h2>Data channel</h2>
      <pre className="log">{log.join('\n') || 'Messages from the agent appear here during a call.'}</pre>
    </>
  )
}
