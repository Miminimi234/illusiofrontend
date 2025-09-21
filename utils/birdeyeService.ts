"use client";

export interface BirdeyeToken {
  symbol: string;
  address: string;
  decimals: number;
  price: number;
  amount: string;
  ui_amount: number;
  ui_change_amount: number;
  type_swap: "from" | "to";
  is_scaled_ui_token: boolean;
  multiplier: number | null;
}

export interface BirdeyeTrade {
  base: BirdeyeToken;
  quote: BirdeyeToken;
  tx_type: string;
  tx_hash: string;
  ins_index: number;
  inner_ins_index: number;
  block_unix_time: number;
  block_number: number;
  volume_usd: number;
  volume: number;
  owner: string;
  signers: string[];
  source: string;
  interacted_program_id: string;
  pool_id: string;
}

export interface BirdeyeApiResponse {
  success: boolean;
  data: {
    items: BirdeyeTrade[];
    hasNext: boolean;
  };
}

export interface TradeFilter {
  tokenAddress?: string;
  limit?: number;
  txType?: 'swap' | 'buy' | 'sell';
}

export interface TradeSubscription {
  id: string;
  tokenAddress: string;
  callback: (trades: BirdeyeTrade[]) => void;
  filter?: TradeFilter;
  isActive: boolean;
}

class BirdeyeService {
  private apiKey: string;
  private baseUrl: string;
  private subscriptions: Map<string, TradeSubscription> = new Map();
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private abortControllers: Map<string, AbortController> = new Map();

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_BIRDEYE_API_KEY || '';
    this.baseUrl = 'https://public-api.birdeye.so/defi/v3';
  }

  /**
   * Fetch recent trades from Birdeye API
   */
  async fetchRecentTrades(filter: TradeFilter = {}): Promise<BirdeyeTrade[]> {
    const {
      tokenAddress,
      limit = 100,
      txType = 'swap'
    } = filter;

    try {
      const response = await fetch(`${this.baseUrl}/txs/recent?offset=0&limit=${limit}&tx_type=${txType}&ui_amount_mode=scaled`, {
        method: 'GET',
        headers: {
          'X-API-KEY': this.apiKey,
          'Accept': 'application/json',
          'X-Chain': 'solana'
        }
      });

      if (!response.ok) {
        throw new Error(`Birdeye API error: ${response.status} ${response.statusText}`);
      }

      const data: BirdeyeApiResponse = await response.json();

      if (!data.success || !data.data || !data.data.items) {
        throw new Error('Invalid response from Birdeye API');
      }

      let trades = data.data.items;

      // Filter by token address if provided
      if (tokenAddress) {
        trades = trades.filter(trade => 
          trade.base.address === tokenAddress || trade.quote.address === tokenAddress
        );
      }

      // Apply additional filters
      if (txType === 'buy') {
        trades = trades.filter(trade => {
          const isTokenBase = trade.base.address === tokenAddress;
          const isTokenQuote = trade.quote.address === tokenAddress;
          return (isTokenBase && trade.base.type_swap === 'to') || 
                 (isTokenQuote && trade.quote.type_swap === 'to');
        });
      } else if (txType === 'sell') {
        trades = trades.filter(trade => {
          const isTokenBase = trade.base.address === tokenAddress;
          const isTokenQuote = trade.quote.address === tokenAddress;
          return (isTokenBase && trade.base.type_swap === 'from') || 
                 (isTokenQuote && trade.quote.type_swap === 'from');
        });
      }

      return trades;
    } catch (error) {
      console.error('Error fetching trades from Birdeye:', error);
      throw error;
    }
  }

  /**
   * Subscribe to live trades for a specific token
   */
  subscribeToTrades(
    tokenAddress: string, 
    callback: (trades: BirdeyeTrade[]) => void,
    options: {
      filter?: TradeFilter;
      interval?: number; // milliseconds
      maxTrades?: number;
    } = {}
  ): string {
    const subscriptionId = `trade_${tokenAddress}_${Date.now()}`;
    const { filter = {}, interval = 3000, maxTrades = 3 } = options;

    const subscription: TradeSubscription = {
      id: subscriptionId,
      tokenAddress,
      callback,
      filter: { ...filter, tokenAddress },
      isActive: true
    };

    this.subscriptions.set(subscriptionId, subscription);

    // Start polling
    this.startPolling(subscriptionId, interval, maxTrades);

    return subscriptionId;
  }

  /**
   * Unsubscribe from trades
   */
  unsubscribeFromTrades(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.isActive = false;
      this.subscriptions.delete(subscriptionId);
    }

    // Clear polling interval
    const interval = this.pollingIntervals.get(subscriptionId);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(subscriptionId);
    }

    // Abort any pending requests
    const controller = this.abortControllers.get(subscriptionId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(subscriptionId);
    }
  }

  /**
   * Start polling for trades
   */
  private startPolling(subscriptionId: string, interval: number, maxTrades: number): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return;

    // Initial fetch
    this.fetchTradesForSubscription(subscriptionId, maxTrades);

    // Set up polling interval
    const pollingInterval = setInterval(async () => {
      if (!subscription.isActive) {
        clearInterval(pollingInterval);
        return;
      }
      await this.fetchTradesForSubscription(subscriptionId, maxTrades);
    }, interval);

    this.pollingIntervals.set(subscriptionId, pollingInterval);
  }

  /**
   * Fetch trades for a specific subscription
   */
  private async fetchTradesForSubscription(subscriptionId: string, maxTrades: number): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription || !subscription.isActive) return;

    try {
      // Create new abort controller for this request
      const controller = new AbortController();
      this.abortControllers.set(subscriptionId, controller);

      const trades = await this.fetchRecentTrades(subscription.filter);
      
      // Limit to max trades
      const limitedTrades = trades.slice(0, maxTrades);
      
      // Call the callback with new trades
      subscription.callback(limitedTrades);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error(`Error in trade subscription ${subscriptionId}:`, error);
      }
    }
  }

  /**
   * Get all active subscriptions
   */
  getActiveSubscriptions(): TradeSubscription[] {
    return Array.from(this.subscriptions.values()).filter(sub => sub.isActive);
  }

  /**
   * Clear all subscriptions
   */
  clearAllSubscriptions(): void {
    this.subscriptions.forEach((subscription, id) => {
      this.unsubscribeFromTrades(id);
    });
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Get API status
   */
  async getApiStatus(): Promise<{ connected: boolean; error?: string }> {
    try {
      await this.fetchRecentTrades({ limit: 1 });
      return { connected: true };
    } catch (error) {
      return { 
        connected: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

// Export singleton instance
export const birdeyeService = new BirdeyeService();
export default birdeyeService;
