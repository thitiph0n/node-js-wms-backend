const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();

app.use(cors());

app.use(express.json());

app.use(morgan('tiny'));

app.use('/api/', require('./routes/authRouter'));

app.use('/api/users', require('./routes/usersRouter'));

app.use('/api/parcels', require('./routes/parcelsRouter'));

app.use('/api/warehouses', require('./routes/warehousesRouter'));

app.get('/', (req, res) => {
  return res.send({
    message: 'Welcome to WMS backend',
    version: 0.3,
    status: 'Up and Running',
  });
});

app.all('*', (req, res) => {
  res.status(404).send({
    errors: [{ message: 'Path not found' }],
  });
});

module.exports = { app };
