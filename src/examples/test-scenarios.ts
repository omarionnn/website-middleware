import { MiddlewareService } from '../core/MiddlewareService';
import { EcommerceConnector } from '../connectors/EcommerceConnector';
import { ConnectorConfig } from '../types';
import { Logger } from '../utils/Logger';

async function runTests() {
  const logger = Logger.getInstance();
  const middleware = new MiddlewareService();

  // Test Configuration
  const config: ConnectorConfig = {
    name: 'amazon',
    baseUrl: 'https://www.amazon.com',
    authConfig: {
      type: 'basic',
      credentials: { username: '', password: '' }
    },
    rateLimit: {
      requestsPerMinute: 10,
      concurrent: 1
    }
  };

  // Register connector
  const connector = new EcommerceConnector(config.name, config.baseUrl, config);
  middleware.getConnectorRegistry().registerConnector(connector);

  try {
    // Test 1: Basic Search
    logger.info('Test 1: Basic Search');
    const basicSearch = await middleware.executeAction('amazon', {
      type: 'search_products',
      parameters: { query: 'laptop' }
    });
    console.log('Basic Search Results:', basicSearch);

    // Test 2: Search with Special Characters
    logger.info('Test 2: Search with Special Characters');
    const specialSearch = await middleware.executeAction('amazon', {
      type: 'search_products',
      parameters: { query: 'gaming laptop 15"' }
    });
    console.log('Special Character Search Results:', specialSearch);

    // Test 3: Rate Limiting
    logger.info('Test 3: Rate Limiting');
    const searches = Array(5).fill(null).map((_, i) => 
      middleware.executeAction('amazon', {
        type: 'search_products',
        parameters: { query: `test ${i}` }
      })
    );
    const rateResults = await Promise.all(searches);
    console.log('Rate Limit Test Complete');

    // Test 4: Error Handling
    logger.info('Test 4: Error Handling');
    try {
      await middleware.executeAction('non-existent', {
        type: 'search_products',
        parameters: { query: 'test' }
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      console.log('Expected error caught:', err.message);
    }

  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    logger.error('Test run failed', err);
  }
}

// Run all tests
console.log('Starting test scenarios...');
runTests().catch(console.error); 