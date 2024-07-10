// import axios from 'axios';
// import { adaAPIURL } from './config.js';
// import logger from './logger.js';
// import GitHubService from './services/githubService.js';
// import { parseAdaConfig } from './utils.js';

// async function handlePullRequest(context) {
//   const { payload } = context;
//   const { owner } = payload.repository;
//   const repo = payload.repository;
//   const githubService = new GitHubService(context.octokit);

//   // TODO: add instructions on how to use ada, what the commands are, etc
//   await githubService.createComment(
//     owner.login,
//     repo.name,
//     payload.pull_request.number,
//     'Thank you for opening this pull request!'
//   );
// }

// async function handleCreatePullRequest(octokit, payload) {
//   const { owner } = payload.repository;
//   const repo = payload.repository;
//   const githubService = new GitHubService(octokit);

//   const issue = await githubService.getFileContent(
//     owner.login,
//     repo.name,
//     payload.issue.number
//   );

//   const result = await axios.post(
//     `${adaAPIURL}/prompt`,
//     {
//       prompt: issue.data.body,
//       projectId: '29',
//     },
//     {
//       headers: {
//         'Content-Type': 'application/json',
//       },
//     }
//   );

//   const fileContent = await githubService.getFileContent(
//     owner.login,
//     repo.name,
//     'ui/src/Prompt.js',
//     'pr-branch'
//   );

//   await githubService.createOrUpdateFile(
//     owner.login,
//     repo.name,
//     'ui/src/Prompt.js',
//     'ada',
//     result.data.response.content,
//     'pr-branch',
//     fileContent.data.sha
//   );

//   await githubService.createPullRequest(
//     owner.login,
//     repo.name,
//     'ada pr',
//     'refs/heads/pr-branch',
//     'refs/heads/main'
//   );

//   return 'PR created successfully';
// }

// async function handlePullRequestReviewComment(context, githubService) {
//   const { payload } = context;
//   const { owner } = payload.repository;
//   const repo = payload.repository;
//   const commentAuthor = payload.comment.user.login;

//   let pullNumber = 0;
//   if (payload.pull_request) {
//     // todo: fix
//     // pullNumber = payload.pull_request.number;
//     pullNumber = payload.issue.number;
//   } else {
//     pullNumber = payload.issue.number;
//   }

//   const adaConfig = parseAdaConfig('');
//   logger.info('HEREE');
//   logger.info(JSON.stringify(payload));

//   if (commentAuthor.startsWith(githubService.botName)) {
//     logger.info('Comment is from the bot itself, skipping response');
//     return;
//   }

//   const contextResult = await axios.post(
//     `${adaAPIURL}/github/context`,
//     {
//       name: `${owner.login}-${repo.name}-pr${pullNumber}`,
//       provider: adaConfig.provider,
//       provider_model: adaConfig.provider_model,
//     },
//     {
//       headers: {
//         'Content-Type': 'application/json',
//         'x-ada-token': process.env.ADA_TOKEN,
//       },
//     }
//   );
//   logger.info('GOT CONTEXTTT');
//   logger.info(JSON.stringify(contextResult.data));
//   logger.info(owner.login);
//   logger.info(repo.name);
//   logger.info(payload.comment.id);

//   // Get the comment content
//   const comment = await githubService.getIssueComment(
//     owner.login,
//     repo.name,
//     payload.comment.id
//   );
//   logger.info('GOT ISSUE');

//   // Get the pull request diff
//   const diffData = await githubService.getPullRequestDiff(
//     owner.login,
//     repo.name,
//     pullNumber
//   );
//   logger.info('GOT DIFF');
//   logger.info(JSON.stringify(diffData));

//   // Parse the diff
//   // const files = parseDiff(diffData);
//   logger.info('DIFF DATA');
//   logger.info(JSON.stringify(diffData.data));

