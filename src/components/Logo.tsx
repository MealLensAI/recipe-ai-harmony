import React from 'react';

interface LogoProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
    const sizeClasses = {
        sm: 'h-8 w-auto',
        md: 'h-12 w-auto',
        lg: 'h-16 w-auto',
        xl: 'h-20 w-auto'
    };

    return (
        <div className={`flex items-center ${className}`}>
            <img
                src="/assets/images/logo-2.svg"
                alt="MealLens Logo"
                className={sizeClasses[size]}
            />
        </div>
    );
};

export default Logo;
