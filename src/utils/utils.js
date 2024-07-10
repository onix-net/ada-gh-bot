import logger from './logger.js';

/**
 * Parses the Ada configuration from the issue body.
 * @param {string} issueBody - The full text of the issue body.
 * @returns {Object|null} An object containing provider and provider_model, or null if not found.
 */
function parseAdaConfig(issueBody) {
  // Regular expression to match the Ada configuration block
  const adaConfigRegex = /```ada\s+([\s\S]*?)```/;

  // Try to find a match in the issue body
  const match = issueBody.match(adaConfigRegex);

  if (match && match[1]) {
    const configContent = match[1].trim();

    // Parse the configuration content
    const config = {};
    const lines = configContent.split('\n');

    for (const line of lines) {
      const [key, value] = line.split(':').map((part) => part.trim());
      if (key && value) {
        config[key] = value;
      }
    }

    // Check if we have both required fields
    if (config.provider && config.provider_model) {
      logger.info('Successfully parsed Ada configuration', { config });
      return {
        provider: config.provider,
        provider_model: config.provider_model,
      };
    }
  } else {
    return {
      provider: 'anthropic',
      provider_model: 'claude-3-5-sonnet-20240620',
    };
  }

  logger.info('No valid Ada configuration found in the issue body');
  return null;
}

/**
 * Parses a Git diff string into an array of file objects.
 * @param {string} diffString - The Git diff output as a string.
 * @returns {Array} An array of file objects, each containing file information and chunks of changes.
 */
function parseDiff(diffString) {
  const files = [];
  const fileChunks = diffString.split('diff --git');

  for (let i = 1; i < fileChunks.length; i++) {
    const fileChunk = fileChunks[i];
    const lines = fileChunk.split('\n');

    const fileInfo = {
      from: lines[0].match(/a\/(.+)/)?.[1] || '',
      to: lines[0].match(/b\/(.+)/)?.[1] || '',
      chunks: [],
    };

    let currentChunk = null;

    for (let j = 1; j < lines.length; j++) {
      const line = lines[j];

      if (line.startsWith('@@')) {
        if (currentChunk) {
          fileInfo.chunks.push(currentChunk);
        }
        currentChunk = {
          header: line,
          changes: [],
        };
      } else if (currentChunk) {
        currentChunk.changes.push(line);
      }
    }

    if (currentChunk) {
      fileInfo.chunks.push(currentChunk);
    }

    files.push(fileInfo);
  }

  return files;
}

export { parseAdaConfig, parseDiff };
