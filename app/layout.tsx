import './globals.css'

export const metadata = {
  title: 'Illusio — Retrocausal Market Engine',
  description: 'A Solana-native prediction framework fusing quantum logic, retrocausality, and simulation theory to forecast market movements beyond probability.',
  viewport: {
    width: 'device-width',
    initialScale: 1,
  },
}



export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Prevent flash on mobile pages */}
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Allow geometry background to show */
            body {
              background-color: transparent !important;
            }
            #app {
              background-color: transparent !important;
            }
            /* Mobile styles */
            @media (max-width: 768px) {
              body, #app {
                background-color: transparent !important;
                color: #ffffff !important;
                overflow: hidden !important;
                position: fixed !important;
                width: 100% !important;
                height: 100% !important;
                touch-action: none !important;
                user-select: none !important;
                cursor: none !important;
              }
              html {
                overflow: hidden !important;
                height: 100% !important;
                cursor: none !important;
              }
              * {
                cursor: none !important;
              }
            }
          `
        }} />
        {/* Immediate script to prevent flash */}
        <script dangerouslySetInnerHTML={{
          __html: `
            // Set background immediately to prevent flash
            if (typeof document !== 'undefined') {
              document.documentElement.style.backgroundColor = 'transparent';
              document.body.style.backgroundColor = 'transparent';
              const app = document.getElementById('app');
              if (app) {
                app.style.backgroundColor = 'transparent';
              }
              
              // Mobile detection removed - let the mobile page handle its own content
            }
          `
        }} />
        {/* Prevent MetaMask from trying to connect to this Solana app */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Block MetaMask injection
              if (typeof window !== 'undefined') {
                window.ethereum = undefined;
                window.web3 = undefined;
                // Prevent MetaMask from detecting this as a web3 site
                Object.defineProperty(window, 'ethereum', {
                  get: () => undefined,
                  set: () => {},
                  configurable: false
                });
              }
            `,
          }}
        />
      </head>
      <body>
        <div id="app">{children}</div>
      </body>
    </html>
  )
}
