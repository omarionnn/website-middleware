import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { MiddlewareService } from '../core/MiddlewareService';
import { EcommerceConnector } from '../connectors/EcommerceConnector';
import { ConnectorConfig } from '../types';
import { Logger } from '../utils/Logger';
import { config } from '../config';

const app = express();
const logger = Logger.getInstance();

// Middleware setup
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize the middleware service
const middleware = new MiddlewareService();

// Configure and register connectors
const amazonConfig: ConnectorConfig = {
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

const amazonConnector = new EcommerceConnector(
  amazonConfig.name,
  amazonConfig.baseUrl,
  amazonConfig
);
middleware.getConnectorRegistry().registerConnector(amazonConnector);

// API Routes
app.post('/api/search', async (req: Request, res: Response) => {
  try {
    const { connector, query } = req.body;
    logger.info('Search request received', { connector, query });

    const result = await middleware.executeAction(connector, {
      type: 'search_products',
      parameters: { query }
    });

    res.json(result);
  } catch (error) {
    logger.error('Search failed', error as Error);
    res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

app.get('/api/connectors', (_req: Request, res: Response) => {
  const connectors = middleware.getConnectorRegistry().listConnectors();
  res.json(connectors);
});

// Start server with port fallback
async function startServer() {
  const ports = [config.server.basePort, ...config.server.fallbackPorts];
  
  for (const port of ports) {
    try {
      await new Promise((resolve, reject) => {
        const server = app.listen(port)
          .once('listening', () => {
            config.server.currentPort = port; // Store the active port
            logger.info(`Server running at http://localhost:${port}`);
            resolve(server);
          })
          .once('error', reject);
      });
      return;
    } catch (err) {
      if (port === ports[ports.length - 1]) {
        throw new Error('No available ports found');
      }
      logger.warn(`Port ${port} in use, trying next port`);
    }
  }
}

startServer().catch(error => {
  logger.error('Failed to start server:', error);
  process.exit(1);
}); 