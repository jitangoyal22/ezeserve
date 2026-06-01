import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, {
        email: formData.email,
        password: formData.password
      });
      localStorage.setItem('admin_token', response.data.token);
      localStorage.setItem('admin_user', JSON.stringify(response.data.user));
      toast.success('Login successful!');
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Auth error:', error);
      toast.error(error.response?.data?.detail || 'Invalid credentials');
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
        style={{ boxShadow: '0 8px 32px rgba(103, 58, 183, 0.15)' }}
      >
        <h1
          className="text-4xl text-center mb-2 font-bold"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          ezeserve
        </h1>
        <p className="text-center text-sm mb-8" style={{ color: '#64748B' }}>
          Sign in to your admin account
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#475569' }}>Email</label>
            <Input
              data-testid="admin-email-input"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="rounded-xl"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderColor: '#E2E8F0' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#475569' }}>Password</label>
            <Input
              data-testid="admin-password-input"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              className="rounded-xl"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderColor: '#E2E8F0' }}
            />
          </div>

          <Button
            data-testid="admin-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3 text-base font-semibold transition-all duration-200 holographic"
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#FFFFFF' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs" style={{ color: '#94A3B8' }}>
          Restricted access. Contact your super admin for an account.
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
