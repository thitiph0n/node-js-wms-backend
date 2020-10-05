const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());

app.use(express.json());

app.all('*', (req, res) => {
  res.status(404).send({
    message: 'Not found',
  });
});

module.exports = { app };
