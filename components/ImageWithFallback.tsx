import { useState } from "react";

export default function ImageWithFallback({ 
  src, 
  alt, 
  className = "w-10 h-10 rounded-lg",
  fallbackClassName = "w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 grid place-items-center text-xs text-white font-bold overflow-hidden"
}: { 
  src?: string; 
  alt: string;
  className?: string;
  fallbackClassName?: string;
}) {
  const [broken, setBroken] = useState(false);
  
  // Convert HTTP URLs to HTTPS to prevent mixed content errors
  const secureSrc = src?.replace(/^http:\/\//, 'https://');
  
  if (!secureSrc || broken) {
    // Generate a more attractive fallback with gradient background
    const initials = alt.slice(0, 2).toUpperCase();
    return (
      <div className={fallbackClassName}>
        {initials}
      </div>
    );
  }
  
  return (
    <img
      src={secureSrc}
      alt={alt}
      className={`${className} object-cover`}
      onError={() => {
        console.log(`Image failed to load: ${secureSrc}`);
        setBroken(true);
      }}
      onLoad={() => {
        // Reset broken state if image loads successfully
        setBroken(false);
      }}
      loading="lazy"
      decoding="async"
      crossOrigin="anonymous"
    />
  );
}

