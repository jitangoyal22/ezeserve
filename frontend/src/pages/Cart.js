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
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: '#FAFAFA', fontFamily: 'Manrope, sans-serif' }}>
        <div className="text-center">
          <p className="text-xl" style={{ color: '#52525B' }}>Your cart is empty</p>
          <Button
            data-testid="back-to-menu-btn"
            onClick={() => navigate(`/menu/${restaurantId}`)}
            className="mt-6 rounded-full"
            style={{ backgroundColor: '#E25E3E', color: '#FFFFFF' }}
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Menu
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAFA', fontFamily: 'Manrope, sans-serif' }}>
      <div className="sticky top-0 z-50" style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E4E4E7' }}>
        <div className="p-4 sm:p-6 flex items-center gap-4">
          <button
            data-testid="back-arrow-btn"
            onClick={() => navigate(`/menu/${restaurantId}`)}
            className="p-2 rounded-full transition-all duration-200 hover:bg-gray-100"
          >
            <ArrowLeft size={24} style={{ color: '#1A1A1A' }} />
          </button>
          <h1 className="text-2xl sm:text-3xl tracking-tight" style={{ fontFamily: 'Cabinet Grotesk, sans-serif', color: '#1A1A1A', fontWeight: '700' }}>
            Your Cart
          </h1>
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-3xl mx-auto pb-32">
        <div className="space-y-4">
          {cart.map(item => (
            <div
              key={item.menu_item_id}
              data-testid={`cart-item-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              className="rounded-xl p-4 flex items-center justify-between"
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #E4E4E7' }}
            >
              <div className="flex-1">
                <h3 className="font-semibold" style={{ color: '#1A1A1A' }}>{item.name}</h3>
                <p className="text-sm mt-1" style={{ color: '#E25E3E', fontWeight: '600' }}>₹{item.price}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  data-testid={`decrease-qty-btn-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => updateQuantity(item.menu_item_id, -1)}
                  className="p-2 rounded-full transition-all duration-200 hover:bg-gray-100"
                >
                  <Minus size={16} style={{ color: '#52525B' }} />
                </button>
                <span className="w-8 text-center font-semibold" style={{ color: '#1A1A1A' }}>{item.quantity}</span>
                <button
                  data-testid={`increase-qty-btn-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => updateQuantity(item.menu_item_id, 1)}
                  className="p-2 rounded-full transition-all duration-200 hover:bg-gray-100"
                >
                  <Plus size={16} style={{ color: '#52525B' }} />
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
            <label className="block text-sm font-medium mb-2" style={{ color: '#52525B' }}>Table Number (Optional)</label>
            <Input
              data-testid="table-number-input"
              type="text"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="Enter table number"
              className="rounded-xl"
              style={{ borderColor: '#E4E4E7' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#52525B' }}>Special Instructions (Optional)</label>
            <Textarea
              data-testid="special-notes-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requests?"
              className="rounded-xl"
              style={{ borderColor: '#E4E4E7' }}
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 z-50" style={{ backgroundColor: '#FFFFFF', borderTop: '1px solid #E4E4E7' }}>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-semibold" style={{ color: '#1A1A1A' }}>Total</span>
            <span className="text-2xl font-bold" style={{ color: '#E25E3E' }}>₹{cartTotal.toFixed(2)}</span>
          </div>
          <Button
            data-testid="place-order-btn"
            onClick={placeOrder}
            disabled={loading}
            className="w-full rounded-full py-6 text-base font-semibold transition-all duration-200 active:scale-98"
            style={{
              backgroundColor: '#E25E3E',
              color: '#FFFFFF',
              boxShadow: '0 20px 40px rgba(226,94,62,0.15)'
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