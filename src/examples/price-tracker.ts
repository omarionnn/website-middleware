import { MiddlewareService } from '../core/MiddlewareService';
import { EcommerceConnector } from '../connectors/EcommerceConnector';
import { ConnectorConfig, Product, PriceAlert } from '../types';
import { Logger } from '../utils/Logger';

class PriceTracker {
  private middleware: MiddlewareService;
  private logger: Logger;
  private priceAlerts: Map<string, PriceAlert> = new Map();
  
  constructor() {
    this.middleware = new MiddlewareService();
    this.logger = Logger.getInstance();
    
    // Initialize connectors
    this.setupConnectors();
  }
  
  private setupConnectors() {
    const stores = [
      {
        name: 'amazon',
        baseUrl: 'https://www.amazon.com',
      },
      {
        name: 'bestbuy',
        baseUrl: 'https://www.bestbuy.com',
      }
    ];
    
    stores.forEach(store => {
      const config: ConnectorConfig = {
        name: store.name,
        baseUrl: store.baseUrl,
        authConfig: {
          type: 'basic',
          credentials: { username: '', password: '' }
        },
        rateLimit: {
          requestsPerMinute: 10,
          concurrent: 1
        }
      };
      
      const connector = new EcommerceConnector(config.name, config.baseUrl, config);
      this.middleware.getConnectorRegistry().registerConnector(connector);
    });
  }
  
  async searchProduct(query: string): Promise<Product[]> {
    const stores = ['amazon', 'bestbuy'];
    const results: Product[] = [];
    
    for (const store of stores) {
      try {
        const response = await this.middleware.executeAction(store, {
          type: 'search_products',
          parameters: { query }
        });
        
        if (response.success && response.data) {
          results.push(...this.normalizeProducts(response.data, store));
        }
      } catch (error) {
        this.logger.error(`Error searching ${store}`, error as Error);
      }
    }
    
    return results;
  }
  
  private normalizeProducts(products: any[], store: string): Product[] {
    return products.map(p => ({
      id: p.id,
      name: p.name,
      price: this.extractPrice(p.price),
      currency: 'USD',
      url: `${store === 'amazon' ? 'https://www.amazon.com/dp/' : 'https://www.bestbuy.com/site/'}${p.id}`,
      store,
      timestamp: new Date()
    }));
  }
  
  private extractPrice(priceStr: string): number {
    return parseFloat(priceStr.replace(/[^0-9.]/g, ''));
  }
  
  async setPriceAlert(product: Product, targetPrice: number): Promise<void> {
    this.priceAlerts.set(product.id, {
      productId: product.id,
      targetPrice,
      currentPrice: product.price,
      store: product.store,
      triggered: false
    });
    
    this.logger.info(`Price alert set for ${product.name} at ${targetPrice}`);
  }
  
  async checkPriceAlerts(): Promise<void> {
    for (const [productId, alert] of this.priceAlerts) {
      if (alert.triggered) continue;
      
      try {
        const response = await this.middleware.executeAction(alert.store, {
          type: 'search_products',
          parameters: { query: productId }
        });
        
        if (response.success && response.data?.[0]) {
          const currentPrice = this.extractPrice(response.data[0].price);
          
          if (currentPrice <= alert.targetPrice) {
            this.logger.info(`Price alert triggered for product ${productId}!`);
            this.logger.info(`Current price: ${currentPrice}, Target: ${alert.targetPrice}`);
            
            alert.triggered = true;
            alert.currentPrice = currentPrice;
            // Here you could send notifications, emails, etc.
          }
        }
      } catch (error) {
        this.logger.error(`Error checking price alert for ${productId}`, error as Error);
      }
    }
  }
}

// Usage example
async function runPriceTracker() {
  const tracker = new PriceTracker();
  
  // Search for a product
  console.log('Searching for MacBook Pro...');
  const products = await tracker.searchProduct('MacBook Pro 16');
  
  if (products.length > 0) {
    console.log('\nFound products:');
    products.forEach(p => {
      console.log(`${p.name} - ${p.store} - $${p.price}`);
    });
    
    // Set price alert for the first product
    const targetPrice = products[0].price - 100; // Alert if price drops by $100
    await tracker.setPriceAlert(products[0], targetPrice);
    console.log(`\nSet price alert for ${products[0].name} at $${targetPrice}`);
    
    // Check alerts (in real usage, this would be on a timer)
    console.log('\nChecking price alerts...');
    await tracker.checkPriceAlerts();
  }
}

// Run the example
console.log('Starting Price Tracker Demo...\n');
runPriceTracker().catch(console.error); 