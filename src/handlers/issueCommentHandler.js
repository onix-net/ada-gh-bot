// src/handlers/issueCommentHandler.js

import config from '../config';
import GitHubService from '../services/githubService.js';
import { AppError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import { rateLimiter } from '../utils/rateLimiter.js';

export class IssueCommentHandler {
  constructor(aiService, githubService) {
    this.aiService = aiService;
    this.githubService = githubService;
  }

  @rateLimiter()
  async handle(context) {
    const { payload } = context;
    this.githubService = new GitHubService(context.octokit);
    const owner = payload.repository.owner.login;
    const repo = payload.repository;
    const repoName = repo.name;
    const issueNumber = payload.issue.number;
    const commentBody = payload.comment.body;
    const commentAuthor = payload.comment.user.login;
    const uniqueId = `${owner}-${repoName}-${issueNumber}`;

    logger.info('Processing issue comment', {
      owner,
      repo: repo.name,
      issueNumber,
      commentAuthor,
    });

    try {
      if (this.githubService.isCommentFromBot(payload.comment)) {
        logger.info('Comment is from the bot itself, skipping response');
        return;
      }

      if (commentBody.startsWith('/')) {
        await this.handleCommand(commentBody, owner, repoName, issueNumber);
        return;
      }

      if (!this.githubService.isBotMentioned(commentBody)) {
        logger.info('Bot not mentioned, skipping response');
        return;
      }

      logger.info('ISSUE');
      logger.info(owner);
      logger.info(repoName);
      logger.info(issueNumber);
      const issue = await this.githubService.getIssue(
        owner,
        repoName,
        issueNumber
      );
      logger.info('GOT ISSUE');
      const comments = await this.githubService.getIssueComments(
        owner,
        repoName,
        issueNumber
      );

      const aiContext = this.buildAiContext(
        issue.data,
        comments.data,
        commentBody
      );
      const projectID = await this.aiService.getContext(uniqueId);

      const aiResponse = await this.aiService.getResponse(aiContext, projectID);

      await this.githubService.createComment(
        owner,
        repoName,
        issueNumber,
        `@${commentAuthor} ${aiResponse}`
      );

      logger.info('Posted AI response as a new comment', {
        owner,
        repo: repoName,
        issueNumber,
      });
    } catch (error) {
      this.handleError(error, owner, repoName, issueNumber);
    }
  }

  buildAiContext(issue, comments, latestComment) {
    return `
    Original Issue:
    Title: ${issue.title}
    Body: ${issue.body}

    Previous Comments:
    ${comments
      .map((comment) => `${comment.user.login}: ${comment.body}`)
      .join('\n\n')}

    Latest comment (to respond to):
    ${latestComment}
    `;
  }

  async handleCommand(command, owner, repo, issueNumber) {
    const commandParts = command.split(' ');
    const mainCommand = commandParts[0].toLowerCase();

    switch (mainCommand) {
      case '/help':
        await this.githubService.createComment(
          owner,
          repo,
          issueNumber,
          'Here are the available commands:\n' +
            '- `/help`: Show this help message\n' +
            '- `/status`: Get the current status of this issue/PR\n' +
            '- `/summarize`: Get a summary of this issue/PR\n' +
            '- `/label add <label>`: Add a label to this issue/PR\n' +
            '- `/label remove <label>`: Remove a label from this issue/PR'
        );
        break;
      case '/status':
        // Implement status checking logic
        break;
      case '/summarize':
        // Implement summarization logic
        break;
      case '/label':
        if (commandParts[1] === 'add' && commandParts[2]) {
          await this.githubService.addLabel(owner, repo, issueNumber, [
            commandParts[2],
          ]);
        } else if (commandParts[1] === 'remove' && commandParts[2]) {
          // Implement label removal logic
        }
        break;
      default:
        await this.githubService.createComment(
          owner,
          repo,
          issueNumber,
          `Unrecognized command: ${mainCommand}. Type /help for a list of available commands.`
        );
    }
  }

  handleError(error, owner, repo, issueNumber) {
    if (error instanceof AppError) {
      logger.error(
        `Application error in IssueCommentHandler: ${error.message}`,
        {
          error,
          owner,
          repo,
          issueNumber,
        }
      );
    } else {
      logger.error(
        `Unexpected error in IssueCommentHandler: ${error.message}`,
        {
          error,
          owner,
          repo,
          issueNumber,
        }
      );
    }

    // Optionally, you could post a comment to the issue indicating that an error occurred
    this.githubService
      .createComment(
        owner,
        repo,
        issueNumber,
        "I'm sorry, but I encountered an error while processing your comment. Please try again later or contact the maintainers if the problem persists."
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
