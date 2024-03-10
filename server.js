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
  const audioUrl = "https://www.uclass.psychol.ucl.ac.uk/Release2/Conversation/AudioOnly/wav/M_1216_11y1m_1.wav";

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
              console.log(summarizeConversation(response.data));
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

  // function summarizeConversation(transcriptText) {
  //   const openAIUrl = 'https://api.openai.com/v1/chat/completions';
  
  //   const data = {
  //       model: "gpt-3.5-turbo", // Adjust with the latest or desired model
  //       prompt: `Summarize this conversation:\n\n${transcriptText}`,
  //       temperature: 0.5,
  //       max_tokens: 300,
  //       top_p: 1.0,
  //       frequency_penalty: 0.0,
  //       presence_penalty: 0.0,
  //   };
  
  //   const config = {
  //       headers: {
  //           'Authorization': `Bearer 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`,
  //           'Content-Type': 'application/json'
  //       }
  //   };
  
  //   return axios.post(openAIUrl, data, config)
  //       .then(response => response.data.choices[0].text.trim())
  //       .catch(error => {
  //           console.error("Error calling OpenAI API:", error);
  //           throw error;
  //       });
  // }
  async function summarizeConversation(transcriptText) {
    const apiUrl = 'https://api.openai.com/v1/chat/completions';
    const apiKey = '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';
    console.log("transcription text: " + transcriptText)
    try {
        const response = await axios.post(
            apiUrl,
            {
                messages: [
                    { role: 'system', content: "Summarize the following conversation: " + JSON.stringify(transcriptText) },
                ],
                model: 'gpt-4-turbo-preview', // Specify the model to use
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
            }
        );

        console.log('Chat completion response:', response.data.choices);
        return response.data.choices;
    } catch (error) {
        console.error('Error:', error.response.data);
    }
}
  
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});

// const express = require('express');
// const axios = require('axios');

// require('dotenv').config();

// const app = express();
// const port = 3000;

// app.use(express.json());

// const assemblyAIHeaders = {
//   "authorization": "39f2911cc92747f48fc783c98698ede0",
//   "content-type": "application/json"
// };

// app.get('/transcribe-summarize', (req, res) => {
//   const audioUrl = req.query.audioUrl; // Assuming audio URL is passed as a query parameter

//   if (!audioUrl) {
//     return res.status(400).send({ error: "No audio URL provided." });
//   }

//   // Transcribe audio and identify speakers
//   axios.post('https://api.assemblyai.com/v2/transcript', {
//     audio_url: audioUrl,
//     speaker_labels: true
//   }, { headers: assemblyAIHeaders })
//     .then(transcriptionResponse => {
//       const transcriptId = transcriptionResponse.data.id;
//       return checkTranscriptionStatus(transcriptId);
//     })
//     .then(transcription => {
//       // Once transcription is done, summarize the conversation
//       console.log(transcription);
//       return summarizeConversation(transcription)
//         .then(summary => ({ transcription, summary }));
//     })
//     .then(result => {
//       // Return both detailed transcription and summary
//       res.json(result);
//     })
//     .catch(error => {
//       console.error(error);
//       res.status(500).send('Error processing request');
//     });
// });

// function checkTranscriptionStatus(transcriptId) {
//   return new Promise((resolve, reject) => {
//     const attemptCheck = () => {
//       axios.get(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, { headers: assemblyAIHeaders })
//         .then(response => {
//           if (response.data.status === 'completed') {
//             resolve(response.data);
//           } else if (response.data.status === 'failed') {
//             reject('Transcription failed');
//           } else {
//             setTimeout(attemptCheck, 5000);
//           }
//         })
//         .catch(error => reject(error));
//     };
//     attemptCheck();
//   });
// }

// function summarizeConversation(transcriptText) {
//   const openAIUrl = 'https://api.openai.com/v1/completions';

//   const data = {
//       model: "text-davinci-003", // Adjust with the latest or desired model
//       prompt: `Summarize this conversation:\n\n${transcriptText}`,
//       temperature: 0.5,
//       max_tokens: 300,
//       top_p: 1.0,
//       frequency_penalty: 0.0,
//       presence_penalty: 0.0,
//   };

//   const config = {
//       headers: {
//           'Authorization': `Bearer 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`,
//           'Content-Type': 'application/json'
//       }
//   };

//   return axios.post(openAIUrl, data, config)
//       .then(response => response.data.choices[0].text.trim())
//       .catch(error => {
//           console.error("Error calling OpenAI API:", error);
//           throw error;
//       });
// }

// app.listen(port, () => {
//   console.log(`Server running at http://localhost:${port}`);
// });


