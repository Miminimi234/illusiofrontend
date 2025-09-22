"use client";
import React, { useEffect, useState } from 'react';

export default function EnvTest() {
  const [envVars, setEnvVars] = useState<Record<string, any>>({});

  useEffect(() => {
    // Test environment variables
    const vars = {
      'NEXT_PUBLIC_GROK_API_KEY': process.env.NEXT_PUBLIC_GROK_API_KEY,
      'NEXT_PUBLIC_BIRDEYE_API_KEY': process.env.NEXT_PUBLIC_BIRDEYE_API_KEY,
      'NEXT_PUBLIC_HELIUS_API_KEY': process.env.NEXT_PUBLIC_HELIUS_API_KEY,
      'NEXT_PUBLIC_SERVER_URL': process.env.NEXT_PUBLIC_SERVER_URL,
      'NODE_ENV': process.env.NODE_ENV,
    };
    
    console.log('🔍 Environment Variables Test:', vars);
    setEnvVars(vars);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-red-900/90 border border-red-500 rounded-lg p-4 max-w-sm">
      <h3 className="text-red-400 font-bold mb-2">🚨 Env Test</h3>
      <div className="text-xs space-y-1">
        {Object.entries(envVars).map(([key, value]) => (
          <div key={key} className="flex justify-between">
            <span className="text-red-300">{key}:</span>
            <span className={`font-mono ${
              value ? 'text-green-400' : 'text-red-400'
            }`}>
              {value ? '✅' : '❌'}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 text-xs text-red-300">
        Check browser console for details
      </div>
    </div>
  );
}
