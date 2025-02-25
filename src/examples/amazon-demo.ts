import { MiddlewareService } from '../core/MiddlewareService';
import { EcommerceConnector } from '../connectors/EcommerceConnector';
import { ConnectorConfig } from '../types';
import { Logger } from '../utils/Logger';

async function amazonDemo() {
  const logger = Logger.getInstance();
  logger.info('Starting Amazon demo');

  // Initialize middleware
  const middleware = new MiddlewareService();

  // Create connector config for Amazon
  const config: ConnectorConfig = {
    name: 'amazon',
    baseUrl: 'https://www.amazon.com',
    authConfig: {
      type: 'basic',
      credentials: {
        username: '',
        password: ''
      }
    },
    rateLimit: {
      requestsPerMinute: 10,
      concurrent: 1
    }
  };

  // Create and register connector
  const connector = new EcommerceConnector(config.name, config.baseUrl, config);
  middleware.getConnectorRegistry().registerConnector(connector);

  try {
    // Search for a product
    logger.info('Searching for laptops...');
    const searchResult = await middleware.executeAction('amazon', {
      type: 'search_products',
      parameters: {
        query: 'laptop',
        maxResults: 5
      }
    });

    // Display results
    console.log('\nSearch Results:');
    console.log('==============');
    if (searchResult.success && searchResult.data) {
      searchResult.data.forEach((product: any, index: number) => {
        console.log(`\n${index + 1}. ${product.name}`);
        console.log(`   Price: ${product.price}`);
        console.log(`   ID: ${product.id}`);
      });
    }

  } catch (error) {
    if (error instanceof Error) {
      logger.error('Demo failed', error);
    }
  }
}

// Run the demo
console.log('Starting Amazon product search demo...\n');
amazonDemo().catch((error) => {
  if (error instanceof Error) {
    console.error('Demo failed:', error.message);
  }
}); 