# ILLUSIO

![ILLUSIO Banner](./public/BANNER.png)

[![ILLUSIO Platform](https://img.shields.io/badge/Platform-ILLUSIO-blue?style=for-the-badge&logo=next.js)](https://github.com/greaterdan/FUTURE1) [![Next.js](https://img.shields.io/badge/Next.js-14.2.32-black?style=for-the-badge&logo=next.js)](https://nextjs.org/) [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/) [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/) [![AI Powered](https://img.shields.io/badge/AI-Powered-green?style=for-the-badge&logo=openai)](https://openai.com/) [![Solana](https://img.shields.io/badge/Solana-9945FF?style=for-the-badge&logo=solana&logoColor=white)](https://solana.com/)

A market analysis framework that cuts through the noise to reveal the signal. Built for traders who want clarity over certainty.

## What is ILLUSIO?

ILLUSIO exists because markets behave like a simulation that keeps claiming to be reality. Prices flicker, narratives multiply, and most of what you see is noise laid over a smaller signal. Our job is to build an instrument that lets you see the signal early enough to matter.

## Core Components

**The Analyzer** - Measures what's actually there. Wallets that enter and leave. Liquidity that holds or slips. Order flow that speeds up or stalls. Takes the blur apart and gives it structure you can inspect.

**The Predictor** - Fits trajectories from what has been observed and shows its uncertainty out loud. You get a direction, a speed, and a range rather than a slogan. If the world changes, the fit changes with it.

**The Quantum Eraser** - Removes what should never have counted in the first place. Spoofed orders, wash trades, synthetic depth, and other tricks are filtered out so the remaining history is something you can trust.

**The Retrocausality Lab** - Runs many possible futures and looks for the footprints they would leave in the present. When those footprints begin to appear in live data, confidence rises. When they fail to appear, confidence falls.

## ✨ Key Features

### 🎯 **Market Analysis**
- **Real-time Token Data**: Live market data with instant updates
- **Advanced Filtering**: Smart token filtering and search functionality
- **Token Insights**: Detailed analysis and market information
- **Multi-Column Layout**: Organized view with different token categories

### 🤖 **AI-Powered Analysis**
- **Interactive AI Companions**: Drag-and-drop AI agents for token analysis
- **Real-time Chat**: Communicate with AI about token performance
- **Predictive Analytics**: AI-driven market predictions and forecasts
- **Pattern Recognition**: Advanced algorithms for signal detection

### 🔬 **Retrocausality Lab**
- **Live Transaction Visualization**: Real-time quantum eraser diagram
- **Interactive Controls**: Zoom, pan, and explore the visualization
- **Live Data Integration**: Transactions flow through the quantum setup
- **Confidence Indicators**: Visual feedback on prediction accuracy

### 🎨 **Immersive Interface**
- **Quantum Geometry**: Futuristic design with animated elements
- **Background Videos**: Dynamic video backgrounds
- **Smooth Animations**: Framer Motion powered transitions
- **Responsive Design**: Optimized for all screen sizes

## 🛠️ Technology Stack

### **Frontend**
- **Next.js 14.2.32** - React framework with App Router
- **TypeScript 5.0** - Type-safe development
- **Tailwind CSS 3.0** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **React Hooks** - State management and side effects

### **Backend**
- **Express.js** - Server framework
- **PostgreSQL** - Database for token metadata
- **WebSocket** - Real-time data streaming
- **Helius API** - Solana blockchain integration
- **Birdeye API** - Market data aggregation

### **AI Integration**
- **OpenAI GPT** - Advanced language models
- **Grok AI** - Real-time market analysis
- **Custom AI Models** - Specialized trading algorithms
- **Natural Language Processing** - Chat interface

### **Blockchain**
- **Solana RPC** - Direct blockchain access
- **Token Metadata** - Comprehensive token information
- **Transaction Analysis** - Real-time trade monitoring
- **Market Data** - Price, volume, and liquidity tracking

## 📁 Project Structure

```
ILLUSIO/
├── app/                           # Next.js App Router
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   └── mobile/                   # Mobile-specific pages
├── components/                   # React components
│   ├── NavigationHub.tsx         # Main trading interface
│   ├── TokenSpecificTransactions.tsx # Token analysis
│   ├── PureVisualRetrocausality.tsx # Quantum eraser visualization
│   ├── BackgroundVideo.tsx       # Video backgrounds
│   ├── BirthdayCursor.tsx        # Custom cursor effects
│   └── ...                       # Other UI components
├── hooks/                        # Custom React hooks
│   ├── useServerData.ts          # Server data management
│   └── useWebSocket.ts           # WebSocket integration
├── public/                       # Static assets
│   ├── BANNER.jpg               # ILLUSIO banner
│   ├── videos/                  # Background videos
│   ├── zodiac/                  # Zodiac-themed assets
│   └── WIZZARD/                 # AI companion videos
├── server/                       # Backend server
│   ├── src/                     # Server source code
│   │   ├── api/                 # API routes
│   │   ├── services/            # Business logic
│   │   └── db/                  # Database layer
│   └── dist/                    # Compiled server code
└── utils/                        # Utility functions
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm, yarn, pnpm, or bun
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/greaterdan/FUTURE1.git
   cd FUTURE1
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env-template.txt .env.local
   # Edit .env.local with your API keys
   ```

4. **Start the backend server**
   ```bash
   cd server
   npm install
   npm start
   ```

5. **Run the application**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### **Environment Variables**
**🔑 IMPORTANT**: You need to set up API keys to use all features!

1. **Copy the environment template:**
   ```bash
   cp env-template.txt .env.local
   ```

2. **Edit `.env.local` with your actual API keys**

**Required API Keys:**
- **XAI API Key** - For AI chat functionality (Grok AI)
- **Helius API Key** - For Solana blockchain data

**Optional API Keys:**
- **Birdeye API Key** - For enhanced market data
- **Jupiter API Key** - For DEX aggregator features

See [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) for complete setup instructions.

## 🎮 How to Use

### **Market Analysis**
1. **Search Tokens**: Use the search bar to find specific tokens
2. **View Live Data**: Real-time market data and transaction flows
3. **Analyze Patterns**: AI-powered insights and predictions
4. **Track Performance**: Monitor token performance over time

### **Retrocausality Lab**
1. **Search for Token**: Enter a token contract address
2. **Watch Live Flow**: See transactions flow through the quantum eraser
3. **Interactive Controls**: Zoom and pan to explore the visualization
4. **Monitor Confidence**: Visual indicators show prediction accuracy

### **AI Companions**
1. **Select Companion**: Choose an AI agent for analysis
2. **Drag & Drop**: Attach companions to specific tokens
3. **Real-time Chat**: Communicate with AI about market conditions
4. **Get Insights**: Receive AI-powered analysis and predictions

## How It Works

ILLUSIO treats every token as an experiment. We measure, we clean, we simulate, we compare, and then we act when the picture is good enough and still early.

The Retrocausality Lab shows live transactions as pulses through a simple diagram of the experiment. You can see which branch a trade reinforces, which detector lights up, and how those paths update the forecast in real time.

## Framework Philosophy

ILLUSIO is not about worshiping charts or chasing stories. It is about building better instruments and using them with discipline. Certainty is not available. Clarity is.

We measure, we clean, we simulate, we compare, and then we act when the picture is good enough and still early. That is the point of the project and the promise we intend to keep.

## 🤝 Contributing

This is a framework designed to work for any markets. Contributions that improve the signal-to-noise ratio are welcome.

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

## 📄 License

MIT License - see LICENSE file for details.

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/greaterdan/FUTURE1/issues)
- **Discussions**: [GitHub Discussions](https://github.com/greaterdan/FUTURE1/discussions)

---

<div align="center">

**Built for traders who demand clarity over certainty.**

[⭐ Star this repo](https://github.com/greaterdan/FUTURE1) | [🐛 Report Bug](https://github.com/greaterdan/FUTURE1/issues) | [💡 Request Feature](https://github.com/greaterdan/FUTURE1/issues)

</div>