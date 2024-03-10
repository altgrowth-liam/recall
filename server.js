const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
// const { OpenAI } = require('openai');
const path = require('path');


require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));

app.get('/speaker', async (req, res) => {
  const audioUrl = req.query.audioUrl;

  const headers = {
    "authorization": process.env.ASSEMBLY_API_KEY,
    "content-type": "application/json"
  };
  
  const body = {
    audio_url: audioUrl,
    speaker_labels: true
  };
  
  try {
    const startTranscriptionResponse = await axios.post('https://api.assemblyai.com/v2/transcript', body, { headers });
    const transcriptId = startTranscriptionResponse.data.id;
    console.log(`Transcription started with ID: ${transcriptId}`); // Critical for tracking transcription start

    const transcription = await checkTranscriptionStatus(transcriptId);
    const parsedTranscription = parseAndLogSpeakerText(transcription);
    if (parsedTranscription.length === 0) {
      console.error("No transcription text found."); // Critical for debugging empty transcriptions
      return res.status(400).json({ error: "No transcription text found. Please provide a valid audio source." });
    }

    const summary = await summarizeConversation(parsedTranscription);
    res.json({
      transcription: parsedTranscription,
      analysis: summary
    });
  } catch (error) {
    console.error("Error processing transcription", error); // Critical for debugging failed transcriptions
    res.status(500).send('Error processing transcription');
  }
  
  function checkTranscriptionStatus(transcriptId) {
    return new Promise((resolve, reject) => {
      const attemptCheck = () => {
        axios.get(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, { headers })
          .then(response => {
            if (response.data.status === 'completed') {
              console.log(`Transcription completed for ID: ${transcriptId}`); // Critical for tracking completion
              resolve(response.data);
            } else if (response.data.status === 'failed') {
              console.error(`Transcription failed for ID: ${transcriptId}`); // Critical for debugging failed transcriptions
              reject('Transcription failed');
            } else {
              setTimeout(attemptCheck, 5000);
            }
          })
          .catch(error => {
            console.error("Error checking transcription status", error); // Critical for debugging status check errors
            reject(error);
          });
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
          currentText += word.text + " ";
        } else {
          result.push({ speaker: `Speaker ${currentSpeaker}`, text: currentText.trim() });
          currentSpeaker = word.speaker;
          currentText = word.text + " ";
        }
  
        if (index === transcription.words.length - 1) {
          result.push({ speaker: `Speaker ${currentSpeaker}`, text: currentText.trim() });
        }
      });
    } else {
      console.log('No speaker information found.'); // Useful for debugging missing speaker data
    }
    return result;
  }
    async function summarizeConversation(transcriptText) {
      const apiUrl = 'https://api.openai.com/v1/chat/completions';
      try {
          const response = await axios.post(
              apiUrl,
              {
                  messages: [
                      { role: 'system', content: "Can you do the following with the below text: \n " +
                      "1. Return a summary of the conversation \n " +
                      "2. Return a list of major topics within the conversation \n " + 
                      "3. Return a list of possible gaps in knowledge from one of the speakers. \n" +
                      "Here is the text: " + JSON.stringify(transcriptText) },
                  ],
                  model: 'gpt-4-turbo-preview',
              },
              {
                  headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                  },
              }
          );

          return JSON.parse(response.data.choices[0].content);
        } catch (error) {
            console.error('Error during conversation summarization:', error); // Critical for debugging summarization errors
            throw new Error('Failed to summarize conversation');
        }
    }
  });
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname+'/client/build/index.html'));
  });
  
  app.listen(port, () => {
    console.log(`Server is running on port: ${port}`); // Critical for confirming server startup
  });