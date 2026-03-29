import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShoppingCart, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CustomerMenu = () => {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const savedCart = localStorage.getItem(`cart_${restaurantId}`);
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, [restaurantId]);

  useEffect(() => {
    localStorage.setItem(`cart_${restaurantId}`, JSON.stringify(cart));
  }, [cart, restaurantId]);

  const loadData = async () => {
    try {
      const [restaurantRes, categoriesRes, itemsRes] = await Promise.all([
        axios.get(`${API}/restaurants/${restaurantId}`),
        axios.get(`${API}/categories?restaurant_id=${restaurantId}`),
        axios.get(`${API}/menu-items?restaurant_id=${restaurantId}`)
      ]);
      setRestaurant(restaurantRes.data);
      setCategories(categoriesRes.data);
      setMenuItems(itemsRes.data);
      if (categoriesRes.data.length > 0) {
        setActiveCategory(categoriesRes.data[0].id);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load menu');
      setLoading(false);
    }
  };

  const addToCart = (item) => {
    const existingItem = cart.find(c => c.menu_item_id === item.id);
    if (existingItem) {
      setCart(cart.map(c => 
        c.menu_item_id === item.id 
          ? { ...c, quantity: c.quantity + 1 }
          : c
      ));
    } else {
      setCart([...cart, {
        menu_item_id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1
      }]);
    }
    toast.success(`${item.name} added to cart`);
  };

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
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !activeCategory || item.category_id === activeCategory;
    return matchesSearch && matchesCategory && item.is_available;
  });

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #F5F7FA 0%, #E8EAF6 100%)' }}>
        <div className="text-lg font-semibold gradient-text">Loading menu...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #F5F7FA 0%, #E8EAF6 100%)', fontFamily: 'Inter, sans-serif' }}>
      <div className="sticky top-0 z-50 glass-card" style={{ backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255, 255, 255, 0.3)' }}>
        <div className="p-6">
          <h1 className="text-3xl font-bold gradient-text" style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {restaurant?.name}
          </h1>
          {restaurant?.location && (
            <p className="text-sm mt-1 font-medium" style={{ color: '#64748B' }}>{restaurant.location}</p>
          )}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#667eea' }} size={20} />
            <Input
              data-testid="menu-search-input"
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                borderColor: '#E2E8F0'
              }}
            />
          </div>
        </div>
        
        {categories.length > 0 && (
          <div className="overflow-x-auto hide-scrollbar px-6 pb-4">
            <div className="flex gap-3">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  data-testid={`category-pill-${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => setActiveCategory(cat.id)}
                  className="px-6 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all duration-200"
                  style={{
                    background: activeCategory === cat.id ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255, 255, 255, 0.8)',
                    color: activeCategory === cat.id ? '#FFFFFF' : '#475569',
                    border: '1px solid rgba(102, 126, 234, 0.2)'
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-6 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {filteredItems.map(item => (
            <div
              key={item.id}
              data-testid={`menu-item-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              className="rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-2 gradient-card"
            >
              {item.image_path && (
                <img
                  src={`${API}/images/${item.image_path}`}
                  alt={item.name}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-5">
                <h3 className="text-lg font-semibold" style={{ color: '#1E293B' }}>{item.name}</h3>
                {item.description && (
                  <p className="text-sm mt-2" style={{ color: '#64748B' }}>{item.description}</p>
                )}
                <div className="flex items-center justify-between mt-4">
                  <span className="text-2xl font-bold gradient-text" style={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>₹{item.price}</span>
                  <Button
                    data-testid={`add-to-cart-btn-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => addToCart(item)}
                    className="rounded-full transition-all duration-200 font-medium"
                    style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#FFFFFF' }}
                  >
                    Add to Cart
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p style={{ color: '#94A3B8' }}>No items found</p>
          </div>
        )}
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-6 z-50 glass-card" style={{ backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255, 255, 255, 0.3)' }}>
          <div className="max-w-7xl mx-auto">
            <Button
              data-testid="view-cart-btn"
              onClick={() => navigate(`/cart/${restaurantId}`)}
              className="w-full rounded-2xl py-4 text-base font-semibold transition-all duration-200 holographic"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#FFFFFF'
              }}
            >
              <ShoppingCart size={20} className="mr-2" />
              View Cart ({cartItemCount} items) • ₹{cartTotal.toFixed(2)}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerMenu;