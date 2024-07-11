// src/config/index.js

// import dotenv from 'dotenv';

// Load environment variables from .env file
// dotenv.config();

const config = {
  // GitHub App Configuration
  APP_ID: process.env.APP_ID || '869280',
  PRIVATE_KEY: process.env.ADA_GH_APP_PRIVATE_KEY,
  WEBHOOK_SECRET: process.env.ADA_GH_APP_SECRET,

  // AI Service Configuration
  AI_PROJECT_ID: process.env.AI_PROJECT_ID || 'foo',
  AI_PROVIDER: process.env.AI_PROVIDER || 'vertexai',

  // Ada-specific configuration
  ADA_API_URL: process.env.ADA_API_URL || 'https://ada-api.containerlabs.io',
  ADA_API_KEY: process.env.ADA_API_KEY,

  // Vertexai-specific configuration
  VERTEX_AI_PROJECT: process.env.VERTEX_AI_PROJECT || 'onix-duet',

  // Application Configuration
  PORT: process.env.PORT || 9900,
  NODE_ENV: process.env.NODE_ENV || 'development',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  // Rate Limiting Configuration
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute

  // Bot Configuration
  BOT_NAME: process.env.BOT_NAME || 'onix-parrot',

  // Feature Flags
  ENABLE_PR_REVIEW: process.env.ENABLE_PR_REVIEW === 'true',
  ENABLE_ISSUE_TRIAGE: process.env.ENABLE_ISSUE_TRIAGE === 'true',

  // Add any other configuration variables your app needs
};

// Validate required configuration
const requiredConfig = ['PRIVATE_KEY', 'WEBHOOK_SECRET'];
for (const key of requiredConfig) {
  if (!config[key]) {
    throw new Error(`Missing required configuration: ${key}`);
  }
}

export default config;
