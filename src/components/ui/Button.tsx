import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'gold';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) => {
  const baseStyles = "font-display uppercase tracking-wider rounded-2xl transform transition-all active:scale-95 shadow-lg border-b-4 relative overflow-hidden group";
  
  const variants = {
    primary: "bg-indigo-500 border-indigo-700 hover:bg-indigo-400 text-white",
    secondary: "bg-slate-700 border-slate-900 hover:bg-slate-600 text-slate-100",
    danger: "bg-rose-500 border-rose-700 hover:bg-rose-400 text-white",
    gold: "bg-yellow-400 border-yellow-600 hover:bg-yellow-300 text-yellow-900"
  };

  const sizes = {
    sm: "text-sm px-4 py-2",
    md: "text-lg px-6 py-3",
    lg: "text-2xl px-8 py-4"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
    </button>
  );
};