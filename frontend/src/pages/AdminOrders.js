import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '@/components/AdminLayout';
import { Clock, CheckCircle, XCircle, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [waitingTimes, setWaitingTimes] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [selectedRestaurant, filterStatus]);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const headers = { Authorization: `Bearer ${token}` };

      const restaurantsRes = await axios.get(`${API}/restaurants`, { headers });
      setRestaurants(restaurantsRes.data);

      if (!selectedRestaurant && restaurantsRes.data.length > 0) {
        setSelectedRestaurant(restaurantsRes.data[0].id);
      }

      const restaurantId = selectedRestaurant || (restaurantsRes.data.length > 0 ? restaurantsRes.data[0].id : null);
      if (restaurantId) {
        let url = `${API}/orders?restaurant_id=${restaurantId}`;
        if (filterStatus !== 'all') {
          url += `&status=${filterStatus}`;
        }
        const ordersRes = await axios.get(url, { headers });
        setOrders(ordersRes.data);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const token = localStorage.getItem('admin_token');
      const headers = { Authorization: `Bearer ${token}` };

      const waitingTime = waitingTimes[orderId] || null;
      await axios.put(`${API}/orders/${orderId}/status`, 
        { status, waiting_time: waitingTime ? parseInt(waitingTime) : null },
        { headers }
      );
      toast.success('Order status updated');
      loadData();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order status');
    }
  };

  const statusButtons = [
    { value: 'all', label: 'All Orders', color: '#52525B' },
    { value: 'pending', label: 'Pending', color: '#EAB308' },
    { value: 'preparing', label: 'Preparing', color: '#3B82F6' },
    { value: 'ready', label: 'Ready', color: '#4F6F52' },
    { value: 'completed', label: 'Completed', color: '#4F6F52' },
    { value: 'rejected', label: 'Rejected', color: '#EF4444' }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock size={20} style={{ color: '#EAB308' }} />;
      case 'preparing': return <ChefHat size={20} style={{ color: '#3B82F6' }} />;
      case 'ready': return <CheckCircle size={20} style={{ color: '#4F6F52' }} />;
      case 'completed': return <CheckCircle size={20} style={{ color: '#4F6F52' }} />;
      case 'rejected': return <XCircle size={20} style={{ color: '#EF4444' }} />;
      default: return <Clock size={20} style={{ color: '#A1A1AA' }} />;
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p style={{ color: '#52525B' }}>Loading orders...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1
            className="text-3xl tracking-tight"
            style={{
              fontFamily: 'Cabinet Grotesk, sans-serif',
              color: '#1A1A1A',
              fontWeight: '700'
            }}
          >
            Orders
          </h1>
          {restaurants.length > 0 && (
            <select
              data-testid="order-restaurant-selector"
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

        <div className="flex gap-2 overflow-x-auto mb-6 pb-2">
          {statusButtons.map((btn) => (
            <button
              key={btn.value}
              data-testid={`filter-status-${btn.value}`}
              onClick={() => setFilterStatus(btn.value)}
              className="px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all duration-200"
              style={{
                backgroundColor: filterStatus === btn.value ? btn.color : '#F4F4F5',
                color: filterStatus === btn.value ? '#FFFFFF' : '#52525B'
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12 rounded-xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E4E4E7' }}>
            <p style={{ color: '#A1A1AA' }}>No orders found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                data-testid={`order-card-${order.id.slice(0, 8)}`}
                className="rounded-xl p-6"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E4E4E7',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.04)'
                }}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(order.status)}
                      <span className="font-mono font-semibold" style={{ color: '#1A1A1A' }}>
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                    </div>
                    {order.table_number && (
                      <p className="text-sm" style={{ color: '#52525B' }}>Table: {order.table_number}</p>
                    )}
                    <p className="text-xs mt-1" style={{ color: '#A1A1AA' }}>
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold" style={{ color: '#E25E3E' }}>₹{order.total_amount.toFixed(2)}</p>
                    <p className="text-xs capitalize px-3 py-1 rounded-full inline-block mt-2" style={{
                      backgroundColor: `${statusButtons.find(s => s.value === order.status)?.color || '#52525B'}15`,
                      color: statusButtons.find(s => s.value === order.status)?.color || '#52525B'
                    }}>
                      {order.status}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-2" style={{ color: '#52525B' }}>Items:</h3>
                  <div className="space-y-1">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span style={{ color: '#1A1A1A' }}>{item.quantity}x {item.name}</span>
                        <span style={{ color: '#52525B' }}>₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {order.customer_notes && (
                  <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: '#F4F4F5' }}>
                    <p className="text-sm" style={{ color: '#52525B' }}>Note: {order.customer_notes}</p>
                  </div>
                )}

                {order.status === 'pending' && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      data-testid={`waiting-time-input-${order.id.slice(0, 8)}`}
                      type="number"
                      placeholder="Waiting time (mins)"
                      value={waitingTimes[order.id] || ''}
                      onChange={(e) => setWaitingTimes({ ...waitingTimes, [order.id]: e.target.value })}
                      className="rounded-xl"
                      style={{ borderColor: '#E4E4E7' }}
                    />
                    <Button
                      data-testid={`accept-order-btn-${order.id.slice(0, 8)}`}
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      className="rounded-full transition-all duration-200"
                      style={{ backgroundColor: '#4F6F52', color: '#FFFFFF' }}
                    >
                      Accept
                    </Button>
                    <Button
                      data-testid={`reject-order-btn-${order.id.slice(0, 8)}`}
                      onClick={() => updateOrderStatus(order.id, 'rejected')}
                      className="rounded-full transition-all duration-200"
                      style={{ backgroundColor: '#EF4444', color: '#FFFFFF' }}
                    >
                      Reject
                    </Button>
                  </div>
                )}

                {order.status === 'preparing' && (
                  <Button
                    data-testid={`mark-ready-btn-${order.id.slice(0, 8)}`}
                    onClick={() => updateOrderStatus(order.id, 'ready')}
                    className="w-full rounded-full transition-all duration-200"
                    style={{ backgroundColor: '#4F6F52', color: '#FFFFFF' }}
                  >
                    Mark as Ready
                  </Button>
                )}

                {order.status === 'ready' && (
                  <Button
                    data-testid={`complete-order-btn-${order.id.slice(0, 8)}`}
                    onClick={() => updateOrderStatus(order.id, 'completed')}
                    className="w-full rounded-full transition-all duration-200"
                    style={{ backgroundColor: '#4F6F52', color: '#FFFFFF' }}
                  >
                    Mark as Completed
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;