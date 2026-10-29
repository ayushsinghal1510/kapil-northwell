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
2. Add the environment variable `VITE_VOXIO_FLOW_KEY` with the flow key.
3. Deploy.

Note: `VITE_*` values are built into the page, so the flow key is visible in the browser. That's how the Voxio
browser SDK works (a voice session needs the flow key). Anyone with the page URL can start calls on this flow.
