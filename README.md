# Voice sessions

A small dashboard to talk to a Voxio voice agent and listen back to each call.

- The browser runs the voice session with `voxioagent/react` (`useVoxioSession`).
- `api/session.ts` (a Vercel function) reads a session's recording and transcript with `voxioagent/server`.
- `api/sessions.ts` keeps the shared list of calls as one JSON file, `recordings.json`, in a private Vercel Blob store
  (the SDK can't list a flow's sessions). `GET /api/sessions` returns it and fills in recording URLs once Voxio
  has saved them, which takes a minute or so after a call ends; `POST /api/sessions {id}` adds a call.

## Run locally

    cp .env.example .env.local   # put the flow key in it
    npm install
    npx vercel dev               # UI and /api together

## Deploy on Vercel

1. Import the repo in Vercel (framework: Vite, detected automatically).
2. Add the environment variable `VITE_VOXIO_FLOW_KEY` with the flow key.
3. Storage → create a Blob store and connect it to the project (this adds `BLOB_READ_WRITE_TOKEN`).
   For `vercel dev`, run `npx vercel env pull .env.local` afterwards, then put the flow key back in if it's missing.
4. Deploy.

Note: `VITE_*` values are built into the page, so the flow key is visible in the browser. That's how the Voxio
browser SDK works (a voice session needs the flow key). Anyone with the page URL can start calls on this flow.
