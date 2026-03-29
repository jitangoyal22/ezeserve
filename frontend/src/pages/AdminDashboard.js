import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '@/components/AdminLayout';
import { ShoppingBag, Clock, CheckCircle, DollarSign } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedRestaurant]);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const headers = { Authorization: `Bearer ${token}` };

      const restaurantsRes = await axios.get(`${API}/restaurants`, { headers });
      setRestaurants(restaurantsRes.data);

      if (!selectedRestaurant && restaurantsRes.data.length > 0) {
        setSelectedRestaurant(restaurantsRes.data[0].id);
      }

      if (selectedRestaurant || restaurantsRes.data.length > 0) {
        const restaurantId = selectedRestaurant || restaurantsRes.data[0].id;
        const statsRes = await axios.get(`${API}/dashboard/stats?restaurant_id=${restaurantId}`, { headers });
        setStats(statsRes.data);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Orders',
      value: stats?.total_orders || 0,
      icon: ShoppingBag,
      color: '#3B82F6'
    },
    {
      title: 'Pending Orders',
      value: stats?.pending_orders || 0,
      icon: Clock,
      color: '#EAB308'
    },
    {
      title: 'Completed Orders',
      value: stats?.completed_orders || 0,
      icon: CheckCircle,
      color: '#4F6F52'
    },
    {
      title: 'Total Revenue',
      value: `₹${stats?.total_revenue?.toFixed(2) || '0.00'}`,
      icon: DollarSign,
      color: '#E25E3E'
    }
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p style={{ color: '#52525B' }}>Loading dashboard...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1
            className="text-3xl tracking-tight"
            style={{
              fontFamily: 'Cabinet Grotesk, sans-serif',
              color: '#1A1A1A',
              fontWeight: '700'
            }}
          >
            Dashboard
          </h1>
          {restaurants.length > 0 && (
            <select
              data-testid="restaurant-selector"
              value={selectedRestaurant || ''}
              onChange={(e) => setSelectedRestaurant(e.target.value)}
              className="px-4 py-2 rounded-xl border"
              style={{ borderColor: '#E4E4E7', color: '#1A1A1A' }}
            >
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {restaurants.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg mb-4" style={{ color: '#52525B' }}>
              No restaurants added yet
            </p>
            <button
              data-testid="add-first-restaurant-btn"
              onClick={() => navigate('/admin/restaurants')}
              className="px-6 py-3 rounded-full font-semibold transition-all duration-200"
              style={{ backgroundColor: '#E25E3E', color: '#FFFFFF' }}
            >
              Add Your First Restaurant
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  data-testid={`stat-card-${card.title.toLowerCase().replace(/\s+/g, '-')}`}
                  className="rounded-xl p-6"
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E4E4E7',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.04)'
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="p-3 rounded-xl"
                      style={{ backgroundColor: `${card.color}15` }}
                    >
                      <Icon size={24} style={{ color: card.color }} />
                    </div>
                  </div>
                  <p className="text-sm mb-1" style={{ color: '#52525B' }}>
                    {card.title}
                  </p>
                  <p
                    className="text-3xl font-bold"
                    style={{ color: '#1A1A1A' }}
                  >
                    {card.value}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;