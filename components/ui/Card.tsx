import React, { HTMLAttributes } from 'react';

export interface CardProps extends React.ComponentPropsWithoutRef<'div'> {
  children?: React.ReactNode;
  className?: string;
  key?: React.Key;
  onClick?: React.MouseEventHandler<HTMLDivElement> | any;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverEffect?: boolean;
}

export function Card({ 
  children, 
  padding = 'md', 
  hoverEffect = false,
  className = '',
  ...props 
}: CardProps) {
  
  const paddings = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-8'
  };

  const classes = [
    'bg-white rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden',
    hoverEffect ? 'transition-all hover:shadow-xl group' : '',
    paddings[padding],
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
