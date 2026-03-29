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
        backgroundColor: '#FAFAFA',
        fontFamily: 'Manrope, sans-serif'
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-8"
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E4E4E7',
          boxShadow: '0 8px 30px rgba(0,0,0,0.04)'
        }}
      >
        <h1
          className="text-3xl sm:text-4xl text-center mb-2 tracking-tight"
          style={{
            fontFamily: 'Cabinet Grotesk, sans-serif',
            color: '#1A1A1A',
            fontWeight: '700'
          }}
        >
          Restaurant Admin
        </h1>
        <p className="text-center text-sm mb-8" style={{ color: '#52525B' }}>
          {isLogin ? 'Login to manage your restaurants' : 'Create your admin account'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#52525B' }}>
                Name
              </label>
              <Input
                data-testid="admin-name-input"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required={!isLogin}
                className="rounded-xl"
                style={{ borderColor: '#E4E4E7' }}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#52525B' }}>
              Email
            </label>
            <Input
              data-testid="admin-email-input"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="rounded-xl"
              style={{ borderColor: '#E4E4E7' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#52525B' }}>
              Password
            </label>
            <Input
              data-testid="admin-password-input"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              className="rounded-xl"
              style={{ borderColor: '#E4E4E7' }}
            />
          </div>

          <Button
            data-testid="admin-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full rounded-full py-6 text-base font-semibold transition-all duration-200 active:scale-98"
            style={{
              backgroundColor: '#E25E3E',
              color: '#FFFFFF',
              boxShadow: '0 20px 40px rgba(226,94,62,0.15)'
            }}
          >
            {loading ? 'Please wait...' : isLogin ? 'Login' : 'Register'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            data-testid="toggle-auth-mode-btn"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm transition-all duration-200"
            style={{ color: '#E25E3E', fontWeight: '600' }}
          >
            {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;