import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-lg shadow-xs p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`mb-4 pb-3 border-b border-slate-100 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <h3 className={`text-lg font-semibold text-slate-900 ${className}`} {...props}>
      {children}
    </h3>
  );
};

export const CardContent: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return <div className={`${className}`} {...props}>{children}</div>;
};
