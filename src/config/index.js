// src/config/index.js

// import dotenv from 'dotenv';

// Load environment variables from .env file
// dotenv.config();

const config = {
  // GitHub App Configuration
  APP_ID: process.env.APP_ID || '869280',
  PRIVATE_KEY: process.env.ADA_GH_APP_PRIVATE_KEY,
  WEBHOOK_SECRET: process.env.ADA_GH_APP_SECRET,
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || '',
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || '',

  // AI Service Configuration
  AI_SERVICE: process.env.AI_SERVICE || 'anthropic', // Default to Anthropic
  AI_API_KEY: process.env.ADA_API_KEY,
  AI_PROJECT_ID: process.env.AI_PROJECT_ID,

  // Anthropic-specific configuration
  ANTHROPIC_API_URL:
    process.env.ANTHROPIC_API_URL || 'https://api.anthropic.com',
  ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL || 'claude-2',

  // OpenAI-specific configuration
  OPENAI_API_URL: process.env.OPENAI_API_URL || 'https://api.openai.com',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',

  // Application Configuration
  PORT: process.env.PORT || 9900,
  NODE_ENV: process.env.NODE_ENV || 'development',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  // Rate Limiting Configuration
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute

  // Bot Configuration
  BOT_NAME: process.env.BOT_NAME || 'github-ai-bot',

  // Feature Flags
  ENABLE_PR_REVIEW: process.env.ENABLE_PR_REVIEW === 'true',
  ENABLE_ISSUE_TRIAGE: process.env.ENABLE_ISSUE_TRIAGE === 'true',

  // Add any other configuration variables your app needs
};

// Validate required configuration
const requiredConfig = ['PRIVATE_KEY', 'WEBHOOK_SECRET', 'AI_API_KEY'];
for (const key of requiredConfig) {
  if (!config[key]) {
    throw new Error(`Missing required configuration: ${key}`);
  }
}

export default config;
