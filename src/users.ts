// Who can sign in, and which Voxio agents (flows) each person can talk to.
// Keys come from env variables so they can change without a code change.
export type Agent = { name: string; flowKey: string | undefined }

const env = import.meta.env
const ORIGINAL: Agent = { name: 'Margret Collins', flowKey: env.VITE_VOXIO_FLOW_KEY }
const CHEMIST: Agent = { name: 'Chemist', flowKey: env.VITE_FLOW_KEY_CHEMIST }
const DOCTOR: Agent = { name: 'Doctor', flowKey: env.VITE_FLOW_KEY_DOCTOR }
const ROCHE_CALLER: Agent = { name: 'Caller', flowKey: env.VITE_FLOW_KEY_ROCHE_CALLER }
const ROCHE_AGENT: Agent = { name: 'Agent', flowKey: env.VITE_FLOW_KEY_ROCHE_AGENT }

export const USERS: Record<string, Agent[]> = {
  'kpnt@gmail.com': [ORIGINAL],
  'kpsp@gmail.com': [CHEMIST, DOCTOR],
  'kproche@gmail.com': [ROCHE_CALLER, ROCHE_AGENT],
}

/** The shared sign-in password, set in VITE_LOGIN_PASSWORD. */
export const PASSWORD = env.VITE_LOGIN_PASSWORD as string | undefined
