import axios from 'axios';
import { AppError } from '../../utils/errors.js';
import { AIService } from './index.js';

export class AdaService extends AIService {
  constructor() {
    super();
    // this.apiKey = config.ANTHROPIC_API_KEY;
    // this.apiUrl = config.ANTHROPIC_API_URL;
  }

  async getResponse(prompt, projectId) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/prompt`,
        {
          prompt: prompt,
          projectId: projectId,
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
}
