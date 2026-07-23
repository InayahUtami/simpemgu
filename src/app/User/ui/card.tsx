import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const Card: React.FC<CardProps> = ({ children, ...rest }) => (
  <div {...rest} style={{ background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', ...rest.style }}>{children}</div>
);

const CardContent: React.FC<CardContentProps> = ({ children, ...rest }) => (
  <div {...rest} style={{ padding: 16, ...rest.style }}>{children}</div>
);

export { Card, CardContent };

