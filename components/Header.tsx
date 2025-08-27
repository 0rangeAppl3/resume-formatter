
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <h1 className="text-2xl font-bold text-indigo-600">AI Resume Formatter</h1>
        <p className="text-slate-500">Transform your CV into a perfect resume instantly.</p>
      </div>
    </header>
  );
};
