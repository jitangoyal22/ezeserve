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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAFAFA' }}>
        <div className="text-lg" style={{ color: '#52525B' }}>Loading menu...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAFA', fontFamily: 'Manrope, sans-serif' }}>
      <div className="sticky top-0 z-50" style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E4E4E7' }}>
        <div className="p-4 sm:p-6">
          <h1 className="text-2xl sm:text-3xl tracking-tight" style={{ fontFamily: 'Cabinet Grotesk, sans-serif', color: '#1A1A1A', fontWeight: '700' }}>
            {restaurant?.name}
          </h1>
          {restaurant?.location && (
            <p className="text-sm mt-1" style={{ color: '#52525B' }}>{restaurant.location}</p>
          )}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#A1A1AA' }} size={20} />
            <Input
              data-testid="menu-search-input"
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl border"
              style={{ borderColor: '#E4E4E7' }}
            />
          </div>
        </div>
        
        {categories.length > 0 && (
          <div className="overflow-x-auto hide-scrollbar px-4 pb-3">
            <div className="flex gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  data-testid={`category-pill-${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => setActiveCategory(cat.id)}
                  className="px-4 py-2 rounded-full whitespace-nowrap text-sm transition-all duration-200"
                  style={{
                    backgroundColor: activeCategory === cat.id ? '#E25E3E' : '#F4F4F5',
                    color: activeCategory === cat.id ? '#FFFFFF' : '#52525B',
                    fontWeight: activeCategory === cat.id ? '600' : '500'
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 sm:p-6 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {filteredItems.map(item => (
            <div
              key={item.id}
              data-testid={`menu-item-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              className="rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-1"
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E4E4E7',
                boxShadow: '0 8px 30px rgba(0,0,0,0.04)'
              }}
            >
              {item.image_path && (
                <img
                  src={`${API}/images/${item.image_path}`}
                  alt={item.name}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <h3 className="text-lg font-semibold" style={{ color: '#1A1A1A' }}>{item.name}</h3>
                {item.description && (
                  <p className="text-sm mt-1" style={{ color: '#52525B' }}>{item.description}</p>
                )}
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xl font-bold" style={{ color: '#E25E3E' }}>₹{item.price}</span>
                  <Button
                    data-testid={`add-to-cart-btn-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => addToCart(item)}
                    className="rounded-full transition-all duration-200 active:scale-95"
                    style={{ backgroundColor: '#E25E3E', color: '#FFFFFF' }}
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
            <p style={{ color: '#A1A1AA' }}>No items found</p>
          </div>
        )}
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-50" style={{ backgroundColor: '#FFFFFF', borderTop: '1px solid #E4E4E7' }}>
          <div className="max-w-7xl mx-auto">
            <Button
              data-testid="view-cart-btn"
              onClick={() => navigate(`/cart/${restaurantId}`)}
              className="w-full rounded-full py-6 text-base font-semibold transition-all duration-200 active:scale-98"
              style={{
                backgroundColor: '#E25E3E',
                color: '#FFFFFF',
                boxShadow: '0 20px 40px rgba(226,94,62,0.15)'
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