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

export const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  className = '', 
  showText = false 
}) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <img
        src="/icons/map-kun.svg"
        alt="Languages Go! Logo"
        className={`${sizeClasses[size]} flex-shrink-0`}
      />
      {showText && (
        <div>
          <h1 className="font-bold text-lg leading-tight">
            Languages Go!
          </h1>
          <p className="text-blue-100 text-xs">
            Catch vocabulary in the wild
          </p>
        </div>
      )}
    </div>
  );
}; 