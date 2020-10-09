const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());

app.use(express.json());

app.use('/api/', require('./routes/authRouter'));
app.use('/api/users', require('./routes/usersRouter'));

app.all('*', (req, res) => {
  res.status(404).send({
    errors: [{ message: 'Not found' }],
  });
});

module.exports = { app };
