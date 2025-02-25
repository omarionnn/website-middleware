import { MiddlewareService } from '../core/MiddlewareService';
import { EcommerceConnector } from '../connectors/EcommerceConnector';
import { ConnectorConfig } from '../types';

async function testRateLimiting() {
  const middleware = new MiddlewareService();
  
  // Configure with strict rate limits
  const config: ConnectorConfig = {
    name: 'amazon',
    baseUrl: 'https://www.amazon.com',
    authConfig: {
      type: 'basic',
      credentials: { username: '', password: '' }
    },
    rateLimit: {
      requestsPerMinute: 2, // Very low limit for testing
      concurrent: 1
    }
  };

  const connector = new EcommerceConnector(config.name, config.baseUrl, config);
  middleware.getConnectorRegistry().registerConnector(connector);

  // Make multiple requests rapidly
  const queries = ['laptop', 'phone', 'tablet', 'watch'];
  
  console.log('Starting rate limit test...');
  const startTime = Date.now();

  const results = await Promise.allSettled(
    queries.map(query => 
      middleware.executeAction('amazon', {
        type: 'search_products',
        parameters: { query }
      })
    )
  );

  const duration = Date.now() - startTime;
  console.log(`Test completed in ${duration}ms`);
  
  results.forEach((result, index) => {
    console.log(`Query "${queries[index]}": ${result.status}`);
  });
}

testRateLimiting().catch(console.error); 