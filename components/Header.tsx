import React from 'react';
import { SunIcon, MoonIcon } from './common/Icons';

interface HeaderProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ theme, toggleTheme }) => {
  return (
    <header className="bg-surface-light dark:bg-surface-dark shadow-md">
      <div className="container mx-auto p-4 flex justify-between items-center max-w-4xl">
        <h1 className="text-2xl font-bold text-primary-light dark:text-primary-dark dark:drop-shadow-neon-primary">
          DividApp
        </h1>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
        </button>
      </div>
    </header>
  );
};