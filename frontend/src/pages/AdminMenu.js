import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '@/components/AdminLayout';
import { Plus, Edit, Trash2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminMenu = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', display_order: 0 });
  const [itemForm, setItemForm] = useState({ name: '', description: '', price: '', category_id: '' });
  const [uploadFile, setUploadFile] = useState(null);
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
        const [categoriesRes, itemsRes] = await Promise.all([
          axios.get(`${API}/categories?restaurant_id=${restaurantId}`, { headers }),
          axios.get(`${API}/menu-items?restaurant_id=${restaurantId}`, { headers })
        ]);
        setCategories(categoriesRes.data);
        setMenuItems(itemsRes.data);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const handleSaveCategory = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const headers = { Authorization: `Bearer ${token}` };

      if (editingCategory) {
        await axios.put(`${API}/categories/${editingCategory}`, 
          { ...categoryForm, restaurant_id: selectedRestaurant },
          { headers }
        );
        toast.success('Category updated');
      } else {
        await axios.post(`${API}/categories`, 
          { ...categoryForm, restaurant_id: selectedRestaurant },
          { headers }
        );
        toast.success('Category created');
      }
      setShowCategoryDialog(false);
      setCategoryForm({ name: '', display_order: 0 });
      setEditingCategory(null);
      loadData();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Failed to save category');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const token = localStorage.getItem('admin_token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`${API}/categories/${id}`, { headers });
      toast.success('Category deleted');
      loadData();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  const handleSaveItem = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const headers = { Authorization: `Bearer ${token}` };

      let itemId;
      if (editingItem) {
        await axios.put(`${API}/menu-items/${editingItem}`, 
          { ...itemForm, price: parseFloat(itemForm.price) },
          { headers }
        );
        itemId = editingItem;
        toast.success('Menu item updated');
      } else {
        const response = await axios.post(`${API}/menu-items`, 
          { ...itemForm, restaurant_id: selectedRestaurant, price: parseFloat(itemForm.price) },
          { headers }
        );
        itemId = response.data.id;
        toast.success('Menu item created');
      }

      if (uploadFile) {
        const formData = new FormData();
        formData.append('file', uploadFile);
        await axios.post(`${API}/menu-items/${itemId}/upload-image`, formData, {
          headers: { ...headers, 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Image uploaded');
      }

      setShowItemDialog(false);
      setItemForm({ name: '', description: '', price: '', category_id: '' });
      setEditingItem(null);
      setUploadFile(null);
      loadData();
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Failed to save menu item');
    }
  };

  const handleDeleteItem = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const token = localStorage.getItem('admin_token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`${API}/menu-items/${id}`, { headers });
      toast.success('Menu item deleted');
      loadData();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const toggleAvailability = async (item) => {
    try {
      const token = localStorage.getItem('admin_token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`${API}/menu-items/${item.id}`, 
        { is_available: !item.is_available },
        { headers }
      );
      toast.success(item.is_available ? 'Marked as out of stock' : 'Marked as available');
      loadData();
    } catch (error) {
      console.error('Error toggling availability:', error);
      toast.error('Failed to update availability');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p style={{ color: '#52525B' }}>Loading menu...</p>
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
            Menu Management
          </h1>
          <div className="flex gap-2">
            {restaurants.length > 0 && (
              <select
                data-testid="menu-restaurant-selector"
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold" style={{ color: '#1A1A1A' }}>Categories</h2>
              <Button
                data-testid="add-category-btn"
                onClick={() => {
                  setCategoryForm({ name: '', display_order: 0 });
                  setEditingCategory(null);
                  setShowCategoryDialog(true);
                }}
                className="rounded-full transition-all duration-200"
                style={{ backgroundColor: '#E25E3E', color: '#FFFFFF' }}
                size="sm"
              >
                <Plus size={16} className="mr-1" /> Add
              </Button>
            </div>
            <div className="space-y-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  data-testid={`category-item-${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
                  className="rounded-xl p-4 flex items-center justify-between"
                  style={{ backgroundColor: '#FFFFFF', border: '1px solid #E4E4E7' }}
                >
                  <span className="font-medium" style={{ color: '#1A1A1A' }}>{cat.name}</span>
                  <div className="flex gap-2">
                    <button
                      data-testid={`edit-category-${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
                      onClick={() => {
                        setCategoryForm({ name: cat.name, display_order: cat.display_order });
                        setEditingCategory(cat.id);
                        setShowCategoryDialog(true);
                      }}
                      className="p-2 rounded-lg transition-all duration-200 hover:bg-gray-100"
                    >
                      <Edit size={16} style={{ color: '#52525B' }} />
                    </button>
                    <button
                      data-testid={`delete-category-${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-2 rounded-lg transition-all duration-200 hover:bg-red-50"
                    >
                      <Trash2 size={16} style={{ color: '#EF4444' }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold" style={{ color: '#1A1A1A' }}>Menu Items</h2>
              <Button
                data-testid="add-menu-item-btn"
                onClick={() => {
                  setItemForm({ name: '', description: '', price: '', category_id: categories[0]?.id || '' });
                  setEditingItem(null);
                  setUploadFile(null);
                  setShowItemDialog(true);
                }}
                className="rounded-full transition-all duration-200"
                style={{ backgroundColor: '#E25E3E', color: '#FFFFFF' }}
                size="sm"
                disabled={categories.length === 0}
              >
                <Plus size={16} className="mr-1" /> Add Item
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  data-testid={`menu-item-card-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                  className="rounded-xl overflow-hidden"
                  style={{ backgroundColor: '#FFFFFF', border: '1px solid #E4E4E7' }}
                >
                  {item.image_path && (
                    <img src={`${API}/images/${item.image_path}`} alt={item.name} className="w-full h-32 object-cover" />
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold" style={{ color: '#1A1A1A' }}>{item.name}</h3>
                        <p className="text-sm mt-1" style={{ color: '#52525B' }}>{item.description}</p>
                      </div>
                      <span
                        className="px-2 py-1 rounded-full text-xs ml-2"
                        style={{
                          backgroundColor: item.is_available ? '#4F6F5215' : '#EF444415',
                          color: item.is_available ? '#4F6F52' : '#EF4444'
                        }}
                      >
                        {item.is_available ? 'Available' : 'Out of Stock'}
                      </span>
                    </div>
                    <p className="text-lg font-bold mb-3" style={{ color: '#E25E3E' }}>₹{item.price}</p>
                    <div className="flex gap-2">
                      <Button
                        data-testid={`toggle-availability-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                        onClick={() => toggleAvailability(item)}
                        className="flex-1 rounded-full text-xs transition-all duration-200"
                        style={{ backgroundColor: '#F4F4F5', color: '#52525B' }}
                        size="sm"
                      >
                        {item.is_available ? 'Mark Unavailable' : 'Mark Available'}
                      </Button>
                      <button
                        data-testid={`edit-menu-item-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                        onClick={() => {
                          setItemForm({
                            name: item.name,
                            description: item.description || '',
                            price: item.price.toString(),
                            category_id: item.category_id
                          });
                          setEditingItem(item.id);
                          setUploadFile(null);
                          setShowItemDialog(true);
                        }}
                        className="p-2 rounded-lg transition-all duration-200 hover:bg-gray-100"
                      >
                        <Edit size={16} style={{ color: '#52525B' }} />
                      </button>
                      <button
                        data-testid={`delete-menu-item-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-2 rounded-lg transition-all duration-200 hover:bg-red-50"
                      >
                        <Trash2 size={16} style={{ color: '#EF4444' }} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#52525B' }}>Name</label>
              <Input
                data-testid="category-name-input"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#52525B' }}>Display Order</label>
              <Input
                data-testid="category-order-input"
                type="number"
                value={categoryForm.display_order}
                onChange={(e) => setCategoryForm({ ...categoryForm, display_order: parseInt(e.target.value) || 0 })}
                className="rounded-xl"
              />
            </div>
            <Button
              data-testid="save-category-btn"
              onClick={handleSaveCategory}
              className="w-full rounded-full"
              style={{ backgroundColor: '#E25E3E', color: '#FFFFFF' }}
            >
              Save Category
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#52525B' }}>Category</label>
              <select
                data-testid="item-category-select"
                value={itemForm.category_id}
                onChange={(e) => setItemForm({ ...itemForm, category_id: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border"
                style={{ borderColor: '#E4E4E7' }}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#52525B' }}>Name</label>
              <Input
                data-testid="item-name-input"
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#52525B' }}>Description</label>
              <Textarea
                data-testid="item-description-textarea"
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                className="rounded-xl"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#52525B' }}>Price (₹)</label>
              <Input
                data-testid="item-price-input"
                type="number"
                step="0.01"
                value={itemForm.price}
                onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#52525B' }}>Image</label>
              <Input
                data-testid="item-image-input"
                type="file"
                accept="image/*"
                onChange={(e) => setUploadFile(e.target.files[0])}
                className="rounded-xl"
              />
            </div>
            <Button
              data-testid="save-menu-item-btn"
              onClick={handleSaveItem}
              className="w-full rounded-full"
              style={{ backgroundColor: '#E25E3E', color: '#FFFFFF' }}
            >
              Save Menu Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminMenu;