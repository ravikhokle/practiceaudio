import express from "express";
import cors from "cors";
import multer from "multer";
import axios from "axios";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";

dotenv.config();

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

const {
  DEEPGRAM_API_KEY,
  COHERE_API_KEY,
  COHERE_MODEL = "command-r",
  MONGODB_URL,
} = process.env;

if (!DEEPGRAM_API_KEY || !COHERE_API_KEY || !MONGODB_URL) {
  console.error("Missing env variables");
  process.exit(1);
}

let postsCollection;

const client = new MongoClient(MONGODB_URL);

async function connectDB() {
  await client.connect();
  const db = client.db();
  postsCollection = db.collection("posts");
  console.log("Connected to MongoDB");
}
connectDB();

// 🔥 Extract JSON safely
function extractJSON(text) {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}

// 🔥 Execute AI Action
async function handleAction(actionJSON) {
  if (!postsCollection) return "DB not ready";

  const { action, data } = actionJSON || {};

  switch (action) {
    case "create_post": {
      const result = await postsCollection.insertOne({
        ...data,
        createdAt: new Date(),
      });
      return { message: "Post created", id: result.insertedId };
    }

    case "search_post": {
      const results = await postsCollection
        .find({
          title: { $regex: data?.query || "", $options: "i" },
        })
        .toArray();
      return results;
    }

    case "delete_post": {
      await postsCollection.deleteOne({
        _id: new ObjectId(data?.id),
      });
      return { message: "Post deleted" };
    }

    default:
      return "Unknown action";
  }
}

// 🎤 Voice Endpoint
app.post("/api/voice", upload.single("audio"), async (req, res) => {
  try {
    const dgResponse = await axios.post(
      "https://api.deepgram.com/v1/listen",
      req.file.buffer,
      {
        headers: {
          Authorization: `Token ${DEEPGRAM_API_KEY}`,
          "Content-Type": req.file.mimetype,
        },
        params: {
          model: "nova-2",
          punctuate: true,
        },
      }
    );

    const transcript =
      dgResponse.data?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";

    const cohereResponse = await axios.post(
      "https://api.cohere.ai/v2/chat",
      {
        model: COHERE_MODEL,
        messages: [
          {
            role: "user",
            content: `
Extract JSON:
{
  "action": string,
  "data": object
}

Supported:
create_post
search_post
delete_post

Transcript:
"${transcript}"

Respond ONLY raw JSON.
`,
          },
        ],
        temperature: 0,
      },
      {
        headers: {
          Authorization: `Bearer ${COHERE_API_KEY}`,
        },
      }
    );

    const aiText =
      cohereResponse.data?.message?.content?.[0]?.text || "";

    const jsonString = extractJSON(aiText);
    const actionJSON = JSON.parse(jsonString);

    const result = await handleAction(actionJSON);

    res.json({
      transcript,
      action: actionJSON,
      result,
    });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Manual Post API
app.post("/posts", async (req, res) => {
  const result = await postsCollection.insertOne({
    ...req.body,
    createdAt: new Date(),
  });
  res.json({ id: result.insertedId });
});

// SSE
app.get("/posts/stream", (req, res) => {
  res.writeHead(200, {
    Connection: "keep-alive",
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
  });

  const changeStream = postsCollection.watch();
  changeStream.on("change", (change) => {
    if (change.operationType === "insert") {
      res.write(`data: ${JSON.stringify(change.fullDocument)}\n\n`);
    }
  });

  req.on("close", () => changeStream.close());
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});