# Voice session

A small page to talk to a Voxio voice agent (audio only), with the data channel printed below.

- The browser runs the voice session with `voxioagent/react` (`useVoxioSession`), on Voxio's `gpu` environment.
- Every call is recorded by Voxio. Recordings and transcripts are in the Voxio dashboard, under the flow's Sessions.

## Run locally

    cp .env.example .env.local   # put the flow key in it
    npm install
    npm run dev

## Deploy on Vercel

1. Import the repo in Vercel (framework: Vite, detected automatically).
2. Add the environment variables `VITE_VOXIO_FLOW_KEY` (the flow key) and `VITE_LOGIN_PASSWORD` (the sign-in password).
3. Deploy.

Note: `VITE_*` values are built into the page, so the flow key is visible in the browser. That's how the Voxio
browser SDK works (a voice session needs the flow key). Anyone with the page URL can start calls on this flow.

## Sign-in

Only the emails in `src/users.ts` can sign in, with the password in `VITE_LOGIN_PASSWORD`. Each email maps to a
flow key there; all use the same flow for now.

This is a simple gate, not real security: the check runs in the browser, so someone who reads the page's code can
get past it. Use a server-side login before handing out anything sensitive.
