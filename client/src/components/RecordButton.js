import React from 'react';
import logo from '../microphone.png';

const RecordButton = ({ isRecording, isLoading, startRecording, stopRecordingAndUpload }) => {
    // Button is disabled only when isLoading is true
    const isDisabled = isLoading;
    return (
      <div className={`logo-wrapper ${isRecording ? 'breathing' : ''} ${isDisabled ? 'disabled' : ''}`} onClick={!isDisabled ? (isRecording ? stopRecordingAndUpload : startRecording) : undefined}>
        <img src={logo} className="App-logo" alt="logo" />
      </div>
    );
};

export default RecordButton;