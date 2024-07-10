import { Octokit } from '@octokit/rest';
import cron from 'node-cron';
import { appId, privateKey } from './config.js';
import logger from './logger.js';
import GitHubService from './services/githubService.js';

async function scanStalePullRequests(installation) {
  const octokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId,
      privateKey,
      installationId: installation.id,
    },
  });

  const githubService = new GitHubService(octokit);

  const repos = await octokit.paginate(
    octokit.apps.listReposAccessibleToInstallation
  );

  for (const repo of repos) {
    const pullRequests = await octokit.paginate(octokit.pulls.list, {
      owner: repo.owner.login,
      repo: repo.name,
      state: 'open',
    });

    for (const pr of pullRequests) {
      const lastUpdated = new Date(pr.updated_at);
      const daysSinceUpdate =
        (new Date() - lastUpdated) / (1000 * 60 * 60 * 24);

      if (daysSinceUpdate > 14) {
        // Consider PRs stale after 14 days
        await githubService.createCommentReply(
          repo.owner.login,
          repo.name,
          pr.number,
          `This pull request has been inactive for ${Math.floor(
            daysSinceUpdate
          )} days. Please update or close it if it's no longer relevant.`
        );
      }
    }
  }
}

export function setupScheduledTasks(app) {
  // Run every day at midnight
  cron.schedule('0 0 * * *', async () => {
    logger.info('Running scheduled task: Scan for stale pull requests');

    const installations = await app.octokit.paginate(
      app.octokit.apps.listInstallations
    );

    for (const installation of installations) {
      try {
        await scanStalePullRequests(installation);
      } catch (error) {
        logger.error('Error scanning for stale pull requests', {
          error,
          installationId: installation.id,
        });
      }
    }
  });
}