//   // Process the comment with your AI service (e.g., Ada)
//   const result = await axios.post(
//     `${adaAPIURL}/prompt/`,
//     {
//       prompt: `PULL_REQUEST_DIFF:\n${diffData.data}\n PULL_REQUEST_COMMENT_REQUEST:\n${comment.data.body}`,
//       projectId: `${contextResult.data.id}`,
//     },
//     {
//       headers: {
//         'Content-Type': 'application/json',
//         'x-ada-token': process.env.ADA_TOKEN,
//       },
//     }
//   );
//   logger.info('got response00000000');
//   logger.info(JSON.stringify(result.data.response));
//   logger.info(JSON.stringify(payload.comment));

//   // Reply to the comment
//   // todo: createCommentReploy
//   await githubService.createComment(
//     owner.login,
//     repo.name,
//     pullNumber,
//     `@${payload.comment.user.login} ${result.data.response.content}`
//   );
// }

// async function handlePRDiffReview(context, githubService) {
//   const { payload } = context;
//   const { owner } = payload.repository;
//   const repo = payload.repository;
//   const pullNumber = payload.pull_request.number;

//   // Fetch the PR diff
//   const diffData = await githubService.getPullRequestDiff(
//     owner.login,
//     repo.name,
//     pullNumber
//   );

//   // Parse the diff
//   const files = parseDiff(diffData);

//   // Process each file in the diff with the AI service
//   const reviewComments = [];
//   for (const file of files) {
//     const fileContent = file.chunks.map((chunk) => chunk.content).join('\n');

//     // Process the file content with your AI service
//     const result = await axios.post(
//       `${adaAPIURL}/prompt`,
//       {
//         prompt: `Review this code diff and provide comments on specific lines if necessary:\n\n${fileContent}`,
//         projectId: '29',
//       },
//       {
//         headers: {
//           'Content-Type': 'application/json',
//           'x-ada-token': process.env.ADA_TOKEN,
//         },
//       }
//     );

//     // Parse the AI response and create review comments
//     const aiComments = parseAIResponse(result.data.response.content);
//     for (const comment of aiComments) {
//       reviewComments.push({
//         path: file.to,
//         line: comment.line,
//         body: comment.body,
//       });
//     }
//   }

//   // Create a review with all comments
//   await githubService.createReview(
//     owner.login,
//     repo.name,
//     pullNumber,
//     reviewComments,
//     "Here's my review of the changes in this pull request."
//   );
// }

// // Helper function to parse AI response into structured comments
// function parseAIResponse(aiResponse) {
//   // This is a placeholder implementation. You'll need to adjust this based on your AI service's output format.
//   // For example, you might expect the AI to return comments in a specific format like "Line X: Comment"
//   const comments = [];
//   const lines = aiResponse.split('\n');
//   for (const line of lines) {
//     const match = line.match(/Line (\d+): (.+)/);
//     if (match) {
//       comments.push({
//         line: parseInt(match[1]),
//         body: match[2],
//       });
//     }
//   }
//   return comments;
// }

// async function handleIssueComment(context, githubService) {
//   const { payload } = context;
//   const { owner } = payload.repository;
//   const repo = payload.repository;
//   const issueNumber = payload.issue.number;
//   const commentBody = payload.comment.body;
//   const commentAuthor = payload.comment.user.login;

//   logger.info(`Processing issue comment`, {
//     owner: owner.login,
//     repo: repo.name,
//     issueNumber,
//     commentAuthor,
//   });

//   // Check if the comment is from the bot itself
//   if (commentAuthor.startsWith(githubService.botName)) {
//     logger.info('Comment is from the bot itself, skipping response');
//     return;
//   }

//   if (commentBody.startsWith('/')) {
//     await handleCommand(
//       commentBody,
//       owner.login,
//       repo.name,
//       issueNumber,
//       githubService
//     );
//     return;
//   }

//   try {
//     // Fetch the original issue
//     const issue = await githubService.getIssue(
//       owner.login,
//       repo.name,
//       issueNumber
//     );

//     // Fetch all comments on the issue
//     const comments = await githubService.getIssueComments(
//       owner.login,
//       repo.name,
//       issueNumber
//     );

//     // Prepare the context for the AI service
//     const aiContext = `
//     Original Issue:
//     ${issue.data.title}
//     ${issue.data.body}

