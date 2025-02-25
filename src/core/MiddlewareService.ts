import { RateLimiter } from '../utils/RateLimiter';
import { WebsiteConnector, ActionRequest, ActionResponse } from '../types';
import { ConnectorRegistry } from './ConnectorRegistry';
import { StandardizationLayer } from './StandardizationLayer';
import { MonitoringService } from '../monitoring/MonitoringService';

export class MiddlewareService {
  private connectorRegistry: ConnectorRegistry;
  private standardizer: StandardizationLayer;
  private monitoring: MonitoringService;

  constructor() {
    this.connectorRegistry = new ConnectorRegistry();
    this.standardizer = new StandardizationLayer();
    this.monitoring = new MonitoringService();
  }

  async executeAction(
    connectorName: string, 
    action: ActionRequest
  ): Promise<ActionResponse> {
    try {
      const connector = this.connectorRegistry.getConnector(connectorName);
      if (!connector) {
        throw new Error(`Connector ${connectorName} not found`);
      }

      // Standardize the incoming request
      const standardizedRequest = await this.standardizer.standardizeRequest(action);
      
      // Execute the action with monitoring
      const startTime = Date.now();
      const response = await connector.executeAction(standardizedRequest);
      const duration = Date.now() - startTime;

      // Record metrics
      this.monitoring.recordAction(connectorName, action.type, duration, response.success);

      // Standardize the response
      return this.standardizer.standardizeResponse(response);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error occurred');
      this.monitoring.recordError(connectorName, action.type, err);
      throw err;
    }
  }

  public getConnectorRegistry(): ConnectorRegistry {
    return this.connectorRegistry;
  }
} 