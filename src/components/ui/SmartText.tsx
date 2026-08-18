import React from 'react';

interface SmartTextProps {
  text: string;
  maxLength?: number;
  className?: string;
  as?: 'span' | 'p' | 'div' | 'h1' | 'h2' | 'h3' | 'h4';
  title?: string;
}

export const SmartText: React.FC<SmartTextProps> = ({
  text = '',
  maxLength = 40,
  className = '',
  as: Component = 'span',
  title,
}) => {
  const needsTruncation = text.length > maxLength;
  const displayText = needsTruncation ? `${text.slice(0, maxLength).trim()}…` : text;

  return (
    <Component
      className={`truncate ${className}`}
      title={title || (needsTruncation ? text : undefined)}
    >
      {displayText}
    </Component>
  );
};
