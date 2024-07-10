import { VertexAIService } from './vertexAIService.js';
import { AdaService } from './adaService.js';
import { MockAIService } from './mockAIService.js';
import config from '../../config';

class AIServiceFactory {
  static createAIService(provider = config.AI_PROVIDER) {
    switch (provider.toLowerCase()) {
      case 'vertexai':
        return new VertexAIService();
      case 'ada':
        return new AdaService();
      case 'mock':
        return new MockAIService();
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }
}

export default AIServiceFactory;
