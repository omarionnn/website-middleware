import { Logger } from './Logger';
import { MiddlewareError } from '../errors';

export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableErrors?: Array<string | RegExp>;
}

export class RetryMechanism {
  private logger = Logger.getInstance();

  constructor(private config: RetryConfig) {}

  async execute<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: Error | null = null;
    let delay = this.config.initialDelay;

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error occurred');
        lastError = err;
        
        if (!this.isRetryable(err)) {
          throw err;
        }

        if (attempt === this.config.maxAttempts) {
          break;
        }

        this.logger.warn(
          `Retry attempt ${attempt}/${this.config.maxAttempts} for ${context}`,
          { error: err.message, delay }
        );

        await this.sleep(delay);
        delay = Math.min(
          delay * this.config.backoffFactor,
          this.config.maxDelay
        );
      }
    }

    throw new MiddlewareError(
      `Operation failed after ${this.config.maxAttempts} attempts: ${lastError?.message}`
    );
  }

  private isRetryable(error: Error): boolean {
    if (!this.config.retryableErrors) {
      return true;
    }

    return this.config.retryableErrors.some(pattern => {
      if (typeof pattern === 'string') {
        return error.message.includes(pattern);
      }
      return pattern.test(error.message);
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 