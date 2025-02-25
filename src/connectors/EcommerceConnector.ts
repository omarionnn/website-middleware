import { BaseConnector } from './BaseConnector';
import { ActionRequest, ActionResponse } from '../types';
import puppeteer from 'puppeteer';
import type { Page } from 'puppeteer';

interface ProductResult {
  id: string | null;
  name: string | null;
  price: string | null;
}

export class EcommerceConnector extends BaseConnector {
  async authenticate(): Promise<void> {
    // Implement authentication logic
    const page = await this.browser!.newPage();
    await page.goto(`${this.baseUrl}/login`);
    
    await page.type('#email', this.config.authConfig.credentials.username);
    await page.type('#password', this.config.authConfig.credentials.password);
    await page.click('#login-button');
    
    // Wait for authentication to complete
    await page.waitForNavigation();
    await page.close();
  }

  async executeAction(action: ActionRequest): Promise<ActionResponse> {
    switch (action.type) {
      case 'search_products':
        return this.executeUIAction(action);
      case 'get_product_details':
        return this.executeUIAction(action);
      default:
        throw new Error(`Unsupported action type: ${action.type}`);
    }
  }

  protected async performUIAction(
    page: Page,
    action: ActionRequest
  ): Promise<ActionResponse> {
    switch (action.type) {
      case 'search_products':
        await page.goto(`${this.baseUrl}/s?k=${encodeURIComponent(action.parameters.query)}`);
        await page.waitForSelector('.s-result-item');
        
        const products = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('.s-result-item[data-asin]')).map(item => ({
            id: item.getAttribute('data-asin'),
            name: item.querySelector('h2 span')?.textContent?.trim(),
            price: item.querySelector('.a-price-whole')?.textContent?.trim()
          })) as ProductResult[];
        });

        return {
          success: true,
          data: products.filter(p => p.id && p.name && p.price).slice(0, 5)
        };

      default:
        return {
          success: false,
          error: {
            code: 'UNSUPPORTED_ACTION',
            message: `Action type ${action.type} is not supported`
          }
        };
    }
  }
} 