import React from 'react';

const UploadButton = ({ isLoading, isRecording, handleFileChange, handleButtonClick, fileInputRef }) => {
    const buttonClass = isLoading || isRecording ? 'upload-button upload-button-disabled' : 'upload-button';
    return (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <button
          type="button"
          className={buttonClass}
          onClick={handleButtonClick}
          disabled={isLoading || isRecording}
        >
          <span>
            Upload MP3
          </span>
        </button>
        <input
          type="file"
          accept=".mp3"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          ref={fileInputRef}
        />
      </div>
    );
};

export default UploadButton;