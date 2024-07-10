import { VertexAI } from '@google-cloud/vertexai';
import { AppError } from '../../utils/errors.js';
import { AIService } from './index.js';
import config from '../../config';

export class VertexAIService extends AIService {
  constructor() {
    super();
    this.gcpProjectId = config.VERTEX_AI_PROJECT;
  }

  async getResponse(prompt, projectId) {
    try {
      const location = 'us-central1';
      const modelId = 'gemini-1.5-flash-001';

      const vertexAI = new VertexAI({ project: this.gcpProjectId, location });

      const generativeModel = vertexAI.getGenerativeModel({
        model: modelId,
      });

      const resp = await generativeModel.generateContent(prompt);
      const contentResponse = await resp.response;
      // console.log(JSON.stringify(contentResponse));
      // console.log(contentResponse['candidates'][0]['content']['parts'][0]['text'])
      // TODO: make this join all parts and add error checking
      return contentResponse['candidates'][0]['content']['parts'][0]['text'];
    } catch (error) {
      throw new AppError(`Vertex API error: ${error.message}`, 500);
    }
  }

  async getContext(name) {
    return 'none';
  }
}
