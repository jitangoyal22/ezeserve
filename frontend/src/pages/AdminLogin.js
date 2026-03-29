import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminLogin = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const response = await axios.post(`${API}/auth/login`, {
          email: formData.email,
          password: formData.password
        });
        localStorage.setItem('admin_token', response.data.token);
        localStorage.setItem('admin_user', JSON.stringify(response.data.user));
        toast.success('Login successful!');
        navigate('/admin/dashboard');
      } else {
        await axios.post(`${API}/auth/register`, formData);
        toast.success('Registration successful! Please login.');
        setIsLogin(true);
        setFormData({ email: '', password: '', name: '' });
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: '#050505',
        fontFamily: 'Outfit, sans-serif'
      }}
    >
      <div className="absolute inset-0 opacity-10" style={{ 
        backgroundImage: 'radial-gradient(circle at 20% 30%, #00FF66 0%, transparent 50%), radial-gradient(circle at 80% 70%, #00E5FF 0%, transparent 50%)',
        filter: 'blur(100px)'
      }}></div>
      <div
        className="w-full max-w-md rounded-sm p-8 relative z-10"
        style={{
          backgroundColor: '#0A0A0A',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <h1
          className="text-3xl sm:text-4xl text-center mb-2 tracking-tight neon-text"
          style={{
            fontFamily: 'Unbounded, sans-serif',
            color: '#00FF66',
            fontWeight: '800'
          }}
        >
          RESTAURANT ADMIN
        </h1>
        <p className="text-center text-xs mb-8 uppercase tracking-wider" style={{ color: '#A1A1AA' }}>
          {isLogin ? 'Secure Access Portal' : 'Initialize New Admin Account'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: '#00FF66' }}>
                Name
              </label>
              <Input
                data-testid="admin-name-input"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required={!isLogin}
                className="rounded-sm"
                style={{ 
                  backgroundColor: '#111111', 
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#F4F4F5'
                }}
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: '#00FF66' }}>
              Email
            </label>
            <Input
              data-testid="admin-email-input"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="rounded-sm"
              style={{ 
                backgroundColor: '#111111', 
                borderColor: 'rgba(255, 255, 255, 0.1)',
                color: '#F4F4F5'
              }}
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: '#00FF66' }}>
              Password
            </label>
            <Input
              data-testid="admin-password-input"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              className="rounded-sm"
              style={{ 
                backgroundColor: '#111111', 
                borderColor: 'rgba(255, 255, 255, 0.1)',
                color: '#F4F4F5'
              }}
            />
          </div>

          <Button
            data-testid="admin-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full rounded-sm py-6 text-sm font-bold uppercase tracking-wider transition-all duration-200 active:scale-95 neon-glow"
            style={{
              backgroundColor: '#00FF66',
              color: '#050505'
            }}
          >
            {loading ? 'Processing...' : isLogin ? 'Access System' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            data-testid="toggle-auth-mode-btn"
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs transition-all duration-200 uppercase tracking-wider font-bold"
            style={{ color: '#00E5FF' }}
          >
            {isLogin ? 'Initialize New Account' : 'Return to Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;