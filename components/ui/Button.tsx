import React, { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  children?: React.ReactNode;
  className?: string;
  key?: React.Key;
  onClick?: React.MouseEventHandler<HTMLButtonElement> | any;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  className = '',
  ...props 
}: ButtonProps) {
  
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none rounded-xl';
  
  const variants = {
    primary: 'bg-business-orange text-white shadow-lg shadow-business-orange/20 hover:bg-business-orange/90',
    secondary: 'bg-slate-900 text-white shadow-lg hover:bg-slate-800',
    outline: 'bg-white border-2 border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300',
    ghost: 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800',
    danger: 'bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 hover:text-rose-700'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-[9px]',
    md: 'px-5 py-2.5 text-[10px]',
    lg: 'px-8 py-3 text-xs'
  };

  const classes = [
    baseClasses,
    variants[variant],
    sizes[size],
    fullWidth ? 'w-full' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
