export class RateLimiter {
  private queue: Array<() => void> = [];
  private running = 0;
  private tokenBucket = 0;
  private lastRefill = Date.now();

  constructor(
    private config: {
      requestsPerMinute: number;
      concurrent: number;
    }
  ) {
    this.refillTokens();
    setInterval(() => this.refillTokens(), 1000); // Refill tokens every second
  }

  private refillTokens() {
    const now = Date.now();
    const tokensToAdd = ((now - this.lastRefill) / 1000) * (this.config.requestsPerMinute / 60);
    this.tokenBucket = Math.min(this.config.requestsPerMinute, this.tokenBucket + tokensToAdd);
    this.lastRefill = now;
  }

  async acquire(): Promise<void> {
    if (this.tokenBucket < 1 || this.running >= this.config.concurrent) {
      await new Promise<void>(resolve => this.queue.push(resolve));
    }
    
    this.tokenBucket--;
    this.running++;
  }

  release(): void {
    this.running--;
    if (this.queue.length > 0 && this.tokenBucket >= 1) {
      const next = this.queue.shift();
      if (next) next();
    }
  }
} 