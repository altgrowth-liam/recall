// const express = require('express');
// const bodyParser = require('body-parser');
// const cors = require('cors');
// const axios = require('axios');

// require('dotenv').config();

// const app = express();
// const port = 3000;

// app.use(cors());
// app.use(bodyParser.json());

// // Example route
// app.get('/', (req, res) => {
//     res.send('Hello World!');
// });

// app.get('/speaker', (req, res) => {
//   const apiKey = "39f2911cc92747f48fc783c98698ede0";
//   const audioUrl = "https://github.com/AssemblyAI-Examples/audio-examples/raw/main/20230607_me_canadian_wildfires.mp3";

//   const headers = {
//     "authorization": apiKey,
//     "content-type": "application/json"
//   };
//   const body = {
//     audio_url: audioUrl,
//     speaker_labels: true
//   };
  
//   axios.post('https://api.assemblyai.com/v2/transcript', body, { headers })
//     .then(response => {
//       const transcriptId = response.data.id;
//       console.log(`Transcription started with ID: ${transcriptId}`);
//       checkTranscriptionStatus(transcriptId);
//     })
//     .catch(error => console.error(error));
  
//   function checkTranscriptionStatus(transcriptId) {
//     const statusCheckUrl = `https://api.assemblyai.com/v2/transcript/${transcriptId}`;
//     axios.get(statusCheckUrl, { headers })
//       .then(response => {
//         if (response.data.status === 'completed') {
//           // Parsing the transcription to log speaker-wise text
//           parseAndLogSpeakerText(response.data);
//         } else if (response.data.status === 'failed') {
//           console.log('Transcription failed');
//         } else {
//           setTimeout(() => checkTranscriptionStatus(transcriptId), 5000);
//         }
//       })
//       .catch(error => console.error(error));
//   }
  
//   function parseAndLogSpeakerText(transcription) {
//     if (transcription.words && transcription.words.length > 0) {
//       const speakers = {}; // Object to hold speaker ID and their associated text
  
//       transcription.words.forEach(word => {
//         if (!speakers[word.speaker]) {
//           speakers[word.speaker] = [];
//         }
//         speakers[word.speaker].push(word.text);
//       });
  
//       Object.keys(speakers).forEach(speaker => {
//         console.log(`Speaker ${speaker}: ${speakers[speaker].join(' ')}`);
//       });
//     } else {
//       console.log('No speaker information found.');
//     }
//   }
// });

// app.listen(port, () => {
//   console.log(`Server is running on port: ${port}`);
// });

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');

require('dotenv').config();

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

// Example route
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/speaker', (req, res) => {
  const apiKey = "39f2911cc92747f48fc783c98698ede0";
  const audioUrl = "https://github.com/AssemblyAI-Examples/audio-examples/raw/main/20230607_me_canadian_wildfires.mp3";

  const headers = {
    "authorization": apiKey,
    "content-type": "application/json"
  };
  
  const body = {
    audio_url: audioUrl,
    speaker_labels: true
  };
  
  axios.post('https://api.assemblyai.com/v2/transcript', body, { headers })
    .then(response => {
      const transcriptId = response.data.id;
      console.log(`Transcription started with ID: ${transcriptId}`);
      return checkTranscriptionStatus(transcriptId);
    })
    .then(transcription => {
      res.json(parseAndLogSpeakerText(transcription));
    })
    .catch(error => {
      console.error(error);
      res.status(500).send('Error processing transcription');
    });
  
  function checkTranscriptionStatus(transcriptId) {
    return new Promise((resolve, reject) => {
      const attemptCheck = () => {
        axios.get(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, { headers })
          .then(response => {
            if (response.data.status === 'completed') {
              resolve(response.data);
            } else if (response.data.status === 'failed') {
              reject('Transcription failed');
            } else {
              setTimeout(attemptCheck, 5000);
            }
          })
          .catch(error => reject(error));
      };
      attemptCheck();
    });
  }
  
  function parseAndLogSpeakerText(transcription) {
    let result = [];
    if (transcription.words && transcription.words.length > 0) {
      let currentSpeaker = transcription.words[0].speaker;
      let currentText = "";
  
      transcription.words.forEach((word, index) => {
        if (word.speaker === currentSpeaker) {
          // If the word belongs to the current speaker, append it to the currentText
          currentText += word.text + " ";
        } else {
          // If the speaker changes, push the currentText to result and start a new text
          result.push({ speaker: `Speaker ${currentSpeaker}`, text: currentText.trim() });
          currentSpeaker = word.speaker;
          currentText = word.text + " ";
        }
  
        // For the last word, ensure it's added to the result
        if (index === transcription.words.length - 1) {
          result.push({ speaker: `Speaker ${currentSpeaker}`, text: currentText.trim() });
        }
      });
    } else {
      console.log('No speaker information found.');
    }
    return result;
  }
  
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});

