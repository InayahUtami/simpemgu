import React from 'react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive';
}

const Alert: React.FC<AlertProps> = ({ children, variant = 'default', ...rest }) => {
  const style = {
    background: variant === 'destructive' ? '#dbeafe' : '#e0f2fe',
    color: variant === 'destructive' ? '#b91c1c' : '#0369a1',
    border: '1px solid',
    borderColor: variant === 'destructive' ? '#93c5fd' : '#7dd3fc',
    borderRadius: 8,
    padding: '12px 16px',
    marginBottom: 8,
    fontSize: 14,
    ...rest.style
  };
  return <div {...rest} style={style}>{children}</div>;
};

export { Alert };
export default Alert;

