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
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <button 
            type="button" 
            onClick={handleButtonClick} 
            disabled={isLoading} 
            style={{ 
              opacity: isLoading ? 0.5 : 1, 
              position: 'relative',
              padding: '8px 16px', // Adjust padding as needed to fit the text
              fontSize: '16px', // Adjust font size as needed
              overflow: 'hidden', // Ensures the loader does not extend the button size
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
                zIndex: 2, // Ensure the loader is above the text
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