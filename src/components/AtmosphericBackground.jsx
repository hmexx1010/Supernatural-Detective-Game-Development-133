import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const AtmosphericBackground = ({ children, intensity = 'medium' }) => {
  const rainRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    const createRainDrop = () => {
      if (!rainRef.current) return;

      const drop = document.createElement('div');
      drop.className = 'rain-drop';
      
      // Random positioning and timing
      const left = Math.random() * 100;
      const duration = 2 + Math.random() * 3;
      const height = 50 + Math.random() * 100;
      const opacity = 0.1 + Math.random() * 0.3;
      
      drop.style.left = `${left}%`;
      drop.style.height = `${height}px`;
      drop.style.animationDuration = `${duration}s`;
      drop.style.opacity = opacity;
      
      rainRef.current.appendChild(drop);
      
      // Remove drop after animation
      setTimeout(() => {
        if (drop.parentNode) {
          drop.parentNode.removeChild(drop);
        }
      }, duration * 1000);
    };

    const createFloatingParticle = () => {
      if (!rainRef.current) return;

      const particle = document.createElement('div');
      particle.className = 'floating-particle';
      particle.innerHTML = Math.random() > 0.5 ? '✨' : '💫';
      
      const left = Math.random() * 100;
      const animationDuration = 10 + Math.random() * 10;
      
      particle.style.cssText = `
        position: absolute;
        left: ${left}%;
        top: 100%;
        font-size: ${0.5 + Math.random() * 0.5}rem;
        animation: floatUp ${animationDuration}s linear infinite;
        pointer-events: none;
        opacity: ${0.1 + Math.random() * 0.3};
        will-change: transform;
      `;
      
      rainRef.current.appendChild(particle);
      
      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      }, animationDuration * 1000);
    };

    // Intensity settings
    const settings = {
      light: { rainInterval: 300, particleInterval: 8000 },
      medium: { rainInterval: 200, particleInterval: 5000 },
      heavy: { rainInterval: 100, particleInterval: 3000 }
    };

    const { rainInterval, particleInterval } = settings[intensity] || settings.medium;

    // Create rain drops
    const rainTimer = setInterval(createRainDrop, rainInterval);
    
    // Create floating particles
    const particleTimer = setInterval(createFloatingParticle, particleInterval);

    return () => {
      clearInterval(rainTimer);
      clearInterval(particleTimer);
    };
  }, [intensity]);

  return (
    <div className="atmospheric-bg">
      {/* Fixed positioned atmospheric layers that don't affect layout */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Background gradient layer */}
        <div className="absolute inset-0 bg-gradient-atmospheric opacity-30" />
        
        {/* Animated Rain Effect - constrained to viewport */}
        <div ref={rainRef} className="absolute inset-0 overflow-hidden" />
        
        {/* Floating Neon Orbs - constrained movement */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full will-change-transform"
            style={{
              background: i === 0 
                ? 'radial-gradient(circle, rgba(0,212,255,0.6) 0%, transparent 70%)'
                : i === 1 
                ? 'radial-gradient(circle, rgba(139,92,246,0.6) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(251,191,36,0.6) 0%, transparent 70%)',
              boxShadow: i === 0 
                ? '0 0 20px rgba(0,212,255,0.4)'
                : i === 1 
                ? '0 0 20px rgba(139,92,246,0.4)'
                : '0 0 20px rgba(251,191,36,0.4)',
              left: `${20 + i * 25}%`,
              top: `${30 + i * 20}%`
            }}
            animate={{
              x: [-20, 20, -10, 15, -20],
              y: [-15, 10, -5, 20, -15],
              scale: [1, 1.3, 0.9, 1.1, 1],
              opacity: [0.3, 0.7, 0.4, 0.8, 0.3]
            }}
            transition={{
              duration: 15 + i * 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 2
            }}
          />
        ))}
      </div>

      {/* Content container with proper z-index */}
      <div className="relative z-10">
        {children}
      </div>

      {/* CSS for effects - scoped to not affect layout */}
      <style jsx>{`
        .atmospheric-bg {
          position: relative;
          min-height: 100vh;
          overflow-x: hidden;
        }
        
        .bg-gradient-atmospheric {
          background: 
            radial-gradient(circle at 25% 25%, rgba(0, 212, 255, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(251, 191, 36, 0.02) 0%, transparent 70%);
          animation: atmosphericShift 20s ease-in-out infinite alternate;
        }
        
        .rain-drop {
          position: absolute;
          width: 2px;
          background: linear-gradient(transparent, rgba(0, 212, 255, 0.3), transparent);
          animation: rainfall linear infinite;
          will-change: transform;
        }
        
        @keyframes rainfall {
          0% {
            transform: translateY(-100px);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh);
            opacity: 0;
          }
        }
        
        @keyframes floatUp {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) rotate(360deg);
            opacity: 0;
          }
        }
        
        @keyframes atmosphericShift {
          0% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.02);
          }
          100% {
            opacity: 0.4;
            transform: scale(0.98);
          }
        }
      `}</style>
    </div>
  );
};

export default AtmosphericBackground;