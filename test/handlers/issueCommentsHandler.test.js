// src/handlers/__tests__/issueCommentHandler.test.js

import { IssueCommentHandler } from '../issueCommentHandler.js';
import { MockAIService } from '../../services/aiService/mockAIService.js';
import GitHubService from '../../services/githubService.js';
import { AppError } from '../../utils/errors.js';

// Mock the GitHubService
jest.mock('../../services/githubService.js');

describe('IssueCommentHandler', () => {
  let handler;
  let mockAIService;
  let mockGitHubService;
  let mockContext;

  beforeEach(() => {
    mockAIService = new MockAIService();
    mockGitHubService = new GitHubService();
    handler = new IssueCommentHandler(mockAIService, mockGitHubService);

    // Setup mock context based on the provided payload
    mockContext = {
      payload: {
        action: 'created',
        issue: {
          number: 10,
          html_url: 'https://github.com/container-labs/ada/pull/10',
          title: 'test pr',
          body: null,
        },
        comment: {
          id: 2218646195,
          body: '@ada-app-app please review this PR',
          user: {
            login: 'WillBeebe',
          },
        },
        repository: {
          owner: {
            login: 'container-labs',
          },
          name: 'ada',
        },
      },
    };
  });

  test('handle should process comment when bot is mentioned', async () => {
    // Mock necessary GitHubService methods
    mockGitHubService.isCommentFromBot.mockReturnValue(false);
    mockGitHubService.isBotMentioned.mockReturnValue(true);
    mockGitHubService.getIssue.mockResolvedValue({
      data: mockContext.payload.issue,
    });
    mockGitHubService.getIssueComments.mockResolvedValue({
      data: [mockContext.payload.comment],
    });

    // Mock AI service response
    const mockAIResponse = 'This is a mock AI response';
    jest.spyOn(mockAIService, 'getResponse').mockResolvedValue(mockAIResponse);

    await handler.handle(mockContext);

    // Verify that the necessary methods were called
    expect(mockGitHubService.isCommentFromBot).toHaveBeenCalled();
    expect(mockGitHubService.isBotMentioned).toHaveBeenCalled();
    expect(mockGitHubService.getIssue).toHaveBeenCalled();
    expect(mockGitHubService.getIssueComments).toHaveBeenCalled();
    expect(mockAIService.getResponse).toHaveBeenCalled();
    expect(mockGitHubService.createComment).toHaveBeenCalledWith(
      'container-labs',
      'ada',
      10,
      `@WillBeebe ${mockAIResponse}`
    );
  });

  test('handle should not process comment when bot is not mentioned', async () => {
    mockGitHubService.isCommentFromBot.mockReturnValue(false);
    mockGitHubService.isBotMentioned.mockReturnValue(false);

    await handler.handle(mockContext);

    expect(mockGitHubService.isCommentFromBot).toHaveBeenCalled();
    expect(mockGitHubService.isBotMentioned).toHaveBeenCalled();
    expect(mockGitHubService.getIssue).not.toHaveBeenCalled();
    expect(mockGitHubService.getIssueComments).not.toHaveBeenCalled();
    expect(mockAIService.getResponse).not.toHaveBeenCalled();
    expect(mockGitHubService.createComment).not.toHaveBeenCalled();
  });

  test('handle should not process comment when comment is from bot', async () => {
    mockGitHubService.isCommentFromBot.mockReturnValue(true);

    await handler.handle(mockContext);

    expect(mockGitHubService.isCommentFromBot).toHaveBeenCalled();
    expect(mockGitHubService.isBotMentioned).not.toHaveBeenCalled();
    expect(mockGitHubService.getIssue).not.toHaveBeenCalled();
    expect(mockGitHubService.getIssueComments).not.toHaveBeenCalled();
    expect(mockAIService.getResponse).not.toHaveBeenCalled();
    expect(mockGitHubService.createComment).not.toHaveBeenCalled();
  });

  test('handle should process command when comment starts with /', async () => {
    mockContext.payload.comment.body = '/help';
    mockGitHubService.isCommentFromBot.mockReturnValue(false);

    await handler.handle(mockContext);

    expect(mockGitHubService.isCommentFromBot).toHaveBeenCalled();
    expect(mockGitHubService.createComment).toHaveBeenCalledWith(
      'container-labs',
      'ada',
      10,
      expect.stringContaining('Here are the available commands:')
    );
  });

  test('handle should throw AppError when GitHub API fails', async () => {
    mockGitHubService.isCommentFromBot.mockReturnValue(false);
    mockGitHubService.isBotMentioned.mockReturnValue(true);
    mockGitHubService.getIssue.mockRejectedValue(new Error('GitHub API error'));

    await expect(handler.handle(mockContext)).rejects.toThrow(AppError);
  });
});
