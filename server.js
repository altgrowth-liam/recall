const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
// const { OpenAI } = require('openai');


require('dotenv').config();

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

// const openai = new OpenAI({
//   apiKey: "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",
// });

// Example route
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/speaker', async (req, res) => {
  const apiKey = "39f2911cc92747f48fc783c98698ede0";
  // const audioUrl = "https://www.uclass.psychol.ucl.ac.uk/Release2/Conversation/AudioOnly/wav/M_1216_11y1m_1.wav";
  const audioUrl = req.query.audioUrl;

  const headers = {
    "authorization": apiKey,
    "content-type": "application/json"
  };
  
  const body = {
    audio_url: audioUrl,
    speaker_labels: true
  };
  
  // axios.post('https://api.assemblyai.com/v2/transcript', body, { headers })
  //   .then(response => {
  //     const transcriptId = response.data.id;
  //     console.log(`Transcription started with ID: ${transcriptId}`);
  //     return checkTranscriptionStatus(transcriptId);
  //   })
  //   .then(transcription => {
  //     res.json(parseAndLogSpeakerText(transcription));
  //   })
  //   .catch(error => {
  //     console.error(error);
  //     res.status(500).send('Error processing transcription');
  //   });
  try {
    const startTranscriptionResponse = await axios.post('https://api.assemblyai.com/v2/transcript', body, { headers });
    const transcriptId = startTranscriptionResponse.data.id;
    console.log(`Transcription started with ID: ${transcriptId}`);

    const transcription = await checkTranscriptionStatus(transcriptId);
    const parsedTranscription = parseAndLogSpeakerText(transcription);

    // Since summarizeConversation is async, await its result before sending the response
    const summary = await summarizeConversation(parsedTranscription);
    res.json({
      transcription: parsedTranscription,
      summary: summary
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing transcription');
  }
  
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
    console.log(summarizeConversation(result));
    return result;
  }
    async function summarizeConversation(transcriptText) {
      const apiUrl = 'https://api.openai.com/v1/chat/completions';
      const apiKey = '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';
      console.log("transcription text: " + JSON.stringify(transcriptText))
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


  async function summarizeConversationSDK(transcriptText) {
    try {
        const chatCompletion = await openai.chat.completions.create({  // Use v1/chat/completions
          model: 'gpt-4-turbo-preview',
          messages: [
            { role: 'user', content: "Summarize the following conversation: " + JSON.stringify(transcriptText) },
          ],
        });

        console.log('Chat completion response:', chatCompletion.data.choices);
        return chatCompletion.data.choices;
    } catch (error) {
        console.error('Error:', error.response.data);
    }
  }
  });

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});




