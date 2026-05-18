'use strict';

require('dotenv').config();

const app = require('./src/app');
const { sequelize } = require('./src/models');

const PORT = parseInt(process.env.PORT) || 3000;

async function bootstrap() {
  try {
    // Test DB connection and sync models (use migrations in production)
    await sequelize.authenticate();
    console.log('[DB] Connection established');

    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
      console.log('[DB] Models synced');
    }

    app.listen(PORT, () => {
      console.log(`[Server] Listening on http://localhost:${PORT}`);
      console.log(`[Docs]   Swagger UI: http://localhost:${PORT}/api-docs`);
    });
  } catch (err) {
    console.error('[Bootstrap] Failed to start:', err);
    process.exit(1);
  }
}

bootstrap();
