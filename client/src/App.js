import React, { useState, useEffect, useRef } from 'react';
import logo from './microphone.png';
import './App.css';
import AWS from 'aws-sdk';
import { ClipLoader } from 'react-spinners';
import RecordRTC from 'recordrtc';

// AWS S3 configuration
AWS.config.update({
  accessKeyId: 'AKIA5EETVYKJKUFIN44G',
  secretAccessKey: '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',
  region: 'us-west-2',
});

const s3 = new AWS.S3();

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [transcriptionResult, setTranscriptionResult] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [fadeEffect, setFadeEffect] = useState(true); // New state for controlling fade effect
  const displayTextRef = useRef('Recall'); // Ref to hold the current display text
  const recorderRef = useRef(null);
  const fileInputRef = useRef(null);

  // Function to update text with fade effect
  const updateDisplayText = (newText) => {
    setFadeEffect(false); // Start fade out
    setTimeout(() => {
      displayTextRef.current = newText; // Update text after fade out
      setFadeEffect(true); // Start fade in
    }, 500); // Match timeout with CSS transition duration
  };

  // Effect to update display text based on isRecording and isLoading
  useEffect(() => {
    if (isRecording) {
      updateDisplayText('Listening...');
    } else if (isLoading) {
      updateDisplayText('Loading...');
    } else {
      updateDisplayText('Recall');
    }
  }, [isRecording, isLoading]);

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

    const params = {
      Bucket: 'recallbucket',
      Key: `uploads/${file.name}`,
      Body: file,
      ACL: 'public-read',
    };

    try {
      const data = await s3.upload(params).promise();
      console.log('File URL:', data.Location);
      const speakerResponse = await fetch(`http://localhost:3000/speaker?audioUrl=${data.Location}`);
      if (!speakerResponse.ok) {
        throw new Error('Network response was not ok');
      }
      const speakerData = await speakerResponse.json();
      setTranscriptionResult(speakerData);
      alert('File processed successfully.');
    } catch (err) {
      console.error('There was an error:', err.message);
      alert('Error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new ref to store the stream
const streamRef = useRef(null);

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

  const handleLogoClick = () => {
    if (isRecording) {
      stopRecordingAndUpload();
    } else {
      startRecording();
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h2 className={`fade-text ${fadeEffect ? '' : 'fade-out'}`}>
          {displayTextRef.current}
        </h2>
        <div className={`logo-wrapper ${isRecording ? 'breathing' : ''}`} onClick={handleLogoClick}>
          <img src={logo} className="App-logo" alt="logo" />
        </div>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <button 
            type="button" 
            onClick={handleButtonClick} 
            disabled={isLoading} 
            style={{ 
              opacity: isLoading ? 0.5 : 1, 
              position: 'relative',
              padding: '8px 16px',
              fontSize: '16px',
              overflow: 'hidden',
            }}
          >
                      <span style={{ visibility: isLoading ? 'hidden' : 'visible' }}>
              Upload MP3
            </span>
            {isLoading && (
              <div style={{ 
                position: 'absolute', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%, -50%)',
                zIndex: 2,
              }}>
                <ClipLoader size={15} color={"#123abc"} loading={true} />
              </div>
            )}
          </button>
          <input
            type="file"
            accept=".mp3"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            ref={fileInputRef}
          />
        </div>
        {transcriptionResult && (
          <div>
            <h3>Transcription Summary:</h3>
            <p>{transcriptionResult.analysis.summary}</p>
            <h3>Major Topics:</h3>
            <ul>
              {transcriptionResult.analysis.majorTopics.map((topic, index) => (
                <li key={index}>{Object.values(topic)[0]}</li>
              ))}
            </ul>
            <h3>Knowledge Gaps:</h3>
            <ul>
              {transcriptionResult.analysis.knowledgeGaps.map((gap, index) => (
                <li key={index}>{Object.values(gap)[0]}</li>
              ))}
            </ul>
            <h3>Detailed Transcription:</h3>
            {transcriptionResult.transcription.map((item, index) => (
              <div key={index}>
                <strong>{item.speaker}:</strong> {item.text}
              </div>
            ))}
          </div>
        )}
      </header>
    </div>
  );
}

export default App;