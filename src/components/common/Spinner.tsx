
import React from 'react';

export const Spinner: React.FC = () => {
  return (
    <div className="w-12 h-12 border-4 border-t-4 border-border-light dark:border-border-dark rounded-full animate-spin border-t-primary-light dark:border-t-primary-dark"></div>
  );
};