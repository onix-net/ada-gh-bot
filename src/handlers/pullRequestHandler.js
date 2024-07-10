// src/handlers/pullRequestHandler.js

import config from '../config';
import { AppError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import { rateLimiter } from '../utils/rateLimiter.js';

export class PullRequestHandler {
  constructor(aiService, githubService) {
    this.aiService = aiService;
    this.githubService = githubService;
  }

  @rateLimiter()
  async handle(context) {
    const { payload } = context;
    const owner = payload.repository.owner.login;
    const repo = payload.repository;
    const pullNumber = payload.pull_request.number;
    const action = payload.action;
    const uniqueId = `${owner}-${repo.name}-${issueNumber}`;

    logger.info('Processing pull request event', {
      owner,
      repo: repo.name,
      pullNumber,
      action,
    });

    try {
      switch (action) {
        case 'opened':
          await this.handlePullRequestOpened(
            owner,
            repo,
            pullNumber,
            payload.pull_request
          );
          break;
        case 'synchronize':
          await this.handlePullRequestUpdated(owner, repo, pullNumber);
          break;
        case 'closed':
          await this.handlePullRequestClosed(
            owner,
            repo,
            pullNumber,
            payload.pull_request
          );
          break;
        // Add more cases as needed
        default:
          logger.info(`Unhandled pull request action: ${action}`);
      }
    } catch (error) {
      this.handleError(error, owner, repo, pullNumber);
    }
  }

  async handlePullRequestOpened(owner, repo, pullNumber, pullRequest) {
    logger.info('Handling opened pull request', { owner, repo, pullNumber });

    // Get the pull request diff
    const diffData = await this.githubService.getPullRequestDiff(
      owner,
      repo,
      pullNumber
    );

    // Prepare context for AI
    const aiContext = this.buildAiContext(pullRequest, diffData);

    const projectID = await this.aiService.getContext(uniqueId);

    // Get AI response
    const aiResponse = await this.aiService.getResponse(aiContext, projectID);

    // Post initial comment
    await this.githubService.createComment(owner, repo, pullNumber, aiResponse);

    // Optionally, add labels or assign reviewers
    await this.addInitialLabels(owner, repo, pullNumber);
    await this.assignReviewers(owner, repo, pullNumber);
  }

  async handlePullRequestUpdated(owner, repo, pullNumber) {
    logger.info('Handling updated pull request', { owner, repo, pullNumber });

    // Get the latest diff
    const diffData = await this.githubService.getPullRequestDiff(
      owner,
      repo,
      pullNumber
    );

    // Analyze changes and potentially comment or update labels
    // This is a placeholder for more complex logic
    await this.analyzeChanges(owner, repo, pullNumber, diffData);
  }

  async handlePullRequestClosed(owner, repo, pullNumber, pullRequest) {
    logger.info('Handling closed pull request', { owner, repo, pullNumber });

    if (pullRequest.merged) {
      await this.githubService.createComment(
        owner,
        repo,
        pullNumber,
        'This pull request has been merged. Thank you for your contribution!'
      );
      // Optionally, trigger any post-merge actions here
    } else {
      await this.githubService.createComment(
        owner,
        repo,
        pullNumber,
        'This pull request has been closed without merging. Let us know if you need any further assistance.'
      );
    }
  }

  buildAiContext(pullRequest, diffData) {
    return `
    Pull Request:
    Title: ${pullRequest.title}
    Description: ${pullRequest.body}

    Changes:
    ${diffData}

    Please review this pull request and provide:
    1. A summary of the changes
    2. Any potential issues or improvements
    3. Suggestions for testing
    `;
  }

  async addInitialLabels(owner, repo, pullNumber) {
    // Add default labels, e.g., 'needs review'
    await this.githubService.addLabel(owner, repo, pullNumber, [
      'needs review',
    ]);
  }

  async assignReviewers(owner, repo, pullNumber) {
    // Logic to assign reviewers
    // This could involve looking at the files changed and assigning based on expertise
    // For now, we'll just log a placeholder message
    logger.info('Assigning reviewers logic would go here', {
      owner,
      repo,
      pullNumber,
    });
  }

  async analyzeChanges(owner, repo, pullNumber, diffData) {
    // Analyze the changes and potentially comment or update labels
    // This is a placeholder for more complex logic
    logger.info('Analyzing changes', { owner, repo, pullNumber });

    // Example: If the diff is large, add a 'large-change' label
    if (diffData.length > 1000) {
      // arbitrary threshold
      await this.githubService.addLabel(owner, repo, pullNumber, [
        'large-change',
      ]);
    }
  }

  handleError(error, owner, repo, pullNumber) {
    if (error instanceof AppError) {
      logger.error(
        `Application error in PullRequestHandler: ${error.message}`,
        {
          error,
          owner,
          repo,
          pullNumber,
        }
      );
    } else {
      logger.error(`Unexpected error in PullRequestHandler: ${error.message}`, {
        error,
        owner,
        repo,
        pullNumber,
      });
    }

    // Optionally, you could post a comment to the pull request indicating that an error occurred
    this.githubService
      .createComment(
        owner,
        repo,
        pullNumber,
        "I'm sorry, but I encountered an error while processing this pull request. Please try again later or contact the maintainers if the problem persists."
      )
      .catch((commentError) => {
        logger.error('Failed to post error comment', {
          commentError,
          owner,
          repo,
          pullNumber,
        });
      });
  }
}
