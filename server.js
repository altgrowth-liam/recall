const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
// const { OpenAI } = require('openai');
const path = require('path');
const multer = require('multer');
const AWS = require('aws-sdk');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

// Multer setup for file uploads
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(bodyParser.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));

// New upload route
app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const params = {
    Bucket: 'recallbucket', // Use your bucket name
    Key: `uploads/${req.file.originalname}`,
    Body: req.file.buffer,
    ACL: 'public-read',
  };

  try {
    const data = await s3.upload(params).promise();
    console.log('File uploaded successfully. Location:', data.Location);
    res.json({ location: data.Location });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).send('Error uploading file.');
  }
});

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
      return res.status(400).json({ error: "No transcription text found. Please provide a clear audio source." });
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
                    "The response should be in the follow format: { \"summary\": \"Summary...\", \"majorTopics\": [ {\"topic1\": \"Topic 1..\"}, {\"topic2\": \"Topic 2..\"}], \"knowledgeGaps\": [ {\"gap1\": \"Gap 1..\"}, {\"gap2\": \"Gap 2..\"}]} \n " +
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

        return JSON.parse(response.data.choices[0].message.content);
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