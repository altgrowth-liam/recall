const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

// Example route
app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
