import { MiddlewareService } from '../core/MiddlewareService';
import { EcommerceConnector } from '../connectors/EcommerceConnector';
import { ConnectorConfig } from '../types';

async function main() {
  // Initialize the middleware service
  const middleware = new MiddlewareService();
  
  // Create and register a connector
  const config: ConnectorConfig = {
    name: 'example-store',
    baseUrl: 'https://example-store.com',
    authConfig: {
      type: 'basic',
      credentials: {
        username: process.env.STORE_USERNAME || '',
        password: process.env.STORE_PASSWORD || ''
      }
    },
    rateLimit: {
      requestsPerMinute: 60,
      concurrent: 2
    }
  };

  const connector = new EcommerceConnector(config.name, config.baseUrl, config);
  middleware.getConnectorRegistry().registerConnector(connector);

  // Execute a search action
  try {
    const result = await middleware.executeAction('example-store', {
      type: 'search_products',
      parameters: {
        query: 'laptop'
      }
    });

    console.log('Search results:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

main().catch(console.error); 