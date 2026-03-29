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
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #F5F7FA 0%, #E8EAF6 100%)',
        fontFamily: 'Inter, sans-serif'
      }}
    >
      <div
        className="w-full max-w-md rounded-3xl p-8 gradient-card"
        style={{
          boxShadow: '0 8px 32px rgba(103, 58, 183, 0.15)'
        }}
      >
        <h1
          className="text-4xl text-center mb-2 font-bold gradient-text"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          Restaurant Admin
        </h1>
        <p className="text-center text-sm mb-8" style={{ color: '#64748B' }}>
          {isLogin ? 'Welcome back' : 'Create your account'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#475569' }}>
                Name
              </label>
              <Input
                data-testid="admin-name-input"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required={!isLogin}
                className="rounded-xl"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                  borderColor: '#E2E8F0'
                }}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#475569' }}>
              Email
            </label>
            <Input
              data-testid="admin-email-input"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="rounded-xl"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                borderColor: '#E2E8F0'
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#475569' }}>
              Password
            </label>
            <Input
              data-testid="admin-password-input"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              className="rounded-xl"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                borderColor: '#E2E8F0'
              }}
            />
          </div>

          <Button
            data-testid="admin-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3 text-base font-semibold transition-all duration-200 holographic"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#FFFFFF'
            }}
          >
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            data-testid="toggle-auth-mode-btn"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm transition-all duration-200 font-medium"
            style={{ color: '#667eea' }}
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;