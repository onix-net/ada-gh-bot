// src/handlers/pullRequestReviewCommentHandler.js

import config from '../config';
import { AppError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import { rateLimiter } from '../utils/rateLimiter.js';

export class PullRequestReviewCommentHandler {
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
    const commentId = payload.comment.id;

    logger.info('Processing pull request review comment', {
      owner,
      repo: repo.name,
      pullNumber,
      commentId,
    });

    try {
      await this.processReviewComment(
        owner,
        repo,
        pullNumber,
        commentId,
        payload
      );
    } catch (error) {
      this.handleError(error, owner, repo, pullNumber, commentId);
    }
  }

  async processReviewComment(owner, repo, pullNumber, commentId, payload) {
    const comment = await this.githubService.getPullRequestComment(
      owner,
      repo,
      commentId
    );

    // Check if the bot should respond to this comment
    if (this.shouldRespondToComment(comment.data)) {
      // Prepare context for AI
      const aiContext = await this.buildAiContext(
        owner,
        repo,
        pullNumber,
        comment.data,
        payload
      );

      // Get AI response
      const aiResponse = await this.aiService.getResponse(
        aiContext,
        config.AI_PROJECT_ID
      );

      // Post response as a new comment
      await this.githubService.createComment(
        owner,
        repo,
        pullNumber,
        aiResponse
      );

      // Perform any additional actions based on the comment
      await this.performAdditionalActions(
        owner,
        repo,
        pullNumber,
        comment.data
      );
    } else {
      logger.info('Skipping response to comment', {
        owner,
        repo,
        pullNumber,
        commentId,
      });
    }
  }

  shouldRespondToComment(comment) {
    // Implement logic to determine if the bot should respond
    // For example, you might want to respond only if:
    // - The comment is not from the bot itself
    // - The comment mentions the bot
    // - The comment contains certain keywords

    if (this.githubService.isCommentFromBot(comment)) {
      return false;
    }

    if (this.githubService.isBotMentioned(comment.body)) {
      return true;
    }

    // Add more conditions as needed

    return false;
  }

  async buildAiContext(owner, repo, pullNumber, comment, payload) {
    // Fetch additional context about the pull request
    const pullRequest = await this.githubService.getPullRequest(
      owner,
      repo,
      pullNumber
    );
    const diffData = await this.githubService.getPullRequestDiff(
      owner,
      repo,
      pullNumber
    );

    return `
    Pull Request:
    Title: ${pullRequest.data.title}
    Description: ${pullRequest.data.body}

    Review Comment:
    Author: ${comment.user.login}
    Content: ${comment.body}
    File: ${payload.comment.path}
    Line: ${payload.comment.line || payload.comment.start_line}

    Relevant Code:
    ${this.getRelevantCodeSnippet(
      diffData,
      payload.comment.path,
      payload.comment.line || payload.comment.start_line
    )}

    Please provide:
    1. An analysis of the comment in the context of the pull request
    2. A suggested response or action to take
    3. Any additional considerations or questions to ask
    `;
  }

  getRelevantCodeSnippet(diffData, filePath, line) {
    // Implement logic to extract the relevant code snippet from the diff
    // This is a placeholder implementation
    return 'Relevant code snippet would be extracted here';
  }

  async performAdditionalActions(owner, repo, pullNumber, comment) {
    // Implement any additional actions you want to take based on the comment
    // For example:
    // - Update labels based on the comment content
    // - Trigger CI/CD pipelines
    // - Notify specific team members

    logger.info('Performing additional actions for review comment', {
      owner,
      repo,
      pullNumber,
    });

    // Example: Add a label if the comment mentions a specific keyword
    if (comment.body.toLowerCase().includes('needs-work')) {
      await this.githubService.addLabel(owner, repo, pullNumber, [
        'needs-revision',
      ]);
    }
  }

  handleError(error, owner, repo, pullNumber, commentId) {
    if (error instanceof AppError) {
      logger.error(
        `Application error in PullRequestReviewCommentHandler: ${error.message}`,
        {
          error,
          owner,
          repo,
          pullNumber,
          commentId,
        }
      );
    } else {
      logger.error(
        `Unexpected error in PullRequestReviewCommentHandler: ${error.message}`,
        {
          error,
          owner,
          repo,
          pullNumber,
          commentId,
        }
      );
    }

    // Optionally, post a comment indicating that an error occurred
    this.githubService
      .createComment(
        owner,
        repo,
        pullNumber,
        "I'm sorry, but I encountered an error while processing this review comment. A maintainer will look into this as soon as possible."
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
