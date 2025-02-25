import { WebsiteConnector } from '../types';

export class ConnectorRegistry {
  private connectors: Map<string, WebsiteConnector> = new Map();

  registerConnector(connector: WebsiteConnector): void {
    this.connectors.set(connector.name, connector);
  }

  getConnector(name: string): WebsiteConnector | undefined {
    return this.connectors.get(name);
  }

  listConnectors(): string[] {
    return Array.from(this.connectors.keys());
  }

  removeConnector(name: string): boolean {
    return this.connectors.delete(name);
  }
} 