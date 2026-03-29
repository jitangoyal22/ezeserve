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
    <div className="flex min-h-screen" style={{ background: '#F4F5F7', fontFamily: 'DM Sans, sans-serif' }}>
      <aside
        className="w-64 fixed left-0 top-0 h-full hidden lg:block crisp-border"
        style={{ backgroundColor: '#FFFFFF', borderRight: '2px solid #0A0A0A' }}
      >
        <div className="p-6">
          <div className="mb-8 px-4 py-3" style={{ backgroundColor: '#CCFF00', border: '2px solid #0A0A0A' }}>
            <h2
              className="text-xl tracking-tighter font-black text-center"
              style={{
                fontFamily: 'Outfit, sans-serif',
                color: '#0A0A0A'
              }}
            >
              ADMIN
            </h2>
          </div>
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                  onClick={() => navigate(item.path)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-none transition-all duration-200 font-bold text-xs uppercase tracking-widest border-l-4"
                  style={{
                    backgroundColor: isActive ? '#F4F5F7' : 'transparent',
                    color: '#0A0A0A',
                    borderLeftColor: isActive ? '#CCFF00' : 'transparent'
                  }}
                >
                  <Icon size={18} strokeWidth={2} />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <button
            data-testid="logout-btn"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-none mt-8 transition-all duration-200 font-bold text-xs uppercase tracking-widest border-2"
            style={{ color: '#FF0055', borderColor: '#FF0055', backgroundColor: 'transparent' }}
          >
            <LogOut size={18} strokeWidth={2} />
            LOGOUT
          </button>
        </div>
      </aside>

      <div className="lg:ml-64 flex-1">
        <div className="lg:hidden sticky top-0 z-40 p-4 glass-light">
          <h2
            className="text-xl tracking-tighter font-black"
            style={{
              fontFamily: 'Outfit, sans-serif',
              color: '#0A0A0A'
            }}
          >
            ADMIN
          </h2>
        </div>
        <main>{children}</main>
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-2 glass-light">
          <div className="flex justify-around">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="flex flex-col items-center gap-1 p-2 rounded-none transition-all duration-200"
                  style={{
                    color: isActive ? '#CCFF00' : '#4A4D54',
                    backgroundColor: isActive ? '#0A0A0A' : 'transparent'
                  }}
                >
                  <Icon size={18} strokeWidth={2} />
                  <span className="text-[10px] uppercase tracking-widest font-bold">{item.label}</span>
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