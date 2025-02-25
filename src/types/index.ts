export interface WebsiteConnector {
  name: string;
  baseUrl: string;
  authenticate(): Promise<void>;
  executeAction(action: ActionRequest): Promise<ActionResponse>;
}

export interface ConnectorConfig {
  name: string;
  baseUrl: string;
  authConfig: {
    type: string;
    credentials: {
      username: string;
      password: string;
    };
  };
  rateLimit: {
    requestsPerMinute: number;
    concurrent: number;
  };
}

export interface ActionRequest {
  type: string;
  parameters: Record<string, any>;
  context?: Record<string, any>;
}

export interface ActionResponse {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
  };
}

// New types for price tracking
export interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
  url: string;
  store: string;
  timestamp: Date;
}

export interface PriceAlert {
  productId: string;
  targetPrice: number;
  currentPrice: number;
  store: string;
  triggered: boolean;
} 