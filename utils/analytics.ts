// Analytics utility for tracking website visitors
class WebsiteAnalytics {
  private sessionId: string;
  private serverUrl: string;

  constructor() {
    // Generate or retrieve session ID
    this.sessionId = this.getOrCreateSessionId();
    this.serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 
      (process.env.NODE_ENV === 'production' 
        ? 'https://localhost:8080'
        : 'http://localhost:8080');
  }

  private getOrCreateSessionId(): string {
    // Only access localStorage on client side
    if (typeof window === 'undefined') {
      return 'server_session_' + Date.now();
    }
    
    // Try to get existing session ID from localStorage
    let sessionId = localStorage.getItem('analytics_session_id');
    
    if (!sessionId) {
      // Create new session ID
      sessionId = `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('analytics_session_id', sessionId);
    }
    
    return sessionId;
  }

  // Track page view
  async trackPageView(pagePath: string, pageTitle?: string) {
    try {
      await fetch(`${this.serverUrl}/api/analytics/pageview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': this.sessionId
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          pagePath,
          pageTitle: pageTitle || document.title,
          referrer: document.referrer,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.log('Analytics tracking failed:', error);
    }
  }

  // Track feature usage
  async trackFeatureUsage(featureName: string, action: string, metadata?: any) {
    try {
      await fetch(`${this.serverUrl}/api/analytics/feature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': this.sessionId
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          featureName,
          action,
          metadata,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.log('Feature tracking failed:', error);
    }
  }

  // Track session activity (call periodically to keep session active)
  async trackActivity() {
    try {
      await fetch(`${this.serverUrl}/api/analytics/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': this.sessionId
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.log('Activity tracking failed:', error);
    }
  }
}

// Create singleton instance
export const websiteAnalytics = new WebsiteAnalytics();

// Auto-track page views
if (typeof window !== 'undefined') {
  // Track initial page view
  websiteAnalytics.trackPageView(window.location.pathname);
  
  // Track activity every 30 seconds to keep session active
  setInterval(() => {
    websiteAnalytics.trackActivity();
  }, 30000);
}
