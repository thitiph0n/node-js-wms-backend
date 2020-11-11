let poolConfig, port;

switch (process.env.NODE_ENV) {
  case 'production':
    console.log('Production ENV');
    poolConfig = {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    };
    port = process.env.PORT;

    break;
  case 'development':
    console.log('[Development ENV]');
    poolConfig = {
      connectionString: process.env.DEV_DATABASE_URL,
    };
    port = 5000;

    break;
  case 'test':
    console.log('[Test ENV]');
    poolConfig = {
      connectionString: process.env.TEST_DATABASE_URL,
    };
    port = 5000;

    break;
  default:
    console.log('error');
    break;
}

module.exports = { poolConfig, port };
