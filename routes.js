const axios = require('axios');

module.exports = function(app, upload, openai, s3) {
  // Upload route
  app.post('/upload', upload.single('file'), async (req, res) => {
    console.log('\n\n==================== NEW REQUEST: /upload ====================\n');
    if (!req.file) {
      console.log('Upload attempt with no file.');
      return res.status(400).send('No file uploaded.');
    }

    const params = {
      Bucket: 'recallbucket', // Use your bucket name
      Key: `uploads/${req.file.originalname}`,
      Body: req.file.buffer,
      ACL: 'public-read',
    };

    console.log(`Attempting to upload file: ${req.file.originalname}`);

    try {
      const data = await s3.upload(params).promise();
      console.log('File uploaded successfully. Location:', data.Location);
      res.json({ location: data.Location });
    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).send('Error uploading file.');
    }
  });

  // Transcribe route
  app.post('/transcribe', async (req, res) => {
    console.log('\n\n==================== NEW REQUEST: /transcribe ====================\n');
    const audioUrl = req.body.audioUrl;
    console.log(`Transcription request received for URL: ${audioUrl}`);

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
      console.log(`Transcription started with ID: ${transcriptId}`);

      const transcription = await checkTranscriptionStatus(transcriptId);
      res.json(transcription);
    } catch (error) {
      console.error("Error starting transcription", error);
      res.status(500).send('Error starting transcription');
    }
  });

  // Summarize route
  app.post('/summarize', async (req, res) => {
    const transcriptText = req.body.transcriptText;
    console.log('\n\n==================== NEW REQUEST: /summarize ====================\n');

    try {
      const summary = await summarizeConversation(transcriptText);
      console.log('Summarization completed successfully.');
      res.json(summary);
    } catch (error) {
      console.error('Error during conversation summarization:', error);
      res.status(500).send('Failed to summarize conversation');
    }
  });

  // Helper function to check transcription status
  async function checkTranscriptionStatus(transcriptId) {
    const headers = {
      "authorization": process.env.ASSEMBLY_API_KEY,
      "content-type": "application/json"
    };

    console.log(`Checking transcription status for ID: ${transcriptId}`);

    return new Promise((resolve, reject) => {
      const attemptCheck = () => {
        axios.get(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, { headers })
          .then(response => {
            console.log(`Transcription status for ID ${transcriptId}: ${response.data.status}`);
            if (response.data.status === 'completed') {
              console.log(`Transcription completed for ID: ${transcriptId}`);
              resolve(response.data);
            } else if (response.data.status === 'failed') {
              console.error(`Transcription failed for ID: ${transcriptId}`);
              reject('Transcription failed');
            } else {
              setTimeout(attemptCheck, 5000);
            }
          })
          .catch(error => {
            console.error("Error checking transcription status", error);
            reject(error);
          });
      };
      attemptCheck();
    });
  }

  // Updated summarizeConversation function
  async function summarizeConversation(transcriptText) {
    console.log('Starting conversation summarization.');

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          { role: 'system', content: "Can you do the following with the below text: \n " +
            "1. Return a summary of the conversation \n " +
            "2. Return a list of major topics within the conversation \n " + 
            "3. Return a list of possible gaps in knowledge from one of the speakers. \n " +
            "The response should be in the follow format: { \"summary\": \"Summary...\", \"majorTopics\": [ {\"topic1\": \"Topic 1..\"}, {\"topic2\": \"Topic 2..\"}], \"knowledgeGaps\": [ {\"gap1\": \"Gap 1..\"}, {\"gap2\": \"Gap 2..\"}]} \n " +
            "Here is the text: " + JSON.stringify(transcriptText) }
        ],
      });

      console.log('Conversation summarization completed.');
      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error('Error during conversation summarization:', error);
      throw new Error('Failed to summarize conversation');
    }
  }
};