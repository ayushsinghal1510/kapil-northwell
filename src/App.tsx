import { useEffect, useState } from 'react'
import { VoxioAvatar } from 'voxioagent/react'
import type { VoxioAvatar as AvatarElement } from 'voxioagent/widget'

const FLOW_KEY = import.meta.env.VITE_VOXIO_FLOW_KEY as string | undefined

// The flow's participants graph, as saved in Voxio (the agent is "ai").
const PARTICIPANTS = {
  ai_participant: 'ai',
  participants: [
    { name: 'user', connections: [{ name: 'ai', audio: true, video: true }] },
    { name: 'ai', connections: [{ name: 'user', audio: true, video: false }] },
  ],
}

export default function App() {
  const [avatar, setAvatar] = useState<AvatarElement | null>(null)
  const [log, setLog] = useState<string[]>([])

  // Print every message from the agent's data channel.
  useEffect(() => {
    const s = avatar?.session
    if (!s) return
    const add = (kind: string, data: unknown) => setLog((l) => [...l, `${kind} ${JSON.stringify(data)}`].slice(-300))
    const offs = [
      s.on('state', (st) => add('state', st)),
      s.on('agent', (p) => { if (typeof p.chunk !== 'string' || p.is_last) add('agent', p) }),
      s.on('message', (m) => add('message', m)),
    ]
    return () => offs.forEach((off) => off())
  }, [avatar])

  if (!FLOW_KEY) return <p>Set VITE_VOXIO_FLOW_KEY (see .env.example).</p>

  return (
    <main className="page">
      <h1>Voice session</h1>
      <VoxioAvatar
        flowKey={FLOW_KEY}
        environment="gpu"
        recording
        participants={PARTICIPANTS}
        placement="inline"
        size="100%"
        elementRef={setAvatar}
      />
      <h2>Data channel</h2>
      <pre className="log">{log.join('\n') || 'Messages from the agent appear here during a call.'}</pre>
    </main>
  )
}
