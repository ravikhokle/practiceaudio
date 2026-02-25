import { useState, useRef, useEffect } from "react";

export default function VoiceForm() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
  });

  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  const toggleRecording = async () => {
    try {
      setError("");

      if (isRecording) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        await sendAudio(blob);

        streamRef.current.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      setError("Microphone permission denied");
    }
  };

  const sendAudio = async (blob) => {
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("audio", blob);

      const res = await fetch("http://localhost:3000/api/voice", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();

      setTranscript(data.transcript || "");

      if (data.action?.action === "create_post") {
        setFormData((prev) => ({
          ...prev,
          ...data.action.data,
        }));
      }

      if (data.action?.action === "search_post") {
        alert("Search query: " + data.action.data.query);
      }
    } catch (err) {
      setError("Error processing audio");
    }

    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    await fetch("http://localhost:3000/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-6">
      <div className="bg-white/20 backdrop-blur-lg shadow-2xl rounded-3xl p-8 w-full max-w-2xl border border-white/30">

        <h1 className="text-3xl font-bold text-white text-center mb-6">
          🎤 AI Voice Form Assistant
        </h1>

        {/* Recording Button */}
        <div className="flex justify-center mb-6">
          <button
            onClick={toggleRecording}
            disabled={loading}
            className={`px-6 py-3 rounded-full text-white font-semibold transition-all duration-300 shadow-lg
            ${
              isRecording
                ? "bg-red-500 animate-pulse scale-105"
                : "bg-green-500 hover:bg-green-600"
            }`}
          >
            {isRecording ? "⏹ Stop Recording" : "🎙 Start Recording"}
          </button>
        </div>

        {loading && (
          <p className="text-white text-center animate-pulse">
            Processing voice...
          </p>
        )}

        {error && (
          <p className="text-red-200 text-center bg-red-500/30 rounded p-2">
            {error}
          </p>
        )}

        {transcript && (
          <div className="bg-white/30 rounded-xl p-4 mb-6 text-white">
            <h3 className="font-semibold mb-2">Transcript</h3>
            <p>{transcript}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-white mb-1">Title</label>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full p-3 rounded-xl bg-white/40 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white"
              placeholder="Enter title"
            />
          </div>

          <div>
            <label className="block text-white mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full p-3 rounded-xl bg-white/40 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white"
              placeholder="Enter description"
            />
          </div>

          <div>
            <label className="block text-white mb-1">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full p-3 rounded-xl bg-white/40 text-white focus:outline-none focus:ring-2 focus:ring-white"
            >
              <option value="">Select category</option>
              <option value="business">Business</option>
              <option value="personal">Personal</option>
              <option value="technical">Technical</option>
              <option value="other">Other</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 transition rounded-xl py-3 text-white font-semibold shadow-lg"
          >
            Submit Post
          </button>
        </form>
      </div>
    </div>
  );
}