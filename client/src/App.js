import React, { useState, useEffect, useRef, useMemo } from 'react';
import logo from './microphone.png';
import './App.css';
import RecordRTC from 'recordrtc';
import TextBox from './components/TextBox';
import RecordButton from './components/RecordButton';
import UploadButton from './components/UploadButton';
import TranscriptionResult from './components/TranscriptionResult';


function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [transcriptionResult, setTranscriptionResult] = useState(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [contentLoaded, setContentLoaded] = useState(false);

  const recorderRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);

  const slideshowMessages = useMemo(() => [
    'Recall', 
    'revisit any conversation', 
    'built for students, educators, & professionals', 
    'select mic to start recording'
  ], []);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    await handleSubmit(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async (file) => {
    if (!file) {
      alert('Please select a file first.');
      return;
    }
  
    setIsLoading(true);
  
    const formData = new FormData();
    formData.append('file', file);
  
    try {
      const uploadResponse = await fetch(`${window.location.origin}/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file.');
      }
      const uploadResult = await uploadResponse.json();
      console.log('File uploaded to:', uploadResult.location);
  
      // Transcribe
      const transcribeResponse = await fetch(`${window.location.origin}/transcribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audioUrl: uploadResult.location }),
      });
      if (!transcribeResponse.ok) {
        throw new Error('Failed to transcribe audio.');
      }
      const transcription = await transcribeResponse.json();
  
      // Summarize
      const summarizeResponse = await fetch(`${window.location.origin}/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcriptText: transcription.text }), // Ensure this matches the expected format for your backend
      });
      if (!summarizeResponse.ok) {
        throw new Error('Failed to summarize transcription.');
      }
      const summary = await summarizeResponse.json();
  
      setTranscriptionResult({ transcription: transcription.words, analysis: summary });
      setContentLoaded(true);
    } catch (err) {
      console.error('There was an error:', err.message);
      alert('Error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Add a useEffect to reset contentLoaded when a new file is selected
  useEffect(() => {
    if (selectedFile) {
      setContentLoaded(false); // Reset contentLoaded when a new file is selected
    }
  }, [selectedFile]);

  const startRecording = () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        streamRef.current = stream; // Store the stream in the ref
        const recorder = new RecordRTC(stream, {
          type: 'audio',
          mimeType: 'audio/mp3',
          recorderType: RecordRTC.StereoAudioRecorder,
        });
        recorder.startRecording();
        recorderRef.current = recorder;
        setIsRecording(true);
      }).catch(error => {
        console.error("Error accessing the microphone:", error);
        alert("Error accessing the microphone: " + error.message);
      });
  };

  const stopRecordingAndUpload = () => {
    if (recorderRef.current) {
      recorderRef.current.stopRecording(() => {
        const blob = recorderRef.current.getBlob();
        const audioFile = new File([blob], "audio_recording.mp3", { type: "audio/mp3" });
        setSelectedFile(audioFile);
        handleSubmit(audioFile);

        // Stop the stream tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null; // Clear the ref after stopping the tracks
        }

        recorderRef.current = null;
        setIsRecording(false);
      });
    }
  };

  return (
    <div className="App">
      <header className={`App-header ${contentLoaded ? 'content-loaded' : ''}`}>
        {transcriptionResult && transcriptionResult.analysis ? (
          <>
            <img src={logo} className="window-top-right-logo" alt="logo" onClick={() => window.location.reload()} />
            <TranscriptionResult transcriptionResult={transcriptionResult} />
          </>
        ) : (
          <>
            <TextBox 
              isRecording={isRecording} 
              isLoading={isLoading} 
              slideshowMessages={slideshowMessages} 
            />
            <RecordButton isRecording={isRecording} startRecording={startRecording} stopRecordingAndUpload={stopRecordingAndUpload} />
            <UploadButton isLoading={isLoading} handleFileChange={handleFileChange} handleButtonClick={handleButtonClick} fileInputRef={fileInputRef} />
          </>
          )}
      </header>
    </div>
  );
}

export default App;