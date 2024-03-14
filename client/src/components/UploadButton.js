import React from 'react';
import { ClipLoader } from 'react-spinners';

const UploadButton = ({ isLoading, handleFileChange, handleButtonClick, fileInputRef }) => {
    return (
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
            <ClipLoader size={15} color={"#123abc"} loading={true} style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 2,
            }} />
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
    );
};

export default UploadButton;