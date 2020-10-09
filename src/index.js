require('dotenv').config();
const { app } = require('./app');
const { port } = require('./configs');

const db = require('./helpers/db');

async function start() {
  const res = await db.testConnect();
  if (res.rows) {
    console.log('[DB]database connected!');
  }
}

app.listen(port, () => {
  console.log(`[SERVER]Listening on port ${port}!`);
});

start();
