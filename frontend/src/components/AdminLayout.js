import React from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Menu, Store, Grid3x3, LogOut } from 'lucide-react';

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
    { path: '/admin/tables', icon: Grid3x3, label: 'Tables' },
    { path: '/admin/restaurants', icon: Store, label: 'Restaurants' }
  ];

  return (
    <div className="flex min-h-screen" style={{ background: 'linear-gradient(135deg, #F5F7FA 0%, #E8EAF6 100%)', fontFamily: 'Inter, sans-serif' }}>
      <aside
        className="w-64 fixed left-0 top-0 h-full hidden lg:block"
        style={{ 
          background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '4px 0 20px rgba(102, 126, 234, 0.3)'
        }}
      >
        <div className="p-6">
          <div className="mb-8">
            <h2
              className="text-2xl font-bold text-white tracking-tight"
            >
              ezeserve
            </h2>
            <p className="text-sm text-white/70 mt-1">Restaurant Admin</p>
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
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium"
                  style={{
                    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                    color: '#FFFFFF',
                    backdropFilter: isActive ? 'blur(10px)' : 'none'
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
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl mt-8 transition-all duration-200 font-medium hover:bg-white/10"
            style={{ color: '#FEE2E2' }}
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      <div className="lg:ml-64 flex-1">
        <div className="lg:hidden sticky top-0 z-40 p-4 glass-card" style={{ backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255, 255, 255, 0.3)' }}>
          <h2
            className="text-xl font-bold gradient-text"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            ezeserve
          </h2>
        </div>
        <main>{children}</main>
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-2 glass-card" style={{ backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255, 255, 255, 0.3)' }}>
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
                    color: isActive ? '#667eea' : '#64748B'
                  }}
                >
                  <Icon size={20} />
                  <span className="text-xs font-medium">{item.label}</span>
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