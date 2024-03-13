const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const AWS = require('aws-sdk');
const { OpenAI } = require('openai');

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

// Initialize OpenAI
const openai = new OpenAI(process.env.OPENAI_API_KEY);

app.use(cors());
app.use(bodyParser.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));

// Import and use routes
require('./routes')(app, upload, openai, s3);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname+'/client/build/index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});