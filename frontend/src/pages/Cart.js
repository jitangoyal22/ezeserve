import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Cart = () => {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [tableNumber, setTableNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem(`cart_${restaurantId}`);
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, [restaurantId]);

  useEffect(() => {
    localStorage.setItem(`cart_${restaurantId}`, JSON.stringify(cart));
  }, [cart, restaurantId]);

  const updateQuantity = (itemId, change) => {
    setCart(cart.map(c => {
      if (c.menu_item_id === itemId) {
        const newQuantity = c.quantity + change;
        return newQuantity > 0 ? { ...c, quantity: newQuantity } : null;
      }
      return c;
    }).filter(Boolean));
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(c => c.menu_item_id !== itemId));
    toast.success('Item removed from cart');
  };

  const placeOrder = async () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        restaurant_id: restaurantId,
        table_number: tableNumber || null,
        items: cart,
        customer_notes: notes || null
      };
      const response = await axios.post(`${API}/orders`, orderData);
      toast.success('Order placed successfully!');
      localStorage.removeItem(`cart_${restaurantId}`);
      navigate(`/order-status/${response.data.id}`);
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'linear-gradient(135deg, #F5F7FA 0%, #E8EAF6 100%)', fontFamily: 'Inter, sans-serif' }}>
        <div className="text-center">
          <p className="text-xl font-semibold" style={{ color: '#475569' }}>Your cart is empty</p>
          <Button
            data-testid="back-to-menu-btn"
            onClick={() => navigate(`/menu/${restaurantId}`)}
            className="mt-6 rounded-full font-medium"
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#FFFFFF' }}
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Menu
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #F5F7FA 0%, #E8EAF6 100%)', fontFamily: 'Inter, sans-serif' }}>
      <div className="sticky top-0 z-50 glass-card" style={{ backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255, 255, 255, 0.3)' }}>
        <div className="p-6 flex items-center gap-4">
          <button
            data-testid="back-arrow-btn"
            onClick={() => navigate(`/menu/${restaurantId}`)}
            className="p-2 rounded-full transition-all duration-200 hover:bg-white/50"
          >
            <ArrowLeft size={24} style={{ color: '#667eea' }} />
          </button>
          <h1 className="text-3xl font-bold gradient-text" style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Your Cart
          </h1>
        </div>
      </div>

      <div className="p-6 max-w-3xl mx-auto pb-32">
        <div className="space-y-4">
          {cart.map(item => (
            <div
              key={item.menu_item_id}
              data-testid={`cart-item-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              className="rounded-2xl p-5 flex items-center justify-between gradient-card"
            >
              <div className="flex-1">
                <h3 className="font-semibold" style={{ color: '#1E293B' }}>{item.name}</h3>
                <p className="text-sm mt-1 font-medium gradient-text" style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>₹{item.price}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  data-testid={`decrease-qty-btn-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => updateQuantity(item.menu_item_id, -1)}
                  className="p-2 rounded-full transition-all duration-200 hover:bg-white/50"
                >
                  <Minus size={16} style={{ color: '#475569' }} />
                </button>
                <span className="w-8 text-center font-semibold" style={{ color: '#1E293B' }}>{item.quantity}</span>
                <button
                  data-testid={`increase-qty-btn-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => updateQuantity(item.menu_item_id, 1)}
                  className="p-2 rounded-full transition-all duration-200 hover:bg-white/50"
                >
                  <Plus size={16} style={{ color: '#475569' }} />
                </button>
                <button
                  data-testid={`remove-item-btn-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => removeFromCart(item.menu_item_id)}
                  className="p-2 rounded-full transition-all duration-200 hover:bg-red-50 ml-2"
                >
                  <Trash2 size={16} style={{ color: '#EF4444' }} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#475569' }}>Table Number (Optional)</label>
            <Input
              data-testid="table-number-input"
              type="text"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="Enter table number"
              className="rounded-xl"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderColor: '#E2E8F0' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#475569' }}>Special Instructions (Optional)</label>
            <Textarea
              data-testid="special-notes-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requests?"
              className="rounded-xl"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderColor: '#E2E8F0' }}
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 z-50 glass-card" style={{ backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255, 255, 255, 0.3)' }}>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-semibold" style={{ color: '#1E293B' }}>Total</span>
            <span className="text-2xl font-bold gradient-text" style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>₹{cartTotal.toFixed(2)}</span>
          </div>
          <Button
            data-testid="place-order-btn"
            onClick={placeOrder}
            disabled={loading}
            className="w-full rounded-2xl py-4 text-base font-semibold transition-all duration-200 holographic"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#FFFFFF'
            }}
          >
            {loading ? 'Placing Order...' : 'Place Order'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Cart;