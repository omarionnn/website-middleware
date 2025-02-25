import { ActionRequest, ActionResponse } from '../types';

export class StandardizationLayer {
  async standardizeRequest(request: ActionRequest): Promise<ActionRequest> {
    // For MVP, we'll do basic validation and standardization
    return {
      type: request.type.toLowerCase(),
      parameters: this.sanitizeParameters(request.parameters),
      context: request.context
    };
  }

  async standardizeResponse(response: ActionResponse): Promise<ActionResponse> {
    return {
      success: response.success,
      data: response.data ? this.sanitizeData(response.data) : undefined,
      error: response.error
    };
  }

  private sanitizeParameters(params: Record<string, any>): Record<string, any> {
    // Basic sanitization for MVP
    return Object.entries(params).reduce((acc, [key, value]) => {
      acc[key.toLowerCase()] = typeof value === 'string' ? value.trim() : value;
      return acc;
    }, {} as Record<string, any>);
  }

  private sanitizeData(data: any): any {
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }
    if (typeof data === 'object' && data !== null) {
      return Object.entries(data).reduce((acc, [key, value]) => {
        acc[key.toLowerCase()] = this.sanitizeData(value);
        return acc;
      }, {} as Record<string, any>);
    }
    return data;
  }
} 