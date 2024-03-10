import React, { useState, useRef } from 'react';
import logo from './microphone.png';
import './App.css';
import AWS from 'aws-sdk';
import { ClipLoader } from 'react-spinners'; // Importing a spinner


AWS.config.update({
  accessKeyId: 'AKIA5EETVYKJKUFIN44G',
  secretAccessKey: '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',
  region: 'us-west-2',
});

const s3 = new AWS.S3();

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    await handleSubmit(file); // Pass the file directly to handleSubmit
  };

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async (file) => { // Adjust to accept a file parameter
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
      alert('File uploaded successfully. URL: ' + data.Location);
    } catch (err) {
      console.error('There was an error uploading your file:', err.message);
      alert('Error uploading file: ' + err.message);
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
          <ClipLoader size={10} color={"#123abc"} loading={isLoading} /> // Using ClipLoader spinner
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
      </header>
    </div>
  );
}

export default App;