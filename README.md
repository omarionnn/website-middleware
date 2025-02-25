# E-commerce Price Tracker

A TypeScript-based middleware system that transforms e-commerce websites into programmable APIs for automated price tracking and monitoring.

## Overview

This project provides a robust framework for:
- Converting e-commerce websites into structured APIs
- Real-time price monitoring across multiple platforms
- Setting and managing price alerts
- Rate-limited web scraping with error handling

## Features

- **Multi-Store Support**: Track prices across Amazon, Best Buy, and more
- **Interactive CLI**: User-friendly command-line interface for price tracking
- **Rate Limiting**: Smart request throttling to respect website policies
- **Error Recovery**: Automatic retries and error handling
- **Standardized API**: Consistent interface across different platforms

## Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm run serve

# In another terminal, run the price tracker
npm run track
```

## Usage

### Interactive Price Tracker

```bash
npm run track

=== Price Tracker Menu ===
1. Search for products
2. Set price alerts
3. Check price alerts
4. List active alerts
5. Exit
```

### API Endpoints

```bash
# Get available connectors
GET /api/connectors

# Search for products
POST /api/search
{
    "connector": "amazon",
    "query": "macbook pro"
}
```

## Project Structure

```
src/
├── config/         # Server and connector configurations
├── connectors/     # E-commerce platform connectors
├── core/          # Core middleware functionality
├── examples/      # Usage examples and demos
├── server/        # API server implementation
├── types/         # TypeScript type definitions
└── utils/         # Utility functions and helpers
```

## Development

```bash
# Run in development mode
npm run dev

# Run tests
npm test

# Build project
npm run build
```

## Configuration

Server configuration in `src/config/index.ts`:
```typescript
export const config = {
  server: {
    basePort: 3000,
    fallbackPorts: [3001, 3002, 3003]
  }
};
```

## Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## License

MIT
