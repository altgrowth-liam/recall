import React from 'react';
import logo from '../microphone.png';

const RecordButton = ({ isRecording, startRecording, stopRecordingAndUpload }) => {
    return (
      <div className={`logo-wrapper ${isRecording ? 'breathing' : ''}`} onClick={isRecording ? stopRecordingAndUpload : startRecording}>
        <img src={logo} className="App-logo" alt="logo" />
      </div>
    );
};

export default RecordButton;