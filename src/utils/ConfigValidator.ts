import { ConnectorConfig } from '../types';
import { ValidationError } from '../errors';

export class ConfigValidator {
  static validateConnectorConfig(config: ConnectorConfig): void {
    const errors: Record<string, string> = {};

    if (!config.name?.trim()) {
      errors.name = 'Connector name is required';
    }

    if (!config.baseUrl?.trim()) {
      errors.baseUrl = 'Base URL is required';
    } else if (!this.isValidUrl(config.baseUrl)) {
      errors.baseUrl = 'Invalid base URL format';
    }

    if (!config.authConfig) {
      errors.authConfig = 'Authentication configuration is required';
    } else {
      if (!['basic', 'oauth', 'custom'].includes(config.authConfig.type)) {
        errors.authType = 'Invalid authentication type';
      }
      if (!config.authConfig.credentials) {
        errors.credentials = 'Authentication credentials are required';
      }
    }

    if (!config.rateLimit) {
      errors.rateLimit = 'Rate limit configuration is required';
    } else {
      if (config.rateLimit.requestsPerMinute < 1) {
        errors.requestsPerMinute = 'Requests per minute must be greater than 0';
      }
      if (config.rateLimit.concurrent < 1) {
        errors.concurrent = 'Concurrent requests must be greater than 0';
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Invalid connector configuration', errors);
    }
  }

  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
} 