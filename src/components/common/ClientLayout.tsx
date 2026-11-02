import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { DemoBanner } from './DemoBanner';

export const ClientLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-cinetext-primary selection:bg-primary selection:text-white">
      <DemoBanner />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

