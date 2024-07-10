// src/services/githubService.js
import { AppError } from '../utils/errors.js';
import logger from '../utils/logger.js';

class GitHubService {
  constructor(octokit, botName = 'ada-app-app') {
    this.octokit = octokit;
    this.botName = botName;
    logger.info(`GitHubService initialized for bot: ${this.botName}`);
  }

  async performGitHubOperation(operationName, operation, ...args) {
    try {
      logger.info(`Starting GitHub operation: ${operationName}`, { args });
      const result = await operation(...args);
      logger.info(`Completed GitHub operation: ${operationName}`);
      return result;
    } catch (error) {
      logger.error(`Error in GitHub operation: ${operationName}`, {
        error: error.message,
        stack: error.stack,
        args,
      });
      throw new AppError(`GitHub API error: ${error.message}`, 500);
    }
  }

  async createComment(owner, repo, issueNumber, body) {
    return this.performGitHubOperation(
      'createComment',
      () =>
        this.octokit.rest.issues.createComment({
          owner,
          repo,
          issue_number: issueNumber,
          body,
        }),
      owner,
      repo,
      issueNumber
    );
  }

  async getPullRequestDiff(owner, repo, pullNumber) {
    return this.performGitHubOperation(
      'getPullRequestDiff',
      () =>
        this.octokit.rest.pulls.get({
          owner,
          repo,
          pull_number: pullNumber,
          mediaType: {
            format: 'diff',
          },
        }),
      owner,
      repo,
      pullNumber
    );
  }

  async getPullRequestComment(owner, repo, commentId) {
    return this.performGitHubOperation(
      'getPullRequestComment',
      () =>
        this.octokit.rest.pulls.getReviewComment({
          owner,
          repo,
          comment_id: commentId,
        }),
      owner,
      repo,
      commentId
    );
  }

  async createOrUpdateFile(owner, repo, path, message, content, branch, sha) {
    return this.performGitHubOperation(
      'createOrUpdateFile',
      () =>
        this.octokit.rest.repos.createOrUpdateFileContents({
          owner,
          repo,
          path,
          message,
          content: Buffer.from(content).toString('base64'),
          branch,
          sha,
          committer: {
            name: this.botName,
            email: `${this.botName}@users.noreply.github.com`,
          },
          author: {
            name: this.botName,
            email: `${this.botName}@users.noreply.github.com`,
          },
        }),
      owner,
      repo,
      path,
      message,
      branch
    );
  }

  async createPullRequest(owner, repo, title, head, base, body) {
    return this.performGitHubOperation(
      'createPullRequest',
      () =>
        this.octokit.rest.pulls.create({
          owner,
          repo,
          title,
          head,
          base,
          body,
        }),
      owner,
      repo,
      title,
      head,
      base
    );
  }

  async getFileContent(owner, repo, path, ref) {
    return this.performGitHubOperation(
      'getFileContent',
      () =>
        this.octokit.rest.repos.getContent({
          owner,
          repo,
          path,
          ref,
        }),
      owner,
      repo,
      path,
      ref
    );
  }

  async getIssue(owner, repo, issueNumber) {
    return this.performGitHubOperation(
      'getIssue',
      () =>
        this.octokit.rest.issues.get({
          owner,
          repo,
          issue_number: issueNumber,
        }),
      owner,
      repo,
      issueNumber
    );
  }

  async getIssueComment(owner, repo, commentId) {
    return this.performGitHubOperation(
      'getIssueComment',
      () =>
        this.octokit.rest.issues.getComment({
          owner,
          repo,
          comment_id: commentId,
        }),
      owner,
      repo,
      commentId
    );
  }

  async getIssueComments(owner, repo, issueNumber) {
    return this.performGitHubOperation(
      'getIssueComments',
      () =>
        this.octokit.rest.issues.listComments({
          owner,
          repo,
          issue_number: issueNumber,
        }),
      owner,
      repo,
      issueNumber
    );
  }

  async addLabel(owner, repo, issueNumber, labels) {
    return this.performGitHubOperation(
      'addLabel',
      () =>
        this.octokit.rest.issues.addLabels({
          owner,
          repo,
          issue_number: issueNumber,
          labels,
        }),
      owner,
      repo,
      issueNumber,
      labels
    );
  }

  async getLabels(owner, repo, issueNumber) {
    return this.performGitHubOperation(
      'getLabels',
      () =>
        this.octokit.rest.issues.listLabelsOnIssue({
          owner,
          repo,
          issue_number: issueNumber,
        }),
      owner,
      repo,
      issueNumber
    );
  }

  async createReview(owner, repo, pullNumber, comments, body) {
    return this.performGitHubOperation(
      'createReview',
      () =>
        this.octokit.rest.pulls.createReview({
          owner,
          repo,
          pull_number: pullNumber,
          comments,
          body,
          event: 'COMMENT',
        }),
      owner,
      repo,
      pullNumber
    );
  }

  isBotMentioned(body) {
    const isMentioned = body
      .toLowerCase()
      .includes(`@${this.botName.toLowerCase()}`);
    logger.info(`Checking if bot is mentioned`, { isMentioned, body });
    return isMentioned;
  }

  isCommentFromBot(comment) {
    return comment.user.login === this.botName;
  }
}

export default GitHubService;
