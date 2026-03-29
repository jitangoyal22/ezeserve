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
        background: 'linear-gradient(135deg, #FFFFFF 0%, #F4F5F7 100%)',
        fontFamily: 'DM Sans, sans-serif'
      }}
    >
      <div className="absolute inset-0 opacity-5" style={{ 
        backgroundImage: 'repeating-linear-gradient(45deg, #0A0A0A 0px, #0A0A0A 2px, transparent 2px, transparent 10px)',
      }}></div>
      <div
        className="w-full max-w-md rounded-none p-8 relative z-10 crisp-border"
        style={{
          backgroundColor: '#FFFFFF',
          boxShadow: '8px 8px 0px #CCFF00'
        }}
      >
        <div className="mb-8 text-center">
          <div className="inline-block px-4 py-2 mb-4" style={{ backgroundColor: '#CCFF00', border: '2px solid #0A0A0A' }}>
            <h1
              className="text-3xl sm:text-4xl tracking-tighter font-black"
              style={{
                fontFamily: 'Outfit, sans-serif',
                color: '#0A0A0A'
              }}
            >
              ADMIN PORTAL
            </h1>
          </div>
          <p className="text-xs uppercase tracking-widest font-bold" style={{ color: '#4A4D54' }}>
            {isLogin ? 'SECURE ACCESS' : 'CREATE NEW ACCOUNT'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold mb-2 uppercase tracking-widest" style={{ color: '#0A0A0A' }}>
                NAME
              </label>
              <Input
                data-testid="admin-name-input"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required={!isLogin}
                className="rounded-none border-2 font-medium"
                style={{ 
                  backgroundColor: '#FFFFFF', 
                  borderColor: 'rgba(10, 10, 10, 0.2)',
                  color: '#0A0A0A'
                }}
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-bold mb-2 uppercase tracking-widest" style={{ color: '#0A0A0A' }}>
              EMAIL
            </label>
            <Input
              data-testid="admin-email-input"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="rounded-none border-2 font-medium"
              style={{ 
                backgroundColor: '#FFFFFF', 
                borderColor: 'rgba(10, 10, 10, 0.2)',
                color: '#0A0A0A'
              }}
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-2 uppercase tracking-widest" style={{ color: '#0A0A0A' }}>
              PASSWORD
            </label>
            <Input
              data-testid="admin-password-input"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              className="rounded-none border-2 font-medium"
              style={{ 
                backgroundColor: '#FFFFFF', 
                borderColor: 'rgba(10, 10, 10, 0.2)',
                color: '#0A0A0A'
              }}
            />
          </div>

          <Button
            data-testid="admin-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full rounded-none py-6 text-sm font-bold uppercase tracking-widest transition-all duration-200 active:scale-95 border-2"
            style={{
              backgroundColor: '#0A0A0A',
              color: '#FFFFFF',
              borderColor: '#0A0A0A'
            }}
          >
            {loading ? 'PROCESSING...' : isLogin ? 'ACCESS SYSTEM' : 'CREATE ACCOUNT'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            data-testid="toggle-auth-mode-btn"
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs transition-all duration-200 uppercase tracking-widest font-bold hover:underline"
            style={{ color: '#0033FF' }}
          >
            {isLogin ? 'CREATE NEW ACCOUNT' : 'BACK TO LOGIN'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;