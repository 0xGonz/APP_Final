import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Building2,
  TrendingUp,
  BarChart3,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Database,
} from 'lucide-react';
import { clinicsAPI } from '../../services/api';

const Sidebar = ({ isCollapsed, onToggle }) => {
  const location = useLocation();

  // Fetch clinics for dynamic navigation
  const { data: clinics } = useQuery({
    queryKey: ['clinics'],
    queryFn: () => clinicsAPI.getAll(),
  });

  const navigation = [
    {
      name: 'Dashboard',
      section: 'Overview',
      items: [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      ],
    },
    {
      name: 'Clinics',
      section: 'Clinic Views',
      items: (clinics || []).map((clinic) => ({
        name: clinic.name,
        href: `/clinic/${clinic.id}`,
        icon: MapPin,
      })),
    },
    {
      name: 'Reports',
      section: 'Reports & Analytics',
      items: [
        { name: 'Analytics & Trends', href: '/analytics', icon: TrendingUp },
        { name: 'Clinic Comparison', href: '/comparison', icon: BarChart3 },
      ],
    },
    {
      name: 'Management',
      section: 'Data Management',
      items: [
        { name: 'Data Management', href: '/data-management', icon: Database },
      ],
    },
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div
      className={`fixed left-0 top-0 h-full bg-primary-600 text-white transition-all duration-300 z-30 flex flex-col ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo Section */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-primary-700 flex-shrink-0">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <Building2 className="w-7 h-7 text-success-300" />
            <span className="font-bold text-lg">American Pain Partners</span>
          </div>
        )}
        {isCollapsed && (
          <Building2 className="w-7 h-7 text-success-300 mx-auto" />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-6 space-y-6 overflow-y-auto">
        {navigation.map((section, idx) => (
          <div key={idx}>
            {!isCollapsed && (
              <div className="px-3 mb-2">
                <h3 className="text-xs font-semibold text-primary-300 uppercase tracking-wider">
                  {section.section}
                </h3>
              </div>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      group flex items-center px-3 py-2.5 text-sm font-medium rounded-md
                      transition-all duration-150
                      ${
                        active
                          ? 'bg-primary-700 text-white'
                          : 'text-primary-100 hover:bg-primary-700/50 hover:text-white'
                      }
                    `}
                    title={isCollapsed ? item.name : ''}
                  >
                    <Icon
                      className={`flex-shrink-0 ${
                        isCollapsed ? 'mx-auto' : 'mr-3'
                      } h-5 w-5 ${
                        active ? 'text-success-300' : 'text-primary-300 group-hover:text-success-300'
                      }`}
                    />
                    {!isCollapsed && <span>{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Company Info - Bottom */}
      {!isCollapsed && (
        <div className="border-t border-primary-700 p-4 bg-primary-700/50 flex-shrink-0">
          <div className="text-xs text-primary-200">
            <p className="font-semibold">American Pain Partners LLC</p>
            <p className="mt-1 opacity-75">6 Clinic Locations</p>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 bg-white border border-stone-200 rounded-full p-1.5 shadow-md hover:shadow-lg transition-all duration-200"
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 text-stone-600" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-stone-600" />
        )}
      </button>
    </div>
  );
};

export default Sidebar;
