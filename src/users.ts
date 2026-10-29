// Who can sign in, and which Voxio flow each person talks to. All three use the
// same flow for now; give someone their own key by changing their entry.
const SHARED_FLOW_KEY = import.meta.env.VITE_VOXIO_FLOW_KEY as string | undefined

export const USERS: Record<string, { flowKey: string | undefined }> = {
  'kpnt@gmail.com': { flowKey: SHARED_FLOW_KEY },
  'kpsp@gmail.com': { flowKey: SHARED_FLOW_KEY },
  'kproche@gmail.com': { flowKey: SHARED_FLOW_KEY },
}

/** The shared sign-in password, set in VITE_LOGIN_PASSWORD. */
export const PASSWORD = import.meta.env.VITE_LOGIN_PASSWORD as string | undefined
