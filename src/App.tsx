import { useEffect, useRef, useState } from 'react'
import { useVoxioSession } from 'voxioagent/react'

const FLOW_KEY = import.meta.env.VITE_VOXIO_FLOW_KEY as string | undefined

const STATE_TEXT: Record<string, string> = {
  idle: 'Ready', connecting: 'Connecting…', listening: 'Listening', speaking: 'Agent speaking', ended: 'Call ended', error: 'Something went wrong',
}

export default function App() {
  const [callId, setCallId] = useState(() => crypto.randomUUID())

  if (!FLOW_KEY) {
    return <main className="page"><p className="err">Set VITE_VOXIO_FLOW_KEY (see .env.example).</p></main>
  }

  return (
    <main className="page">
      <header className="head">
        <h1>Voice session</h1>
        <p className="muted">Talk to the agent. Every call is recorded in Voxio.</p>
      </header>
      {/* A fresh session per call: remounting starts a new session. */}
      <Call key={callId} sessionId={callId} onNext={() => setCallId(crypto.randomUUID())} />
    </main>
  )
}

function Call({ sessionId, onNext }: { sessionId: string; onNext: () => void }) {
  // media.video asks the voice server for the agent's lip-synced face.
  const v = useVoxioSession({ flowKey: FLOW_KEY, environment: 'gpu', sessionId, recording: true, media: { audio: true, video: true } })
  const face = useRef<HTMLVideoElement>(null)
  useEffect(() => { if (face.current) face.current.srcObject = v.agentStream }, [v.agentStream])
  const live = v.state === 'connecting' || v.state === 'listening' || v.state === 'speaking'
  const done = v.state === 'ended' || v.state === 'error'

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
