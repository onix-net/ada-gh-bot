import { VertexAI } from '@google-cloud/vertexai';
import { AppError } from '../../utils/errors.js';
import { AIService } from './index.js';

export class VertexAIService extends AIService {
  constructor() {
    super();
    // this.apiKey = config.ANTHROPIC_API_KEY;
    // this.apiUrl = config.ANTHROPIC_API_URL;
  }

  async getResponse(prompt, projectId) {
    try {
      const gcpProjectId = 'ada-test-1234';
      const location = 'us-central1';
      const modelId = 'gemini-1.5-flash-001';

      const vertexAI = new VertexAI({ project: gcpProjectId, location });

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

  async getContext() {}
}
