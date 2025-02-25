import { MiddlewareService } from '../core/MiddlewareService';
import { EcommerceConnector } from '../connectors/EcommerceConnector';
import { ConnectorConfig, Product, PriceAlert } from '../types';
import { Logger } from '../utils/Logger';
import readline from 'readline';
import { config } from '../config';

class InteractivePriceTracker {
  private middleware: MiddlewareService;
  private logger: Logger;
  private priceAlerts: Map<string, PriceAlert> = new Map();
  private rl: readline.Interface;
  
  constructor() {
    this.middleware = new MiddlewareService();
    this.logger = Logger.getInstance();
    this.setupConnectors();
    
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    this.logger.info(`Using server at http://localhost:${config.server.currentPort}`);
  }
  
  private setupConnectors() {
    const stores = [
      { name: 'amazon', baseUrl: 'https://www.amazon.com' },
      { name: 'bestbuy', baseUrl: 'https://www.bestbuy.com' }
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

  private async question(query: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(query, resolve);
    });
  }

  async start() {
    try {
      while (true) {
        console.log('\n=== Price Tracker Menu ===');
        console.log('1. Search for products');
        console.log('2. Set price alert');
        console.log('3. Check price alerts');
        console.log('4. List active alerts');
        console.log('5. Exit');
        
        const choice = await this.question('\nEnter your choice (1-5): ');
        
        switch (choice) {
          case '1':
            await this.searchProducts();
            break;
          case '2':
            await this.createPriceAlert();
            break;
          case '3':
            await this.checkAlerts();
            break;
          case '4':
            this.listAlerts();
            break;
          case '5':
            console.log('Goodbye!');
            this.rl.close();
            return;
          default:
            console.log('Invalid choice. Please try again.');
        }
      }
    } catch (error) {
      console.error('An error occurred:', error);
      this.rl.close();
    }
  }

  private async searchProducts() {
    const query = await this.question('Enter product to search for: ');
    console.log('\nSearching...');
    
    const products = await this.searchProductsFromStores(query);
    
    if (products.length > 0) {
      console.log('\nFound products:');
      products.forEach((p: Product, i: number) => {
        console.log(`\n${i + 1}. ${p.name}`);
        console.log(`   Store: ${p.store}`);
        console.log(`   Price: $${p.price}`);
        console.log(`   URL: ${p.url}`);
      });
    } else {
      console.log('No products found.');
    }
  }

  private async searchProductsFromStores(query: string): Promise<Product[]> {
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

  private async createPriceAlert() {
    const query = await this.question('Enter product to track: ');
    const products = await this.searchProductsFromStores(query);
    
    if (products.length > 0) {
      console.log('\nFound products:');
      products.forEach((p: Product, i: number) => {
        console.log(`${i + 1}. ${p.name} - ${p.store} - $${p.price}`);
      });
      
      const index = parseInt(await this.question('\nSelect product number: ')) - 1;
      if (index >= 0 && index < products.length) {
        const product = products[index];
        const targetPrice = parseFloat(await this.question('Enter target price: '));
        
        await this.setPriceAlert(product, targetPrice);
        console.log(`Alert set for ${product.name} at $${targetPrice}`);
      }
    } else {
      console.log('No products found.');
    }
  }

  private async checkAlerts() {
    console.log('Checking price alerts...');
    await this.checkPriceAlerts();
    console.log('Done checking alerts.');
  }

  private listAlerts() {
    if (this.priceAlerts.size === 0) {
      console.log('No active price alerts.');
      return;
    }
    
    console.log('\nActive price alerts:');
    this.priceAlerts.forEach((alert, id) => {
      console.log(`\nProduct ID: ${id}`);
      console.log(`Target price: $${alert.targetPrice}`);
      console.log(`Current price: $${alert.currentPrice}`);
      console.log(`Store: ${alert.store}`);
      console.log(`Status: ${alert.triggered ? 'Triggered' : 'Watching'}`);
    });
  }

  private async setPriceAlert(product: Product, targetPrice: number): Promise<void> {
    this.priceAlerts.set(product.id, {
      productId: product.id,
      targetPrice,
      currentPrice: product.price,
      store: product.store,
      triggered: false
    });
    
    this.logger.info(`Price alert set for ${product.name} at ${targetPrice}`);
  }

  private async checkPriceAlerts(): Promise<void> {
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
          }
        }
      } catch (error) {
        this.logger.error(`Error checking price alert for ${productId}`, error as Error);
      }
    }
  }
}

// Run the interactive tracker
console.log('Starting Interactive Price Tracker...\n');
const tracker = new InteractivePriceTracker();
tracker.start().catch(console.error); 