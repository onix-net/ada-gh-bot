import axios from 'axios';
import { AppError } from '../../utils/errors.js';
import { AIService } from './index.js';
import config  from '../../config'
import logger from '../../utils/logger.js';

export class AdaService extends AIService {
  constructor() {
    super();
    this.apiUrl = config.ADA_API_URL;
    this.apiKey = config.ADA_API_KEY;
  }

  async getResponse(prompt, projectId) {
    logger.info(JSON.stringify({
      prompt: prompt,
      projectId: `${projectId}`,
    }))
    try {
      const response = await axios.post(
        `${this.apiUrl}/prompt/`,
        {
          prompt: prompt,
          projectId: `${projectId}`,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-ada-token': this.apiKey,
          },
        }
      );

      return response.data.response.content;
    } catch (error) {
      throw new AppError(`Ada API error: ${error.message}`, 500);
    }
  }

  async getContext(name) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/github/context`,
        {
          name: name,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-ada-token': this.apiKey,
          },
        }
      );

      return response.data.id;
    } catch (error) {
      throw new AppError(`Ada API error: ${error.message}`, 500);
    }
  }
}
