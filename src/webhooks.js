// src/webhooks.js

import { createHandlers } from './handlers/index.js';
import GitHubService from './services/githubService.js';
import logger from './utils/logger.js';

export function setupWebhooks(app, aiService) {
  // Generic logging for all webhook events
  app.webhooks.onAny(async ({ id, name, payload }) => {
    logger.info(`Received webhook event`, {
      id,
      name,
      action: payload.action,
      repo: payload.repository?.full_name,
      sender: payload.sender?.login,
    });
  });

  // Pull Request events
  app.webhooks.on(
    [
      'pull_request.opened',
      'pull_request.reopened',
      'pull_request.synchronize',
      'pull_request.closed',
    ],
    (context) => {
      const githubService = new GitHubService(context.octokit);
      const handlers = createHandlers(aiService, githubService);
      return handlers.pullRequest.handle(context);
    }
  );

  // Pull Request Review Comment events
  app.webhooks.on('pull_request_review_comment.created', (context) => {
    const githubService = new GitHubService(context.octokit);
    const handlers = createHandlers(aiService, githubService);
    return handlers.pullRequestReviewComment.handle(context);
  });

  // Issue events
  app.webhooks.on('issues.opened', (context) => {
    const githubService = new GitHubService(context.octokit);
    const handlers = createHandlers(aiService, githubService);
    return handlers.issueOpened.handle(context);
  });

  app.webhooks.on('issue_comment.created', (context) => {
    const githubService = new GitHubService(context.octokit);
    const handlers = createHandlers(aiService, githubService);
    return handlers.issueComment.handle(context);
  });

  // Label events
  app.webhooks.on(
    [
      'issues.labeled',
      'issues.unlabeled',
      'pull_request.labeled',
      'pull_request.unlabeled',
    ],
    (context) => {
      const githubService = new GitHubService(context.octokit);
      const handlers = createHandlers(aiService, githubService);
      return handlers.label.handle(context);
    }
  );

  // Pull Request Review Requested event
  app.webhooks.on('pull_request_review.requested', async (context) => {
    const githubService = new GitHubService(context.octokit);
    const handlers = createHandlers(aiService, githubService);

    const { payload } = context;

    logger.info(`Processing pull_request_review.requested event`, {
      pr: payload.pull_request.number,
      repo: payload.repository.full_name,
      reviewer: payload.requested_reviewer.login,
    });

    if (payload.requested_reviewer.login === githubService.botName) {
      try {
        await handlers.pullRequest.handleReviewRequested(context);
      } catch (error) {
        logger.error('Error handling PR review request', {
          error,
          pullRequestNumber: payload.pull_request.number,
        });
      }
    } else {
      logger.info('Review not requested for bot, skipping processing');
    }
  });

  // Error handling for webhook events
  app.webhooks.onError((error) => {
    logger.error('Webhook error', { error: error.message, stack: error.stack });
  });
}
