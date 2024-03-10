import React, { useState, useRef } from 'react';
import logo from './microphone.png';
import './App.css';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log(selectedFile);
    alert('File is ready to be processed. Implement upload logic.');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h2>Recall New</h2>
        <img src={logo} className="App-logo" alt="logo" />
        <form onSubmit={handleSubmit}>
          <input
            type="file"
            accept=".mp3"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            ref={fileInputRef}
          />
          <button type="button" onClick={handleButtonClick}>
            Choose MP3
          </button>
          <button type="submit">Upload MP3</button>
        </form>
      </header>
    </div>
  );
}

export default App;