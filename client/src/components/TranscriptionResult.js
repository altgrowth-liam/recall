import React from "react";

const TranscriptionResult = ({ transcriptionResult }) => {
    return (
      <div className="analysis-container slide-in">
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
    );
};

export default TranscriptionResult;