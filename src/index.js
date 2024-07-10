import { createNodeMiddleware } from '@octokit/webhooks';
import http from 'http';
import { App } from 'octokit';
import config from './config';
import { VertexAIService } from './services/aiService/vertexAIService';
import { AdaService } from './services/aiService/adaService';
import logger from './utils/logger.js';
import { setupWebhooks } from './webhooks.js';

// Load environment variables
// dotenv.config();

async function main() {
  // setupLogging();

  logger.info('Starting application...');

  // Log configuration (be careful not to log sensitive information)
  logger.info(
    `Configuration: appId=${config.APP_ID}, port=${
      config.PORT
    }, webhookSecret=${config.WEBHOOK_SECRET ? 'set' : 'not set'}`
  );

  if (!config.PRIVATE_KEY) {
    logger.error('Private key is not set');
    process.exit(1);
  }

  const app = new App({
    appId: config.APP_ID,
    privateKey: config.PRIVATE_KEY,
    webhooks: {
      secret: config.WEBHOOK_SECRET,
    },
  });

  // Log the authenticated app's name
  try {
    const { data } = await app.octokit.request('/app');
    logger.info(`Authenticated as '${data.name}'`);
  } catch (error) {
    logger.error('Failed to authenticate app', {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }

  logger.info('Setting up webhooks...');
  let aiService;
  if (config.AI_PROVIDER == 'vertexai') {
    aiService = new VertexAIService();
  } else if (config.AI_PROVIDER == 'ada') {
    aiService = new AdaService();
  }
  setupWebhooks(app, aiService);

  // Create and start the server
  const localWebhookUrl = `http://localhost:${config.PORT}/`;
  const middleware = createNodeMiddleware(app.webhooks, { path: '/webhook' });

  const server = http.createServer(middleware);
  server.listen(config.PORT, () => {
    logger.info(`Server is listening for events at: ${localWebhookUrl}`);
    logger.info('Press Ctrl + C to quit.');
  });

  server.on('error', (error) => {
    logger.error('Server error', { error: error.message, stack: error.stack });
  });
}

main().catch((error) => {
  logger.error('Unhandled error in main function', {
    error: error.message,
    stack: error.stack,
    service: 'github-app',
  });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});
