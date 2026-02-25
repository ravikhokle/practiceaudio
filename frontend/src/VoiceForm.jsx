import { useState, useRef } from 'react';
import './VoiceForm.css';

export default function VoiceForm() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: ''
  });

  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      setError('');
      setTranscript('');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendAudioToBackend(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Stop recording after 4 seconds
      setTimeout(() => {
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
          setIsRecording(false);
        }
      }, 4000);
    } catch (err) {
      setError('Failed to access microphone. Please check permissions.');
      console.error(err);
    }
  };

  const sendAudioToBackend = async (audioBlob) => {
    setLoading(true);
    try {
      const formDataObj = new FormData();
      formDataObj.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('/api/voice', {
        method: 'POST',
        body: formDataObj
      });

      if (!response.ok) {
        throw new Error('Failed to process audio');
      }

      const data = await response.json();
      setTranscript(data.transcript || '');

      // Auto-fill form if action is create_post
      if (data.action?.action === 'create_post' && data.action?.data) {
        setFormData(prev => ({
          ...prev,
          title: data.action.data.title || '',
          description: data.action.data.description || '',
          category: data.action.data.category || ''
        }));
      }
    } catch (err) {
      setError(err.message || 'Error processing audio');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="voice-form-container">
      <div className="voice-form-header">
        <h1>Voice Form</h1>
        <p>Click the microphone button to record (4 seconds)</p>
      </div>

      <div className="microphone-section">
        <button
          className={`mic-button ${isRecording ? 'recording' : ''}`}
          onClick={startRecording}
          disabled={loading || isRecording}
          title="Click to record audio"
        >
          {isRecording ? '⏹️ Recording...' : '🎤 Record'}
        </button>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Processing audio...</p>
        </div>
      )}

      {error && (
        <div className="error-state">
          <p className="error-message">❌ {error}</p>
        </div>
      )}

      {transcript && (
        <div className="transcript-section">
          <h3>Transcript</h3>
          <p className="transcript-text">{transcript}</p>
        </div>
      )}

      <form className="form-section">
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Enter title"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Enter description"
            rows="4"
          ></textarea>
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
          >
            <option value="">Select a category</option>
            <option value="business">Business</option>
            <option value="personal">Personal</option>
            <option value="technical">Technical</option>
            <option value="other">Other</option>
          </select>
        </div>

        <p className="form-note">ℹ️ Form does not auto-submit. Edit fields as needed.</p>
      </form>
    </div>
  );
}
