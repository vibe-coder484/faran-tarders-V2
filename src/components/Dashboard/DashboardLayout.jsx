import { useState } from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import PageTransition from '../PageTransition';
import FloatingCalculator from './FloatingCalculator';

function DashboardLayout({ children, pageTitle }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-['Plus_Jakarta_Sans']">
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="flex-grow flex flex-col min-w-0 h-full overflow-hidden">
        <TopNav 
          pageTitle={pageTitle} 
          onMenuClick={() => setSidebarOpen(true)} 
        />
        <main className="flex-grow p-4 md:p-8 overflow-y-auto scrollbar-hide">
          <PageTransition key={pageTitle}>
            <div className="max-w-[1600px] mx-auto pb-10">
              {children}
            </div>
          </PageTransition>
        </main>
      </div>

      {/* Global Floating Calculator for Faran Traders */}
      <FloatingCalculator />
    </div>
  );
}

export default DashboardLayout;
