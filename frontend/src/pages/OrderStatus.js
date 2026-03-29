import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, Clock, ChefHat } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const OrderStatus = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
    const interval = setInterval(loadOrder, 10000);
    return () => clearInterval(interval);
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const response = await axios.get(`${API}/orders/${orderId}`);
      setOrder(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading order:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #F5F7FA 0%, #E8EAF6 100%)' }}>
        <div className="text-lg font-semibold" style={{ color: '#475569' }}>Loading order...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #F5F7FA 0%, #E8EAF6 100%)' }}>
        <div className="text-lg font-semibold" style={{ color: '#EF4444' }}>Order not found</div>
      </div>
    );
  }

  const statusConfig = {
    pending: { icon: Clock, color: '#F59E0B', label: 'Order Received' },
    preparing: { icon: ChefHat, color: '#667eea', label: 'Preparing' },
    ready: { icon: CheckCircle, color: '#10B981', label: 'Ready for Pickup' },
    completed: { icon: CheckCircle, color: '#10B981', label: 'Completed' },
    rejected: { icon: CheckCircle, color: '#EF4444', label: 'Rejected' }
  };

  const status = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #F5F7FA 0%, #E8EAF6 100%)', fontFamily: 'Inter, sans-serif' }}>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="rounded-3xl p-8 text-center gradient-card">
          <StatusIcon size={64} style={{ color: status.color, margin: '0 auto' }} />
          <h1 className="text-3xl mt-6 font-bold" style={{ color: '#1E293B' }}>
            {status.label}
          </h1>
          {order.waiting_time && (
            <p className="text-lg mt-2 font-medium" style={{ color: '#475569' }}>Estimated waiting time: {order.waiting_time} minutes</p>
          )}
          <div className="mt-6 p-4 rounded-2xl" style={{ backgroundColor: 'rgba(102, 126, 234, 0.1)' }}>
            <p className="text-sm font-medium" style={{ color: '#475569' }}>Order ID</p>
            <p className="text-xl font-mono font-bold mt-1" style={{ color: '#1E293B' }}>{order.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>

        <div className="mt-6 rounded-3xl p-6 gradient-card">
          <h2 className="text-xl font-semibold mb-4" style={{ color: '#1E293B' }}>Order Details</h2>
          {order.table_number && (
            <p className="text-sm mb-4 font-medium" style={{ color: '#475569' }}>Table: {order.table_number}</p>
          )}
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <p className="font-medium" style={{ color: '#1E293B' }}>{item.name}</p>
                  <p className="text-sm" style={{ color: '#64748B' }}>Qty: {item.quantity}</p>
                </div>
                <p className="font-semibold gradient-text" style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>₹{(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="border-t mt-4 pt-4" style={{ borderColor: '#E2E8F0' }}>
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold" style={{ color: '#1E293B' }}>Total</span>
              <span className="text-2xl font-bold gradient-text" style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>₹{order.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {order.customer_notes && (
          <div className="mt-6 rounded-3xl p-6 gradient-card">
            <h3 className="text-sm font-semibold mb-2" style={{ color: '#64748B' }}>Special Instructions</h3>
            <p style={{ color: '#1E293B' }}>{order.customer_notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderStatus;