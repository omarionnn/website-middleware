import { MiddlewareService } from '../core/MiddlewareService';
import { EcommerceConnector } from '../connectors/EcommerceConnector';
import { ConnectorConfig } from '../types';
import { RetryMechanism } from '../utils/RetryMechanism';

async function testErrorRecovery() {
  const middleware = new MiddlewareService();
  
  const retryConfig = {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 5000,
    backoffFactor: 2,
    retryableErrors: ['timeout', 'network error']
  };

  const retry = new RetryMechanism(retryConfig);

  try {
    await retry.execute(
      async () => {
        const result = await middleware.executeAction('amazon', {
          type: 'search_products',
          parameters: { query: 'test' }
        });
        return result;
      },
      'product search'
    );
  } catch (error) {
    console.error('Final error after retries:', error);
  }
}

testErrorRecovery().catch(console.error); 