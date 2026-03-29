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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAFAFA' }}>
        <div className="text-lg" style={{ color: '#52525B' }}>Loading order...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAFAFA' }}>
        <div className="text-lg" style={{ color: '#EF4444' }}>Order not found</div>
      </div>
    );
  }

  const statusConfig = {
    pending: { icon: Clock, color: '#EAB308', label: 'Order Received' },
    preparing: { icon: ChefHat, color: '#3B82F6', label: 'Preparing' },
    ready: { icon: CheckCircle, color: '#4F6F52', label: 'Ready for Pickup' },
    completed: { icon: CheckCircle, color: '#4F6F52', label: 'Completed' },
    rejected: { icon: CheckCircle, color: '#EF4444', label: 'Rejected' }
  };

  const status = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAFA', fontFamily: 'Manrope, sans-serif' }}>
      <div className="p-4 sm:p-6 max-w-2xl mx-auto">
        <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E4E4E7' }}>
          <StatusIcon size={64} style={{ color: status.color, margin: '0 auto' }} />
          <h1 className="text-3xl mt-6 tracking-tight" style={{ fontFamily: 'Cabinet Grotesk, sans-serif', color: '#1A1A1A', fontWeight: '700' }}>
            {status.label}
          </h1>
          {order.waiting_time && (
            <p className="text-lg mt-2" style={{ color: '#52525B' }}>Estimated waiting time: {order.waiting_time} minutes</p>
          )}
          <div className="mt-6 p-4 rounded-xl" style={{ backgroundColor: '#F4F4F5' }}>
            <p className="text-sm" style={{ color: '#52525B' }}>Order ID</p>
            <p className="text-xl font-mono font-bold mt-1" style={{ color: '#1A1A1A' }}>{order.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E4E4E7' }}>
          <h2 className="text-xl font-semibold mb-4" style={{ color: '#1A1A1A' }}>Order Details</h2>
          {order.table_number && (
            <p className="text-sm mb-4" style={{ color: '#52525B' }}>Table: {order.table_number}</p>
          )}
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <p className="font-medium" style={{ color: '#1A1A1A' }}>{item.name}</p>
                  <p className="text-sm" style={{ color: '#52525B' }}>Qty: {item.quantity}</p>
                </div>
                <p className="font-semibold" style={{ color: '#E25E3E' }}>₹{(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="border-t mt-4 pt-4" style={{ borderColor: '#E4E4E7' }}>
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold" style={{ color: '#1A1A1A' }}>Total</span>
              <span className="text-2xl font-bold" style={{ color: '#E25E3E' }}>₹{order.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {order.customer_notes && (
          <div className="mt-6 rounded-2xl p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E4E4E7' }}>
            <h3 className="text-sm font-semibold mb-2" style={{ color: '#52525B' }}>Special Instructions</h3>
            <p style={{ color: '#1A1A1A' }}>{order.customer_notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderStatus;