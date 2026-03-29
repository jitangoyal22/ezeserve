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
    <div className="flex min-h-screen" style={{ backgroundColor: '#FAFAFA', fontFamily: 'Manrope, sans-serif' }}>
      <aside
        className="w-64 fixed left-0 top-0 h-full hidden lg:block"
        style={{ backgroundColor: '#FFFFFF', borderRight: '1px solid #E4E4E7' }}
      >
        <div className="p-6">
          <h2
            className="text-2xl tracking-tight mb-8"
            style={{
              fontFamily: 'Cabinet Grotesk, sans-serif',
              color: '#1A1A1A',
              fontWeight: '700'
            }}
          >
            Restaurant Admin
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
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
                  style={{
                    backgroundColor: isActive ? '#F4F4F5' : 'transparent',
                    color: isActive ? '#E25E3E' : '#52525B',
                    fontWeight: isActive ? '600' : '500'
                  }}
                >
                  <Icon size={20} />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <button
            data-testid="logout-btn"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl mt-8 transition-all duration-200"
            style={{ color: '#EF4444', fontWeight: '500' }}
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      <div className="lg:ml-64 flex-1">
        <div className="lg:hidden sticky top-0 z-40 p-4" style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E4E4E7' }}>
          <h2
            className="text-xl tracking-tight"
            style={{
              fontFamily: 'Cabinet Grotesk, sans-serif',
              color: '#1A1A1A',
              fontWeight: '700'
            }}
          >
            Restaurant Admin
          </h2>
        </div>
        <main>{children}</main>
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-2" style={{ backgroundColor: '#FFFFFF', borderTop: '1px solid #E4E4E7' }}>
          <div className="flex justify-around">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200"
                  style={{
                    color: isActive ? '#E25E3E' : '#52525B'
                  }}
                >
                  <Icon size={20} />
                  <span className="text-xs">{item.label}</span>
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