import { useEffect, useState } from 'react'
import { useVoxioSession } from 'voxioagent/react'
import Feedback, { type FeedbackData } from './Feedback'
import { PASSWORD, USERS, type Agent } from './users'

const SIGNED_IN = 'signed-in-as'

const STATE_TEXT: Record<string, string> = {
  idle: 'Ready', connecting: 'Connecting…', listening: 'Listening', speaking: 'Agent speaking', ended: 'Call ended', error: 'Something went wrong',
}

function readSignedIn(): string | null {
  try { const e = localStorage.getItem(SIGNED_IN); return e && USERS[e] ? e : null } catch { return null }
}

export default function App() {
  const [email, setEmail] = useState<string | null>(readSignedIn)
  const [callId, setCallId] = useState(() => crypto.randomUUID())
  const [picked, setPicked] = useState(0)

  const signOut = () => { try { localStorage.removeItem(SIGNED_IN) } catch { /* nothing stored */ } setEmail(null); setPicked(0) }

  if (!email) return <Login onSignedIn={setEmail} />
  const agents = USERS[email]
  const agent: Agent | undefined = agents[picked] ?? agents[0]
  // Switching agents starts a fresh call with the new one.
  const pick = (i: number) => { setPicked(i); setCallId(crypto.randomUUID()) }
  return (
    <main className="page">
      <header className="top">
        <h1>Voice session</h1>
        <span className="who">{email} · <button className="link" onClick={signOut}>Sign out</button></span>
      </header>
      {agents.length > 1 && (
        <nav className="agents" aria-label="Choose an agent">
          {agents.map((a, i) => (
            <button key={a.name} className={i === picked ? 'is-on' : ''} onClick={() => pick(i)} aria-pressed={i === picked}>{a.name}</button>
          ))}
        </nav>
      )}
      {!agent?.flowKey
        ? <p className="err">This agent isn't set up yet.</p>
        // A fresh session per call: remounting starts a new session.
        : <Call key={callId} name={agent.name} flowKey={agent.flowKey} sessionId={callId} onNext={() => setCallId(crypto.randomUUID())} />}
    </main>
  )
}

function Login({ onSignedIn }: { onSignedIn: (email: string) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const who = email.trim().toLowerCase()
    if (!PASSWORD) return setErr('Sign-in is not set up yet.')
    if (!USERS[who] || password !== PASSWORD) return setErr('Wrong email or password.')
    try { localStorage.setItem(SIGNED_IN, who) } catch { /* stays signed in for this visit only */ }
    onSignedIn(who)
  }

  return (
    <main className="page">
      <form className="card login" onSubmit={submit}>
        <h1>Sign in</h1>
        <input type="email" placeholder="Email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {err && <p className="err">{err}</p>}
        <button className="primary" type="submit">Sign in</button>
      </form>
    </main>
  )
}

function Call({ name, flowKey, sessionId, onNext }: { name: string; flowKey: string; sessionId: string; onNext: () => void }) {
  // Audio only: no avatar video is requested.
  const v = useVoxioSession({ flowKey, environment: 'gpu', sessionId, recording: true, media: { audio: true, video: false } })
  const live = v.state === 'connecting' || v.state === 'listening' || v.state === 'speaking'
  const done = v.state === 'ended' || v.state === 'error'

  // The chat, from the agent's messages: `out.user_input` is what the caller said,
  // `out.speak` what the agent said.
  const [chat, setChat] = useState<{ who: 'you' | 'ai'; text: string }[]>([])
  // After the AI's last line (`end_diagnosis: "yes"`) the agent prepares feedback and sends it as `out.feedback`.
  const [feedback, setFeedback] = useState<FeedbackData | null>(null)
  const [awaitingFeedback, setAwaitingFeedback] = useState(false)
  useEffect(() => {
    const s = v.session
    if (!s) return
    return s.on('agent', (p) => {
      const out = p.out as ({ user_input?: unknown; speak?: unknown; end_diagnosis?: unknown } & FeedbackData) | undefined
      if (out?.end_diagnosis === 'yes') setAwaitingFeedback(true)
      if (out && (out.feedback !== undefined || out.score !== undefined)) { setFeedback(out); setAwaitingFeedback(false) }
      if (typeof out?.user_input === 'string' && out.user_input.trim()) setChat((c) => [...c, { who: 'you', text: out.user_input as string }])
      // Voice tags like [thoughtful] are for the voice, not the reader.
      const said = typeof out?.speak === 'string' ? out.speak.replace(/\[[^\]]*\]\s*/g, '').trim() : ''
      if (said) setChat((c) => [...c, { who: 'ai', text: said }])
    })
  }, [v.session])

  return (
    <>
      <section className="card">
        <div className={`orb is-${v.state}`} style={{ ['--lvl' as string]: String(Math.max(v.level.user, v.level.agent)) }} />
        <b>{name}</b>
        <span className="muted">{STATE_TEXT[v.state] ?? v.state}</span>
        {v.error && <p className="err">{v.error.message}</p>}
        <div className="actions">
          {!live && !done && <button className="primary" onClick={() => void v.start()}>Start call</button>}
          {live && <button onClick={() => v.mute(!v.muted)}>{v.muted ? 'Unmute' : 'Mute'}</button>}
          {live && <button className="danger" onClick={() => void v.stop()}>End call</button>}
          {done && <button className="primary" onClick={onNext}>New call</button>}
        </div>
      </section>
      {awaitingFeedback && !feedback && (
        <p className="notice">{live ? 'Preparing your feedback… please stay on the call.' : 'The call ended before the feedback arrived.'}</p>
      )}
      {feedback && <Feedback data={feedback} />}
      <h2>Conversation</h2>
      <div className="chat">
        {chat.length === 0 && <p className="muted">The conversation appears here.</p>}
        {chat.map((m, i) => <p key={i} className={`bubble ${m.who}`}>{m.text}</p>)}
      </div>
    </>
  )
}
