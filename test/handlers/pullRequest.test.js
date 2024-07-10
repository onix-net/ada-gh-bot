import nock from 'nock';
import { handlePullRequest } from '../../src/handlers/pullRequest';

describe('handlePullRequest', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  test('creates a comment on the pull request', async () => {
    const owner = 'john';
    const repo = 'test-repo';
    const issueNumber = 123;
    const commentBody = 'Thank you for opening this pull request!';

    const context = {
      payload: {
        repository: {
          owner: {
            login: owner,
          },
          name: repo,
        },
        pull_request: {
          number: issueNumber,
        },
      },
      octokit: {
        issues: {
          createComment: jest.fn(),
        },
      },
    };

    // Mock the GitHub API request
    nock('https://api.github.com')
      .post(`/repos/${owner}/${repo}/issues/${issueNumber}/comments`, {
        body: commentBody,
      })
      .reply(201);

    await handlePullRequest(context);

    expect(context.octokit.issues.createComment).toHaveBeenCalledWith({
      owner,
      repo,
      issue_number: issueNumber,
      body: commentBody,
    });
  });
});
