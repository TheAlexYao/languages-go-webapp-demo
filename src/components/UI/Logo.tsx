import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};

const subtextSizeClasses = {
  sm: 'text-xs',
  md: 'text-xs',
  lg: 'text-sm',
  xl: 'text-sm',
};

export const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  className = '', 
  showText = false 
}) => {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <img
        src="/icons/map-kun.svg"
        alt="Languages Go! Logo"
        className={`${sizeClasses[size]} flex-shrink-0`}
      />
      {showText && (
        <div>
          <h1 className={`font-bold leading-tight ${textSizeClasses[size]}`}>
            Languages Go!
          </h1>
          <p className={`text-white/80 leading-tight ${subtextSizeClasses[size]}`}>
            Catch vocab in the wild
          </p>
        </div>
      )}
    </div>
  );
}; 