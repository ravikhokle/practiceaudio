import express from "express";
import multer from "multer";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
const COHERE_API_KEY = process.env.COHERE_API_KEY;
const COHERE_MODEL = process.env.COHERE_MODEL || "command-a-03-2025";

if (!DEEPGRAM_API_KEY || !COHERE_API_KEY) {
  console.error("Environment variables DEEPGRAM_API_KEY and COHERE_API_KEY must be set");
  process.exit(1);
}

/**
 * Interpret the JSON produced by the language model and perform the
 * requested action.  Only logs to console currently.
 */
function handleAction(actionJSON) {
  if (!actionJSON || typeof actionJSON !== "object") {
    console.warn("handleAction called with invalid actionJSON", actionJSON);
    return;
  }

  const { action, data } = actionJSON;
  switch (action) {
    case "create_post":
      console.log("Creating post", data);
      break;
    case "search_post":
      console.log("Searching", data);
      break;
    case "delete_post":
      console.log("Deleting", data);
      break;
    default:
      console.warn("Unknown action", actionJSON);
  }
}

app.post("/voice", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    // send the file buffer to Deepgram for transcription
    const dgResponse = await axios.post(
      "https://api.deepgram.com/v1/listen",
      req.file.buffer,
      {
        headers: {
          Authorization: `Token ${DEEPGRAM_API_KEY}`,
          "Content-Type": req.file.mimetype || "audio/webm",
        },
        params: {
          punctuate: true,
          language: "en-US",
        },
      }
    );

    const transcript =
      dgResponse.data?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";

    // ask Cohere to extract structured JSON
    const systemPrompt = `You are an assistant that extracts a single JSON object with the following
schema from a user query:\n{\n  action: string,\n  data: object\n}\nSupported actions: create_post, search_post, delete_post.\n"data" should contain whatever parameters are relevant.`;

    const coherePrompt = `${systemPrompt}\n\nTranscript: "${transcript}"\n\nRespond with only the JSON object.`;

    const coResp = await axios.post(
      "https://api.cohere.ai/generate",
      {
        model: COHERE_MODEL,
        prompt: coherePrompt,
        max_tokens: 200,
        temperature: 0,
      },
      {
        headers: {
          Authorization: `Bearer ${COHERE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    let actionJSON = {};
    try {
      const text = coResp.data?.generations?.[0]?.text || "";
      actionJSON = JSON.parse(text);
    } catch (jsonErr) {
      console.error("Failed to parse action JSON from Cohere response", jsonErr);
    }

    // perform the action if recognized
    handleAction(actionJSON);

    res.json({ transcript, action: actionJSON, result: "ok" });
  } catch (err) {
    console.error("Error processing /voice request", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
