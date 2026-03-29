import React from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Menu, Store, LogOut } from 'lucide-react';

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/admin/login');
  };

  const menuItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
    { path: '/admin/menu', icon: Menu, label: 'Menu' },
    { path: '/admin/restaurants', icon: Store, label: 'Restaurants' }
  ];

  return (
    <div className="flex min-h-screen" style={{ background: '#050505', fontFamily: 'Outfit, sans-serif' }}>
      <aside
        className="w-64 fixed left-0 top-0 h-full hidden lg:block"
        style={{ backgroundColor: '#0A0A0A', borderRight: '1px solid rgba(255, 255, 255, 0.1)' }}
      >
        <div className="p-6">
          <h2
            className="text-2xl tracking-tight mb-8 neon-text"
            style={{
              fontFamily: 'Unbounded, sans-serif',
              color: '#00FF66',
              fontWeight: '800'
            }}
          >
            ADMIN CONTROL
          </h2>
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                  onClick={() => navigate(item.path)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-sm transition-all duration-200 font-bold text-xs uppercase tracking-wider"
                  style={{
                    backgroundColor: isActive ? 'rgba(0, 255, 102, 0.1)' : 'transparent',
                    color: isActive ? '#00FF66' : '#A1A1AA',
                    borderLeft: isActive ? '2px solid #00FF66' : '2px solid transparent'
                  }}
                >
                  <Icon size={18} strokeWidth={1.5} />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <button
            data-testid="logout-btn"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-sm mt-8 transition-all duration-200 font-bold text-xs uppercase tracking-wider"
            style={{ color: '#FF007F' }}
          >
            <LogOut size={18} strokeWidth={1.5} />
            Logout
          </button>
        </div>
      </aside>

      <div className="lg:ml-64 flex-1">
        <div className="lg:hidden sticky top-0 z-40 p-4 glass-effect" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <h2
            className="text-xl tracking-tight neon-text"
            style={{
              fontFamily: 'Unbounded, sans-serif',
              color: '#00FF66',
              fontWeight: '800'
            }}
          >
            ADMIN
          </h2>
        </div>
        <main>{children}</main>
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-2 glass-effect" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div className="flex justify-around">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="flex flex-col items-center gap-1 p-2 rounded-sm transition-all duration-200"
                  style={{
                    color: isActive ? '#00FF66' : '#A1A1AA'
                  }}
                >
                  <Icon size={18} strokeWidth={1.5} />
                  <span className="text-[10px] uppercase tracking-wider font-bold">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;