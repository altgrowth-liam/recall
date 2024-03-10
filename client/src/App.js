import React, { useState, useRef } from 'react';
import logo from './microphone.png';
import './App.css';
import AWS from 'aws-sdk';
import { ClipLoader } from 'react-spinners'; // Importing a spinner

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
  const [transcriptionResult, setTranscriptionResult] = useState(null); // State to store the transcription result
  const fileInputRef = useRef(null);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    await handleSubmit(file); // Pass the file directly to handleSubmit
  };

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async (file) => {
    if (!file) {
      alert('Please select a file first.');
      return;
    }

    setIsLoading(true); // Start loading

    const params = {
      Bucket: 'recallbucket',
      Key: `uploads/${file.name}`,
      Body: file,
      ACL: 'public-read',
    };

    try {
      const data = await s3.upload(params).promise();
      console.log('File URL:', data.Location);
      // After successful upload, make a GET request to the `/speaker` route
      const speakerResponse = await fetch(`http://localhost:3000/speaker?audioUrl=${data.Location}`);
      if (!speakerResponse.ok) {
        throw new Error('Network response was not ok');
      }
      const speakerData = await speakerResponse.json();
      setTranscriptionResult(speakerData); // Store the response data in state
      alert('File processed successfully.');
    } catch (err) {
      console.error('There was an error:', err.message);
      alert('Error: ' + err.message);
    } finally {
      setIsLoading(false); // End loading
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h2>Recall</h2>
        <img src={logo} className="App-logo" alt="logo" />
        {isLoading ? (
          <ClipLoader size={150} color={"#123abc"} loading={isLoading} />
        ) : (
          <form onSubmit={(e) => e.preventDefault()}>
            <input
              type="file"
              accept=".mp3"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              ref={fileInputRef}
            />
            <button type="button" onClick={handleButtonClick}>
              Upload & Publish MP3
            </button>
          </form>
        )}
        {transcriptionResult && (
          <div>
            <h3>Transcription Summary:</h3>
            <p>{transcriptionResult.summary}</p>
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