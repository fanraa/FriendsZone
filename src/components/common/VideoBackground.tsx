import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";

interface VideoBackgroundProps {
  src?: string;
  poster?: string;
  opacityClass?: string;
  overlay?: boolean;
  pingPong?: boolean;
  bottomGradient?: boolean;
}

export const VideoBackground = ({
  src,
  poster,
  opacityClass = "opacity-30 dark:opacity-60",
  overlay = true,
  pingPong = true,
  bottomGradient = false
}: VideoBackgroundProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Auto-play attempt on source change
  useEffect(() => {
    if (src && videoRef.current) {
      videoRef.current.load();
    }
  }, [src]);

  return (
    <div className="absolute inset-0 z-0 bg-black overflow-hidden">
      {/* Fallback Image / Poster - Reliable base layer */}
      <img
        src={poster || "https://picsum.photos/seed/bg-fallback/1920/1080"}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 brightness-[0.4] ${isLoaded && src ? 'opacity-0' : 'opacity-100'}`}
        referrerPolicy="no-referrer"
        alt=""
        loading="eager"
      />
      
      {/* Animated Skeleton Pulse Overlay while loading */}
      {src && !isLoaded && !hasError && (
        <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent animate-pulse z-[1]" />
      )}
      
      {src && !hasError && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          onPlaying={() => setIsLoaded(true)}
          onCanPlayThrough={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`w-full h-full object-cover transition-opacity duration-1000 ${opacityClass} ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        >
          <source src={src} type="video/mp4" />
        </video>
      )}

      {pingPong && (
        <motion.div
          className="absolute inset-0 z-10 bg-linear-to-tr from-white/10 via-transparent to-white/5 pointer-events-none"
          animate={{ opacity: [0.1, 0.2, 0.3, 0.4, 0.5] }}
          transition={{ repeat: Infinity, repeatType: "reverse", duration: 5, ease: "easeInOut" }}
        />
      )}

      {overlay && (
        <div className="absolute inset-0 bg-linear-to-b from-black/40 via-transparent to-black/40 z-20 pointer-events-none transition-colors"></div>
      )}

      {bottomGradient && (
        <div className="absolute inset-x-0 bottom-0 h-64 bg-linear-to-t from-[var(--bg)] via-[var(--bg)]/80 to-transparent z-30 pointer-events-none"></div>
      )}
    </div>
  );
};
