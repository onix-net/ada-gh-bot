import { AIService } from './index.js';

export class MockAIService extends AIService {
  async getResponse(context, projectId) {
    return `Mock AI response for context: ${context} and projectId: ${projectId}`;
  }
}
