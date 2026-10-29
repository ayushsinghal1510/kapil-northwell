// The end-of-call feedback every agent sends on the data channel once the
// conversation is over: `out: { feedback, score }`, and on some agents also
// `subscores`, `outcome`, `compliance_flag` and `compliance_reason`.

export type FeedbackData = {
  feedback?: string
  score?: number | string
  subscores?: Record<string, number | string>
  outcome?: string
  compliance_flag?: string
  compliance_reason?: string
}

/** 0–1 shows as a percentage, anything larger as given (for example 72 or 7.5). */
function fmtScore(score: number | string | undefined) {
  const n = typeof score === 'string' ? Number(score) : score
  if (n === undefined || Number.isNaN(n)) return score === undefined ? null : String(score)
  return n <= 1 ? `${Math.round(n * 100)}%` : String(Math.round(n * 10) / 10)
}

const label = (k: string) => k.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())

/** Splits "[Overall] … [Strengths] …" into titled sections; plain text stays one block. */
function sections(text: string) {
  const parts = text.split(/\n?\s*\[([^\]]+)\]\s*/).filter((p) => p !== '')
  if (parts.length < 2 || !text.trim().startsWith('[')) return [{ title: '', body: text.trim() }]
  const out: { title: string; body: string }[] = []
  for (let i = 0; i < parts.length; i += 2) out.push({ title: parts[i], body: (parts[i + 1] ?? '').trim() })
  return out
}

export default function Feedback({ data }: { data: FeedbackData }) {
  const score = fmtScore(data.score)
  const flagged = String(data.compliance_flag ?? '').toLowerCase() === 'yes'
  return (
    <section className="card feedback">
      <div className="fb-head">
        <h2>Feedback</h2>
        {score && <span className="fb-score">{score}</span>}
      </div>
      {(data.outcome || flagged) && (
        <div className="fb-tags">
          {data.outcome && <span className="tag">{label(data.outcome)}</span>}
          {flagged && <span className="tag is-bad">Safety flag{data.compliance_reason ? `: ${data.compliance_reason}` : ''}</span>}
        </div>
      )}
      {data.subscores && Object.keys(data.subscores).length > 0 && (
        <dl className="fb-subs">
          {Object.entries(data.subscores).map(([k, v]) => (
            <div key={k}><dt>{label(k)}</dt><dd>{String(v)}{typeof v === 'number' && v <= 5 ? ' / 5' : ''}</dd></div>
          ))}
        </dl>
      )}
      {data.feedback && sections(data.feedback).map((s, i) => (
        <div key={i} className="fb-sec">
          {s.title && <h3>{s.title}</h3>}
          <p>{s.body}</p>
        </div>
      ))}
    </section>
  )
}
