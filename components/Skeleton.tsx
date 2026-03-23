import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular' | 'card';
}

export function Skeleton({ className = '', variant = 'rectangular' }: SkeletonProps) {
    const baseClasses = 'animate-pulse bg-slate-200';
    
    let variantClasses = '';
    
    switch (variant) {
        case 'text':
            variantClasses = 'h-4 w-full rounded';
            break;
        case 'circular':
            variantClasses = 'rounded-full';
            break;
        case 'card':
            variantClasses = 'rounded-2xl h-64 w-full';
            break;
        case 'rectangular':
        default:
            variantClasses = 'rounded-xl';
            break;
    }

    return (
        <div className={`${baseClasses} ${variantClasses} ${className}`} aria-hidden="true" />
    );
}
