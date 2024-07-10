// src/handlers/index.js

import { IssueCommentHandler } from './issueCommentHandler.js';
import { IssueOpenedHandler } from './issueOpenedHandler.js';
import { LabelHandler } from './labelHandler.js';
import { PullRequestHandler } from './pullRequestHandler.js';
import { PullRequestReviewCommentHandler } from './pullRequestReviewCommentHandler.js';

export {
  IssueCommentHandler,
  IssueOpenedHandler,
  LabelHandler,
  PullRequestHandler,
  PullRequestReviewCommentHandler,
};

// Factory function to create handlers with dependencies
export function createHandlers(aiService, githubService) {
  return {
    issueComment: new IssueCommentHandler(aiService, githubService),
    issueOpened: new IssueOpenedHandler(aiService, githubService),
    label: new LabelHandler(aiService, githubService),
    pullRequestReviewComment: new PullRequestReviewCommentHandler(
      aiService,
      githubService
    ),
    pullRequest: new PullRequestHandler(aiService, githubService),
  };
}
