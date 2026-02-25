# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

---

## Voice Assistant Frontend Setup

This React/Vite application allows recording audio and sending it to a
backend service for transcription and structured action extraction.

1. Copy `.env.example` to `.env` and edit `VITE_API_BASE` as needed. Example:
   ```
   VITE_API_BASE=http://localhost:3000/api
   ```
   The value should be the base URL where the backend lives (omit trailing
   slash).
2. Run `npm install` to install dependencies.
3. Start the dev server with `npm run dev`.

The app will POST to `${VITE_API_BASE}/voice` when uploading audio. You can
leave `VITE_API_BASE` empty to use relative paths (e.g. when hosting both
frontend and backend from the same origin).

In addition the form is submitted to `${VITE_API_BASE}/posts` when you click
"Submit"; the backend stores the data in MongoDB.  The component also opens
an EventSource to `${VITE_API_BASE}/posts/stream`, so fields will be updated
live whenever a new post is created anywhere (including via voice commands).

> **Note:** environment variables must be prefixed with `VITE_` to be exposed
to client code.
