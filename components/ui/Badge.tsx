import React, { HTMLAttributes } from 'react';

export interface BadgeProps extends React.ComponentPropsWithoutRef<'span'> {
  children?: React.ReactNode;
  className?: string;
  key?: React.Key;
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'primary';
  size?: 'sm' | 'md';
}

export function Badge({ 
  children, 
  variant = 'neutral', 
  size = 'md',
  className = '',
  ...props 
}: BadgeProps) {
  
  const baseClasses = 'inline-flex items-center justify-center font-black uppercase border rounded-md shadow-sm whitespace-nowrap';
  
  const variants = {
    neutral: 'bg-slate-100 text-slate-500 border-slate-200',
    success: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    warning: 'bg-amber-50 text-amber-600 border-amber-100',
    danger: 'bg-rose-50 text-rose-600 border-rose-100',
    info: 'bg-blue-50 text-blue-600 border-blue-100',
    primary: 'bg-business-orange/10 text-business-orange border-business-orange/20'
  };

  const sizes = {
    sm: 'px-1.5 py-0.5 text-[8px] tracking-wider',
    md: 'px-2 py-1 text-[9px] tracking-widest'
  };

  const classes = [
    baseClasses,
    variants[variant],
    sizes[size],
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
}
