// src/handlers/issueOpenedHandler.js

import config from '../config';
import { AppError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import { rateLimiter } from '../utils/rateLimiter.js';

export class IssueOpenedHandler {
  constructor(aiService, githubService) {
    this.aiService = aiService;
    this.githubService = githubService;
  }

  @rateLimiter()
  async handle(context) {
    const { payload } = context;
    const owner = payload.repository.owner.login;
    const repo = payload.repository;
    const issueNumber = payload.issue.number;

    logger.info('Processing newly opened issue', {
      owner,
      repo: repo.name,
      issueNumber,
    });

    try {
      await this.processNewIssue(owner, repo, issueNumber, payload.issue);
    } catch (error) {
      this.handleError(error, owner, repo, issueNumber);
    }
  }

  async processNewIssue(owner, repo, issueNumber, issue) {
    // Prepare context for AI
    const aiContext = this.buildAiContext(issue);

    // Get AI response
    const aiResponse = await this.aiService.getResponse(
      aiContext,
      config.AI_PROJECT_ID
    );

    // Post initial comment
    await this.githubService.createComment(
      owner,
      repo,
      issueNumber,
      aiResponse
    );

    // Add initial labels
    const suggestedLabels = this.parseSuggestedLabels(aiResponse);
    if (suggestedLabels.length > 0) {
      await this.githubService.addLabel(
        owner,
        repo,
        issueNumber,
        suggestedLabels
      );
    }

    // Assign issue if necessary
    await this.assignIssue(owner, repo, issueNumber, issue);

    // Perform any other necessary actions
    await this.performAdditionalActions(owner, repo, issueNumber, issue);
  }

  buildAiContext(issue) {
    return `
    New Issue Opened:
    Title: ${issue.title}
    Body: ${issue.body}

    Please provide:
    1. A brief summary of the issue
    2. Suggested labels for categorization (comma-separated)
    3. Any clarifying questions for the issue opener
    4. Potential next steps or requests for more information
    `;
  }

  parseSuggestedLabels(aiResponse) {
    // This is a simple implementation. You might want to make this more robust.
    const labelMatch = aiResponse.match(/Suggested labels: (.*)/i);
    if (labelMatch && labelMatch[1]) {
      return labelMatch[1].split(',').map((label) => label.trim());
    }
    return [];
  }

  async assignIssue(owner, repo, issueNumber, issue) {
    // This is a placeholder for issue assignment logic
    // You might want to implement more sophisticated assignment based on issue content or project structure
    logger.info('Assigning issue', { owner, repo, issueNumber });

    // Example: Assign to a default team member or maintainer
    // await this.githubService.assignIssue(owner, repo, issueNumber, ['default-assignee']);
  }

  async performAdditionalActions(owner, repo, issueNumber, issue) {
    // Placeholder for any additional actions you might want to take on new issues
    // For example:
    // - Add the issue to a project board
    // - Trigger external notifications
    // - Update issue trackers or other internal tools

    logger.info('Performing additional actions for new issue', {
      owner,
      repo,
      issueNumber,
    });

    // Example: Add to a project board
    // await this.githubService.addIssueToProject(owner, repo, issueNumber, 'Main Project Board');
  }

  handleError(error, owner, repo, issueNumber) {
    if (error instanceof AppError) {
      logger.error(
        `Application error in IssueOpenedHandler: ${error.message}`,
        {
          error,
          owner,
          repo,
          issueNumber,
        }
      );
    } else {
      logger.error(`Unexpected error in IssueOpenedHandler: ${error.message}`, {
        error,
        owner,
        repo,
        issueNumber,
      });
    }

    // Post a comment indicating that an error occurred
    this.githubService
      .createComment(
        owner,
        repo,
        issueNumber,
        "I'm sorry, but I encountered an error while processing this new issue. A maintainer will review it as soon as possible. Thank you for your patience."
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
