import { NextRequest, NextResponse } from 'next/server';

interface Holder {
  address: string;
  balance: number;
  percentage: number;
  firstTransaction: number;
  lastTransaction: number;
  transactionCount: number;
  isCreator: boolean;
  isWhale: boolean;
  isLiquidityPool?: boolean;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mintAddress = searchParams.get('mint');
  
  if (!mintAddress) {
    return NextResponse.json({ error: 'Mint address is required' }, { status: 400 });
  }

  const heliusApiKey = process.env.HELIUS_API_KEY;
  
  if (!heliusApiKey) {
    return NextResponse.json({ error: 'Helius API key not configured' }, { status: 500 });
  }

  try {
    // Fetch token holders using Helius RPC getProgramAccounts
    const response = await fetch(`https://mainnet.helius-rpc.com/?api-key=${heliusApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getProgramAccounts',
        params: [
          'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // TOKEN_PROGRAM_ID
          {
            encoding: 'jsonParsed',
            filters: [
              { dataSize: 165 }, // Token account size
              { 
                memcmp: { 
                  offset: 0, 
                  bytes: mintAddress // Token mint address
                } 
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Helius RPC error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.result && Array.isArray(data.result)) {
      // Calculate total supply for percentage calculation
      const totalSupply = data.result.reduce((sum: number, account: any) => {
        return sum + (account.account.data.parsed.info.tokenAmount.uiAmount || 0);
      }, 0);

      // Process token accounts into holders
      const holders: Holder[] = [];
      
      for (const account of data.result) {
        const tokenInfo = account.account.data.parsed.info;
        const address = tokenInfo.owner;
        const balance = tokenInfo.tokenAmount.uiAmount || 0;
        
        // Filter out invalid holders
        if (!address || 
            address === mintAddress || 
            address.length <= 20 || 
            balance <= 0) {
          continue;
        }

        const percentage = totalSupply > 0 ? (balance / totalSupply) * 100 : 0;
        
        // Determine holder type based on percentage and patterns
        const isLiquidityPool = address.includes('pool') || 
                              address.includes('liquidity') ||
                              percentage > 20; // Large holders might be pools
        
        const isWhale = !isLiquidityPool && percentage > 4; // 4%+ holders are whales
        const isCreator = false; // Would need additional data to determine
        
        holders.push({
          address,
          balance,
          percentage,
          firstTransaction: 0, // Will be fetched separately for top holders
          lastTransaction: 0,
          transactionCount: 0,
          isCreator,
          isWhale,
          isLiquidityPool
        });
      }

      // Sort by percentage descending
      holders.sort((a, b) => b.percentage - a.percentage);

      // Fetch transaction history for top 10 holders only
      const topHolders = holders.slice(0, 10);
      
      for (const holder of topHolders) {
        try {
          const txHistory = await fetchHolderTransactionHistory(holder.address, heliusApiKey);
          holder.firstTransaction = txHistory.firstTransaction;
          holder.lastTransaction = txHistory.lastTransaction;
          holder.transactionCount = txHistory.transactionCount;
        } catch (error) {
          console.log(`Failed to fetch tx history for ${holder.address}:`, error);
        }
      }

      // Return top 25 holders
      return NextResponse.json({ holders: holders.slice(0, 25) });
    } else {
      return NextResponse.json({ holders: [] });
    }
  } catch (error) {
    console.error("Error fetching holders from Helius:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch holders' 
    }, { status: 500 });
  }
}

async function fetchHolderTransactionHistory(holderAddress: string, heliusApiKey: string) {
  try {
    const response = await fetch(`https://mainnet.helius-rpc.com/?api-key=${heliusApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getSignaturesForAddress',
        params: [holderAddress, { limit: 50 }] // Limit to save API credits
      })
    });

    if (response.ok) {
      const data = await response.json();
      
      if (data.result && Array.isArray(data.result) && data.result.length > 0) {
        // Sort by blockTime to get first and last transactions
        const sortedTxs = data.result.sort((a: any, b: any) => {
          const timeA = a.blockTime || 0;
          const timeB = b.blockTime || 0;
          return timeA - timeB;
        });

        const firstTx = sortedTxs[0];
        const lastTx = sortedTxs[sortedTxs.length - 1];

        return {
          firstTransaction: firstTx.blockTime || 0,
          lastTransaction: lastTx.blockTime || 0,
          transactionCount: data.result.length
        };
      }
    }
    
    return {
      firstTransaction: 0,
      lastTransaction: 0,
      transactionCount: 0
    };
  } catch (error) {
    console.log('Error fetching transaction history:', error);
    return {
      firstTransaction: 0,
      lastTransaction: 0,
      transactionCount: 0
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { mintAddress } = await request.json();
    
    if (!mintAddress) {
      return NextResponse.json({ error: 'Mint address is required' }, { status: 400 });
    }

    // Redirect to GET method
    const url = new URL(request.url);
    url.searchParams.set('mint', mintAddress);
    
    return NextResponse.redirect(url.toString().replace('/POST', ''));
  } catch (error) {
    console.error("Error in POST holders:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to process request' 
    }, { status: 500 });
  }
}
