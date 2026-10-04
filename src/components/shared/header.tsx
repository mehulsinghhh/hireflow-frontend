import React from 'react';

interface SharedLayoutProps {
  children: React.ReactNode;
}

export const HeaderLayout: React.FC<SharedLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} HireFlow Platform. All rights reserved.
      </footer>
    </div>
  );
};
