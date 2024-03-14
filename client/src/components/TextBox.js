import React, { useState, useEffect } from 'react';

const TextBox = ({ isRecording, isLoading, slideshowMessages }) => {
    function useDisplayTextWithFade({ isRecording, isLoading, slideshowMessages }) {
      const [displayText, setDisplayText] = useState(slideshowMessages[0]);
      const [opacity, setOpacity] = useState(0); // Start with opacity 0 for fade-in effect
      const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  
      useEffect(() => {
        // Immediately start the fade-in effect to match the 0.5s transition
        setOpacity(1);

        let intervalId;

        if (isRecording || isLoading) {
          const message = isRecording ? 'Listening...' : 'Recalling...';
          setOpacity(0); // Start fade-out
          setTimeout(() => {
            setDisplayText(message);
            setOpacity(1); // Fade back in
          }, 500); // This matches the transition duration
        } else {
          intervalId = setInterval(() => {
            setOpacity(0); // Start fade-out
            setTimeout(() => {
              setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % slideshowMessages.length);
              setDisplayText(slideshowMessages[(currentMessageIndex + 1) % slideshowMessages.length]);
              setOpacity(1); // Fade back in
            }, 500); // This matches the transition duration
          }, 2500); // Adjust interval as needed
        }
  
        return () => {
          clearInterval(intervalId);
        };
      }, [isRecording, isLoading, slideshowMessages, currentMessageIndex]);
  
      return { displayText, opacity };
    }
  
    const { displayText, opacity } = useDisplayTextWithFade({ isRecording, isLoading, slideshowMessages });
  
    return (
      <h2 style={{ opacity: opacity, transition: 'opacity 0.5s ease' }}>
        {displayText}
      </h2>
    );
};

export default TextBox;