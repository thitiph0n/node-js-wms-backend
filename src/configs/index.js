const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
};

const port = process.env.PORT || 5000;

module.exports = { poolConfig, port };
