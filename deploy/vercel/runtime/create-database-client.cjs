'use strict';

const createDatabaseClient = (environment) => {
  const { Client } = require('/app/node_modules/pg');
  return new Client({
    connectionString: environment.PG_DATABASE_URL,
    connectionTimeoutMillis: 15000,
    query_timeout: 15000,
    application_name: 'twenty-vercel-runtime',
    keepAlive: true,
  });
};

module.exports = { createDatabaseClient };
