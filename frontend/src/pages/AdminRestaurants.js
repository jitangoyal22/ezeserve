import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '@/components/AdminLayout';
import { Plus, Edit, Trash2, QrCode, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminRestaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [formData, setFormData] = useState({ name: '', location: '', contact: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API}/restaurants`, { headers });
      setRestaurants(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading restaurants:', error);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const headers = { Authorization: `Bearer ${token}` };

      if (editingRestaurant) {
        await axios.put(`${API}/restaurants/${editingRestaurant}`, formData, { headers });
        toast.success('Restaurant updated');
      } else {
        await axios.post(`${API}/restaurants`, formData, { headers });
        toast.success('Restaurant created');
      }
      setShowDialog(false);
      setFormData({ name: '', location: '', contact: '' });
      setEditingRestaurant(null);
      loadRestaurants();
    } catch (error) {
      console.error('Error saving restaurant:', error);
      toast.error('Failed to save restaurant');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this restaurant?')) return;

    try {
      const token = localStorage.getItem('admin_token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`${API}/restaurants/${id}`, { headers });
      toast.success('Restaurant deleted');
      loadRestaurants();
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      toast.error('Failed to delete restaurant');
    }
  };

  const downloadQR = async (restaurantId, restaurantName) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/restaurants/${restaurantId}/qr`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${restaurantName.replace(/\s+/g, '-')}-qr.png`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('QR code downloaded');
    } catch (error) {
      console.error('Error downloading QR:', error);
      toast.error('Failed to download QR code');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p style={{ color: '#52525B' }}>Loading restaurants...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1
            className="text-3xl tracking-tight"
            style={{
              fontFamily: 'Cabinet Grotesk, sans-serif',
              color: '#1A1A1A',
              fontWeight: '700'
            }}
          >
            Restaurants
          </h1>
          <Button
            data-testid="add-restaurant-btn"
            onClick={() => {
              setFormData({ name: '', location: '', contact: '' });
              setEditingRestaurant(null);
              setShowDialog(true);
            }}
            className="rounded-full transition-all duration-200"
            style={{ backgroundColor: '#E25E3E', color: '#FFFFFF' }}
          >
            <Plus size={20} className="mr-2" /> Add Restaurant
          </Button>
        </div>

        {restaurants.length === 0 ? (
          <div className="text-center py-12 rounded-xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E4E4E7' }}>
            <p style={{ color: '#A1A1AA' }}>No restaurants added yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                data-testid={`restaurant-card-${restaurant.name.toLowerCase().replace(/\s+/g, '-')}`}
                className="rounded-xl p-6"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E4E4E7',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.04)'
                }}
              >
                <h3 className="text-xl font-semibold mb-2" style={{ color: '#1A1A1A' }}>
                  {restaurant.name}
                </h3>
                <p className="text-sm mb-1" style={{ color: '#52525B' }}>
                  {restaurant.location}
                </p>
                {restaurant.contact && (
                  <p className="text-sm mb-4" style={{ color: '#52525B' }}>
                    {restaurant.contact}
                  </p>
                )}
                <div className="flex gap-2 mt-4">
                  <Button
                    data-testid={`download-qr-${restaurant.name.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => downloadQR(restaurant.id, restaurant.name)}
                    className="flex-1 rounded-full text-sm transition-all duration-200"
                    style={{ backgroundColor: '#4F6F52', color: '#FFFFFF' }}
                    size="sm"
                  >
                    <Download size={14} className="mr-1" /> QR Code
                  </Button>
                  <button
                    data-testid={`edit-restaurant-${restaurant.name.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => {
                      setFormData({
                        name: restaurant.name,
                        location: restaurant.location,
                        contact: restaurant.contact || ''
                      });
                      setEditingRestaurant(restaurant.id);
                      setShowDialog(true);
                    }}
                    className="p-2 rounded-lg transition-all duration-200 hover:bg-gray-100"
                  >
                    <Edit size={16} style={{ color: '#52525B' }} />
                  </button>
                  <button
                    data-testid={`delete-restaurant-${restaurant.name.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => handleDelete(restaurant.id)}
                    className="p-2 rounded-lg transition-all duration-200 hover:bg-red-50"
                  >
                    <Trash2 size={16} style={{ color: '#EF4444' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRestaurant ? 'Edit Restaurant' : 'Add Restaurant'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#52525B' }}>
                Restaurant Name
              </label>
              <Input
                data-testid="restaurant-name-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="rounded-xl"
                style={{ borderColor: '#E4E4E7' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#52525B' }}>
                Location
              </label>
              <Input
                data-testid="restaurant-location-input"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="rounded-xl"
                style={{ borderColor: '#E4E4E7' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#52525B' }}>
                Contact (Optional)
              </label>
              <Input
                data-testid="restaurant-contact-input"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                className="rounded-xl"
                style={{ borderColor: '#E4E4E7' }}
              />
            </div>
            <Button
              data-testid="save-restaurant-btn"
              onClick={handleSave}
              className="w-full rounded-full transition-all duration-200"
              style={{ backgroundColor: '#E25E3E', color: '#FFFFFF' }}
            >
              Save Restaurant
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminRestaurants;