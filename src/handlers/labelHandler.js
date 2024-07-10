// src/handlers/labelHandler.js

import config from '../config';
import { AppError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import { rateLimiter } from '../utils/rateLimiter.js';

export class LabelHandler {
  constructor(aiService, githubService) {
    this.aiService = aiService;
    this.githubService = githubService;
  }

  @rateLimiter()
  async handle(context) {
    const { payload } = context;
    const owner = payload.repository.owner.login;
    const repo = payload.repository;
    const issueNumber = payload.issue
      ? payload.issue.number
      : payload.pull_request.number;
    const labelName = payload.label.name;
    const action = payload.action;

    logger.info('Processing label event', {
      owner,
      repo: repo.name,
      issueNumber,
      labelName,
      action,
    });

    try {
      switch (action) {
        case 'labeled':
          await this.handleLabelAdded(
            owner,
            repo,
            issueNumber,
            labelName,
            payload
          );
          break;
        case 'unlabeled':
          await this.handleLabelRemoved(
            owner,
            repo,
            issueNumber,
            labelName,
            payload
          );
          break;
        default:
          logger.info(`Unhandled label action: ${action}`);
      }
    } catch (error) {
      this.handleError(error, owner, repo, issueNumber, labelName);
    }
  }

  async handleLabelAdded(owner, repo, issueNumber, labelName, payload) {
    logger.info('Handling label added', {
      owner,
      repo,
      issueNumber,
      labelName,
    });

    const item = payload.issue || payload.pull_request;
    const itemType = payload.issue ? 'issue' : 'pull request';

    // Get all current labels
    const labels = await this.githubService.getLabels(owner, repo, issueNumber);

    // Prepare context for AI
    const aiContext = this.buildAiContext(
      item,
      labels.data,
      labelName,
      'added'
    );

    // Get AI response
    const aiResponse = await this.aiService.getResponse(
      aiContext,
      config.AI_PROJECT_ID
    );

    // Post comment with AI response
    await this.githubService.createComment(
      owner,
      repo,
      issueNumber,
      aiResponse
    );

    // Perform actions based on the added label
    await this.performLabelActions(
      owner,
      repo,
      issueNumber,
      labelName,
      'added',
      itemType
    );
  }

  async handleLabelRemoved(owner, repo, issueNumber, labelName, payload) {
    logger.info('Handling label removed', {
      owner,
      repo,
      issueNumber,
      labelName,
    });

    const item = payload.issue || payload.pull_request;
    const itemType = payload.issue ? 'issue' : 'pull request';

    // Get all current labels
    const labels = await this.githubService.getLabels(owner, repo, issueNumber);

    // Prepare context for AI
    const aiContext = this.buildAiContext(
      item,
      labels.data,
      labelName,
      'removed'
    );

    // Get AI response
    const aiResponse = await this.aiService.getResponse(
      aiContext,
      config.AI_PROJECT_ID
    );

    // Post comment with AI response
    await this.githubService.createComment(
      owner,
      repo,
      issueNumber,
      aiResponse
    );

    // Perform actions based on the removed label
    await this.performLabelActions(
      owner,
      repo,
      issueNumber,
      labelName,
      'removed',
      itemType
    );
  }

  buildAiContext(item, labels, changedLabel, action) {
    return `
    ${item.pull_request ? 'Pull Request' : 'Issue'}:
    Title: ${item.title}
    Description: ${item.body}

    Current Labels: ${labels.map((label) => label.name).join(', ')}

    Label ${action}: ${changedLabel}

    Please provide:
    1. A brief explanation of the implications of this label change
    2. Any recommended next steps or actions based on this label change
    `;
  }

  async performLabelActions(
    owner,
    repo,
    issueNumber,
    labelName,
    action,
    itemType
  ) {
    // This method can be expanded to perform specific actions based on labels
    // For example, you might want to:
    // - Assign specific reviewers when a 'needs-review' label is added
    // - Close stale issues when a 'wontfix' label is added
    // - Trigger CI/CD pipelines when certain labels are added to pull requests

    switch (labelName) {
      case 'needs-review':
        if (action === 'added' && itemType === 'pull request') {
          // Assign reviewers
          logger.info('Assigning reviewers for needs-review label');
          // await this.githubService.requestReviewers(owner, repo, issueNumber, ['reviewer1', 'reviewer2']);
        }
        break;
      case 'wontfix':
        if (action === 'added' && itemType === 'issue') {
          // Close the issue
          logger.info('Closing issue with wontfix label');
          // await this.githubService.closeIssue(owner, repo, issueNumber);
        }
        break;
      // Add more cases as needed
      default:
        logger.info(`No specific action for label: ${labelName}`);
    }
  }

  handleError(error, owner, repo, issueNumber, labelName) {
    if (error instanceof AppError) {
      logger.error(`Application error in LabelHandler: ${error.message}`, {
        error,
        owner,
        repo,
        issueNumber,
        labelName,
      });
    } else {
      logger.error(`Unexpected error in LabelHandler: ${error.message}`, {
        error,
        owner,
        repo,
        issueNumber,
        labelName,
      });
    }

    // Optionally, you could post a comment indicating that an error occurred
    this.githubService
      .createComment(
        owner,
        repo,
        issueNumber,
        "I'm sorry, but I encountered an error while processing the label change. Please try again later or contact the maintainers if the problem persists."
      )
      .catch((commentError) => {
        logger.error('Failed to post error comment', {
          commentError,
          owner,
          repo,
          issueNumber,
        });
      });
  }
}
