# Voice Assistant Backend

Simple Express API that accepts audio uploads, transcribes using Deepgram, and
extracts structured actions via Cohere AI.

## Setup

1. Copy `.env.example` to `.env` and fill in your Deepgram and Cohere API keys.
2. `npm install` to install dependencies.
3. `npm run dev` or `npm start` to run.

## Endpoint

`POST /voice` - multipart/form-data with a field named `audio` containing a
webm audio file.

Response JSON:

```json
{
  "transcript": "...",
  "action": { "action": "create_post", "data": { ... } },
  "result": "ok"
}
```

Errors will return `400` for bad requests or `500` for server errors.
