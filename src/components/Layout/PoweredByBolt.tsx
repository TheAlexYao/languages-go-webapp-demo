import React from 'react';
import { useMobileDetection } from '../../hooks/useMobileDetection';

export const PoweredByBolt: React.FC = () => {
  const { isMobile } = useMobileDetection();

  return (
    <div className={`fixed ${isMobile ? 'bottom-24 right-4' : 'bottom-6 right-6'} z-40`}>
      <a 
        href="https://bolt.new/" 
        target="_blank" 
        rel="noopener noreferrer"
        className="block bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg border border-gray-200/50 hover:bg-white/95 transition-all duration-200 hover:scale-105 cursor-pointer"
        title="Powered by Bolt - Click to visit bolt.new"
      >
        <img 
          src="/white_circle_360x360 copy.png" 
          alt="Powered by Bolt" 
          className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} rounded-full`}
        />
      </a>
    </div>
  );
};