//     Comments:
//     ${comments.data
//       .map((comment) => `${comment.user.login}: ${comment.body}`)
//       .join('\n\n')}

//     Latest comment (to respond to):
//     ${commentBody}
//     `;

//     // ```ada
//     // provider: openai
//     // provider_model: gpt40
//     // ```
//     const adaConfig = parseAdaConfig(issue.data.body);

//     // get context
//     const contextResult = await axios.post(
//       `${adaAPIURL}/github/context`,
//       {
//         name: `${owner.login}-${repo.name}-${issueNumber}`,
//         provider: adaConfig.provider,
//         provider_model: adaConfig.provider_model,
//       },
//       {
//         headers: {
//           'Content-Type': 'application/json',
//           'x-ada-token': process.env.ADA_TOKEN,
//         },
//       }
//     );
//     console.log(contextResult);

//     // Process with your AI service
//     const result = await axios.post(
//       `${adaAPIURL}/prompt`,
//       {
//         prompt: `Given the following context of a GitHub issue and its comments, please provide a response to the latest comment:\n\n${aiContext}`,
//         projectId: `${contextResult.data.id}`,
//       },
//       {
//         headers: {
//           'Content-Type': 'application/json',
//           'x-ada-token': process.env.ADA_TOKEN,
//         },
//       }
//     );

//     logger.info('Received response from AI service');

//     // Post the AI's response as a new comment
//     await githubService.createComment(
//       owner.login,
//       repo.name,
//       issueNumber,
//       `@${commentAuthor} ${result.data.response.content}`
//     );

//     logger.info('Posted AI response as a new comment');
//   } catch (error) {
//     logger.error('Error in handleIssueComment', {
//       error: error.message,
//       stack: error.stack,
//       owner: owner.login,
//       repo: repo.name,
//       issueNumber,
//     });
//   }
// }

// async function handleIssueOpened(context, githubService) {
//   const { payload } = context;
//   const { owner } = payload.repository;
//   const repo = payload.repository;
//   const issueNumber = payload.issue.number;

//   // Prepare the context for the AI service
//   const aiContext = `
//   New Issue Opened:
//   Title: ${payload.issue.title}
//   Body: ${payload.issue.body}
//   `;

//   // Process with your AI service
//   const result = await axios.post(
//     `${adaAPIURL}/prompt`,
//     {
//       prompt: `A new GitHub issue has been opened. Please provide a helpful initial response and suggest appropriate labels:\n\n${aiContext}`,
//       projectId: '29',
//     },
//     {
//       headers: {
//         'Content-Type': 'application/json',
//         'x-ada-token': process.env.ADA_TOKEN,
//       },
//     }
//   );

//   // Post the AI's response as a new comment
//   await githubService.createIssueComment(
//     owner.login,
//     repo.name,
//     issueNumber,
//     result.data.response.content
//   );

//   // Add suggested labels (assuming the AI response includes label suggestions)
//   const suggestedLabels = parseSuggestedLabels(result.data.response.content);
//   if (suggestedLabels.length > 0) {
//     await githubService.addLabel(
//       owner.login,
//       repo.name,
//       issueNumber,
//       suggestedLabels
//     );
//   }
// }

// async function handlePullRequestOpened(context, githubService) {
//   const { payload } = context;
//   const { owner } = payload.repository;
//   const repo = payload.repository;
//   const pullNumber = payload.pull_request.number;

//   // Fetch the PR diff
//   const diffData = await githubService.getPullRequestDiff(
//     owner.login,
//     repo.name,
//     pullNumber
//   );

//   // Prepare the context for the AI service
//   const aiContext = `
//   New Pull Request Opened:
//   Title: ${payload.pull_request.title}
//   Body: ${payload.pull_request.body}
//   Diff:
//   ${diffData}
//   `;

//   // Process with your AI service
//   const result = await axios.post(
//     `${adaAPIURL}/prompt`,
//     {
//       prompt: `A new GitHub pull request has been opened. Please provide an initial code review and suggest appropriate labels:\n\n${aiContext}`,
//       projectId: '29',
//     },
//     {
//       headers: {
//         'Content-Type': 'application/json',
//       },
//     }
//   );

