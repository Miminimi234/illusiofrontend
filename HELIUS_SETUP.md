# Helius Live Trades Setup

This document explains how to set up the Helius WebSocket-based live trades system.

## Environment Variables

Add the following environment variable to your `.env.local` file:

```bash
NEXT_PUBLIC_HELIUS_API_KEY=your_helius_api_key_here
```

## Getting a Helius API Key

1. Visit [Helius Dashboard](https://dashboard.helius.xyz/)
2. Sign up for an account
3. Create a new project
4. Copy your API key from the dashboard
5. Add it to your environment variables

## How It Works

The live trades system uses Helius WebSocket API with logsSubscribe to receive real-time transaction notifications:

1. **WebSocket Connection**: Connects to `wss://mainnet.helius-rpc.com/?api-key=YOUR_KEY`
2. **Log Subscription**: Subscribes to logs that mention the selected token's mint address
3. **Transaction Fetching**: When a log is detected, fetches the full transaction details via REST API
4. **Trade Extraction**: Parses SPL token transfers to identify buy/sell trades
5. **Visualization**: Creates photon pairs in the quantum simulation for each trade

## Features

- **Real-time Updates**: Live trades appear instantly as they happen on-chain
- **Automatic Reconnection**: Handles connection drops with exponential backoff
- **Trade Classification**: Attempts to classify trades as BUY or SELL based on transfer patterns
- **Volume Calculation**: Calculates approximate trade volume
- **Error Handling**: Graceful error handling and user feedback

## Trade Detection Logic

The system currently uses a simplified heuristic to detect buy/sell trades:

- **BUY**: Transfer destination contains "pool" or "vault"
- **SELL**: Transfer source contains "pool" or "vault"
- **Fallback**: Random assignment (can be improved with better AMM detection)

## Customization

You can improve the trade detection logic by modifying the `guessSide` function in `hooks/useHeliusTrades.ts`:

```typescript
const guessSide = useCallback((transfer: any, mint: string): 'BUY' | 'SELL' => {
  // Add your custom logic here
  // Consider checking against known AMM pool addresses
  // or analyzing the instruction sequence
}, []);
```

## Troubleshooting

### No Trades Appearing
- Check that your Helius API key is correctly set
- Verify the token address is valid
- Check browser console for WebSocket connection errors

### Connection Issues
- The system automatically attempts to reconnect
- Check your internet connection
- Verify the Helius API key has WebSocket permissions

### Incorrect Trade Classification
- The current buy/sell detection is simplified
- Consider implementing more sophisticated AMM detection
- Check the transfer patterns for your specific token

## API Limits

Helius has rate limits on their WebSocket connections. The system is designed to:
- Use a single connection per token
- Automatically reconnect on failures
- Limit the number of simultaneous photons (30 max)

For production use, consider implementing connection pooling and rate limiting.
