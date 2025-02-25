import type { Browser, Page, HTTPRequest } from 'puppeteer';
import puppeteer from 'puppeteer';
import { WebsiteConnector, ActionRequest, ActionResponse, ConnectorConfig } from '../types';
import { RateLimiter } from '../utils/RateLimiter';

export abstract class BaseConnector implements WebsiteConnector {
  protected browser: Browser | null = null;
  protected rateLimiter: RateLimiter;
  
  constructor(
    public readonly name: string,
    public readonly baseUrl: string,
    protected config: ConnectorConfig
  ) {
    this.rateLimiter = new RateLimiter(config.rateLimit);
  }

  abstract authenticate(): Promise<void>;
  
  async executeAction(action: ActionRequest): Promise<ActionResponse> {
    return this.executeUIAction(action);
  }
  
  protected async initBrowser(): Promise<void> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox']
      });
    }
  }

  protected async executeUIAction(
    action: ActionRequest
  ): Promise<ActionResponse> {
    await this.rateLimiter.acquire();
    
    try {
      await this.initBrowser();
      const page = await this.browser!.newPage();
      
      // Set up request interception and monitoring
      await page.setRequestInterception(true);
      page.on('request', (request: HTTPRequest) => {
        // Add custom headers, handle authentication, etc.
        request.continue();
      });

      // Execute the actual UI interaction
      const result = await this.performUIAction(page, action);
      
      await page.close();
      return result;
    } catch (error) {
      const err = error as Error;
      return {
        success: false,
        error: {
          code: 'UI_ACTION_FAILED',
          message: err.message
        }
      };
    } finally {
      this.rateLimiter.release();
    }
  }

  protected abstract performUIAction(
    page: Page,
    action: ActionRequest
  ): Promise<ActionResponse>;
} 