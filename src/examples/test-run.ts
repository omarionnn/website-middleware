import { MiddlewareService } from '../core/MiddlewareService';
import { EcommerceConnector } from '../connectors/EcommerceConnector';
import { ConnectorConfig } from '../types';
import { Logger } from '../utils/Logger';

async function testRun() {
  const logger = Logger.getInstance();
  logger.info('Starting test run');

  // Initialize middleware
  const middleware = new MiddlewareService();

  // Create connector config
  const config: ConnectorConfig = {
    name: 'test-store',
    baseUrl: 'https://example.com',
    authConfig: {
      type: 'basic',
      credentials: {
        username: 'test',
        password: 'test'
      }
    },
    rateLimit: {
      requestsPerMinute: 60,
      concurrent: 2
    }
  };

  // Create and register connector
  const connector = new EcommerceConnector(config.name, config.baseUrl, config);
  middleware.getConnectorRegistry().registerConnector(connector);

  try {
    // Test search products
    logger.info('Testing search products');
    const searchResult = await middleware.executeAction('test-store', {
      type: 'search_products',
      parameters: {
        query: 'laptop'
      }
    });
    console.log('Search Results:', searchResult);

    // Test error handling
    logger.info('Testing error handling');
    await middleware.executeAction('non-existent', {
      type: 'search_products',
      parameters: { query: 'test' }
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    logger.error('Test run failed', err);
  }
}

testRun().catch(console.error); 