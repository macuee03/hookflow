export interface EndpointItem {
  id: string;
  name: string;
  url: string;
  secretKey: string;
  events: string;
  isActive: boolean;
  createdAt: Date;
  _count?: {
    deliveries: number;
  };
}

export interface DeliveryLogItem {
  id: string;
  status: string;
  statusCode: number | null;
  latencyMs: number;
  requestHeaders: string | null;
  requestBody: string;
  responseBody: string | null;
  errorMessage: string | null;
  attemptNumber: number;
  nextRetryAt: Date | null;
  createdAt: Date;
  endpoint: {
    id: string;
    name: string;
    url: string;
  };
  event: {
    id: string;
    eventType: string;
  };
}
