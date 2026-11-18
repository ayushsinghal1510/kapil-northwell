// Who can sign in, and which Voxio agents (flows) each person can talk to.
// Keys come from env variables so they can change without a code change.
export type Agent = { name: string; flowKey: string | undefined }

const env = import.meta.env
const ORIGINAL: Agent = { name: 'Margret Collins', flowKey: env.VITE_VOXIO_FLOW_KEY }
const CHEMIST: Agent = { name: 'Chemist', flowKey: env.VITE_FLOW_KEY_CHEMIST }
const DOCTOR: Agent = { name: 'Doctor', flowKey: env.VITE_FLOW_KEY_DOCTOR }
// Roche scenarios S1–S9 (Voxio flows roche_S<n>_<country>_<case>). Keys are hardcoded on purpose.
const ROCHE: Agent[] = [
  { name: 'S1 · NZ 44-101', flowKey: 'vk_VqznsSObd2zTSGkqyrT59EGapVFXZhLHSISBAq8dEbeqQihmxNM5f4nZqjEDmP1D' },
  { name: 'S2 · NZ 43-389', flowKey: 'vk_GdtBwbcssCWuUwT3MjdJF5WDCQ4XgysjXT47ikcCnYvQsLb3eVUdKYti1NAZ4Ne9' },
  { name: 'S3 · NZ 41-203', flowKey: 'vk_Lyp1b7sQFUsZf4r07cEnEHJsJ1B5F1Gd7REAT9KAzoQPuPpsW5aCMRTJDgH5yERV' },
  { name: 'S4 · India 42-306', flowKey: 'vk_cZxyScfGTrxFrLFaqU7Z5nMCQsWcoZsBrY4fPXhwpt1X7u8u0hH0FWOgJP7whnKt' },
  { name: 'S5 · India 44-345', flowKey: 'vk_G59YOKCLtwXXYg2Q6UQj6XhP1JTJSfGRrA04T6irM6eBcibH8b9cmyKXY6m24UOF' },
  { name: 'S6 · India 43-029', flowKey: 'vk_Ql5IIuC29ocJtw3YsavFuVqIaxiUeXIJgIcXyLQWBOjzSyv2NO4SDNs4BTAaUdp7' },
  { name: 'S7 · Thailand 43-205', flowKey: 'vk_obdZHpTMW1o0vF8xdz7i93Q0GU8Z0filpVcXAWPF91Kv7vaAnGDxazNxbsc8CcZP' },
  { name: 'S8 · Thailand 43-042', flowKey: 'vk_5MKokF6x8kGg0x0Q6ZlzwsVx4JVUYtnRRYCz8jRwpQs0hLCkZxtF070DeorLGORc' },
  { name: 'S9 · Thailand 43-200', flowKey: 'vk_yYzCLI1XCRTlQOsGClbwnEYgwlPOI30K5AvgGw1fD2VlTQb7NDN6ShbNUJ2CC5i6' },
]

export const USERS: Record<string, Agent[]> = {
  'kpnt@gmail.com': [ORIGINAL],
  'kpsp@gmail.com': [CHEMIST, DOCTOR],
  'kproche@gmail.com': ROCHE,
}

/** The shared sign-in password, set in VITE_LOGIN_PASSWORD. */
export const PASSWORD = env.VITE_LOGIN_PASSWORD as string | undefined
