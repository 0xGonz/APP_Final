import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Calendar, Bell, Search } from 'lucide-react';
import { format } from 'date-fns';
import Sidebar from './Sidebar';
import GlobalDateFilterIndicator from './GlobalDateFilterIndicator';
import { useDateFilter } from '../../context/DateFilterContext';

const AppLayout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const { latestDataDate } = useDateFilter();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/clinic/')) return 'Clinic Details';
    if (path === '/analytics') return 'Analytics & Trends';
    if (path === '/comparison') return 'Clinic Comparison';
    if (path === '/data-management') return 'Data Management';
    return 'Dashboard';
  };

  return (
    <div className="h-screen bg-stone-50 flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        } h-screen overflow-hidden`}
      >
        {/* Top Header Bar */}
        <header className="bg-white border-b border-stone-200 shadow-sm flex-shrink-0">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Page Title */}
              <div>
                <h1 className="text-xl font-bold text-stone-900 tracking-tight">
                  {getPageTitle()}
                </h1>
                <p className="text-xs text-stone-500 mt-0.5">
                  American Pain Partners LLC
                </p>
              </div>

              {/* Right Side Actions */}
              <div className="flex items-center space-x-4">
                {/* Global Date Filter Indicator */}
                <div className="hidden md:block">
                  <GlobalDateFilterIndicator />
                </div>

                {/* Notifications (placeholder) */}
                <button className="relative p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full"></span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-stone-50 to-stone-100">
          <div className="px-4 sm:px-6 md:px-6 py-4 pb-6">
            <div className="max-w-[1800px] mx-auto">
              {children}
            </div>
          </div>
        </main>
        {/* Footer */}
        <footer className="bg-white border-t border-stone-200 flex-shrink-0">
          <div className="px-4 py-2">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <div>
                <p>© 2025 American Pain Partners LLC. All rights reserved.</p>
              </div>
              <div className="flex items-center space-x-4">
                <span>
                  Data: Jan 2023 - {latestDataDate ? format(latestDataDate, 'MMM yyyy') : 'Loading...'}
                </span>
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-success-500 rounded-full mr-1.5"></span>
                  System Online
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AppLayout;