//   // Post the AI's response as a new comment
//   await githubService.createCommentReply(
//     owner.login,
//     repo.name,
//     pullNumber,
//     result.data.response.content
//   );

//   // Add suggested labels (assuming the AI response includes label suggestions)
//   const suggestedLabels = parseSuggestedLabels(result.data.response.content);
//   if (suggestedLabels.length > 0) {
//     await githubService.addLabel(
//       owner.login,
//       repo.name,
//       pullNumber,
//       suggestedLabels
//     );
//   }
// }

// async function handleLabeled(context, githubService) {
//   const { payload } = context;
//   const { owner } = payload.repository;
//   const repo = payload.repository;
//   const itemNumber = payload.issue
//     ? payload.issue.number
//     : payload.pull_request.number;
//   const itemType = payload.issue ? 'issue' : 'pull request';

//   // Get all current labels
//   const labelsResponse = await githubService.getLabels(
//     owner.login,
//     repo.name,
//     itemNumber
//   );
//   const labels = labelsResponse.data.map((label) => label.name);

//   // Prepare the context for the AI service
//   const aiContext = `
//   A label has been added to a GitHub ${itemType}.
//   ${
//     itemType === 'issue'
//       ? `Issue Title: ${payload.issue.title}`
//       : `PR Title: ${payload.pull_request.title}`
//   }
//   New Label: ${payload.label.name}
//   All Current Labels: ${labels.join(', ')}
//   `;

//   // Process with your AI service
//   const result = await axios.post(
//     `${adaAPIURL}/prompt`,
//     {
//       prompt: `A label has been added to a GitHub ${itemType}. Please provide any relevant information or actions based on this label:\n\n${aiContext}`,
//       projectId: '29',
//     },
//     {
//       headers: {
//         'Content-Type': 'application/json',
//       },
//     }
//   );

//   // Post the AI's response as a new comment
//   await githubService.createCommentReply(
//     owner.login,
//     repo.name,
//     itemNumber,
//     result.data.response.content
//   );
// }

// async function handleCommand(command, owner, repo, issueNumber, githubService) {
//   const commandParts = command.split(' ');
//   const mainCommand = commandParts[0].toLowerCase();

//   switch (mainCommand) {
//     case '/help':
//       await githubService.createIssueComment(
//         owner,
//         repo,
//         issueNumber,
//         'Here are the available commands:\n' +
//           '- `/help`: Show this help message\n' +
//           '- `/status`: Get the current status of this issue/PR\n' +
//           '- `/summarize`: Get a summary of this issue/PR\n' +
//           '- `/label add <label>`: Add a label to this issue/PR\n' +
//           '- `/label remove <label>`: Remove a label from this issue/PR'
//       );
//       break;
//     case '/status':
//       // Implement status checking logic
//       break;
//     case '/summarize':
//       // Implement summarization logic
//       break;
//     case '/label':
//       if (commandParts[1] === 'add' && commandParts[2]) {
//         await githubService.addLabel(owner, repo, issueNumber, [
//           commandParts[2],
//         ]);
//       } else if (commandParts[1] === 'remove' && commandParts[2]) {
//         // Implement label removal logic
//       }
//       break;
//     default:
//       await githubService.createIssueComment(
//         owner,
//         repo,
//         issueNumber,
//         `Unrecognized command: ${mainCommand}. Type /help for a list of available commands.`
//       );
//   }
// }

// // Helper function to parse suggested labels from AI response
// function parseSuggestedLabels(aiResponse) {
//   // This is a placeholder implementation. Adjust based on your AI's output format.
//   const labelRegex = /Suggested labels?: (.*)/i;
//   const match = aiResponse.match(labelRegex);
//   if (match && match[1]) {
//     return match[1].split(',').map((label) => label.trim());
//   }
//   return [];
// }

// export {
//     handleCreatePullRequest,
//     handleIssueComment,
//     handleIssueOpened,
//     handleLabeled,
//     handlePRDiffReview,
//     handlePullRequest,
//     handlePullRequestOpened,
//     handlePullRequestReviewComment
// };
