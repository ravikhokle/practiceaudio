# Voice Assistant Backend

Simple Express API that accepts audio uploads, transcribes using Deepgram, and
extracts structured actions via Google Generative AI (Gemini).

## Setup

1. Copy `.env.example` to `.env` and fill in your Deepgram and Cohere API keys (`COHERE_API_KEY`). Set `MONGODB_URL` to a valid MongoDB connection string. Optionally set `FRONTEND_ORIGIN` to restrict CORS (e.g. `http://localhost:5173`).
2. `npm install` to install dependencies.
3. `npm run dev` or `npm start` to run.

## Endpoint

`POST /api/voice` - multipart/form-data with a field named `audio` containing a
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

## Posts API

`POST /posts` - application/json body with `title`, `description`, `category`. Stores the data in MongoDB.

`GET /posts/stream` - Server-Sent Events stream providing new posts as they are inserted.
