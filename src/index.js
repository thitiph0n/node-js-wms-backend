if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const { app } = require('./app');
const { port } = require('./configs');

const db = require('./helpers/db');

async function start() {
  try {
    const res = await db.testConnect();
    if (res.rows) {
      console.log('[DB]database connected!');
    }
  } catch (error) {
    console.error(`[DB] ${error.message}`);
  }
}

app.listen(port, () => {
  console.log(`[SERVER]Listening on port ${port}!`);
});

start();
