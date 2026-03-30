import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '@/components/AdminLayout';
import { Plus, QrCode, Download, Edit, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminTables = () => {
  const [tables, setTables] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({ table_number: '', capacity: '' });
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
        const tablesRes = await axios.get(`${API}/tables?restaurant_id=${restaurantId}`, { headers });
        setTables(tablesRes.data);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.post(`${API}/tables`, {
        restaurant_id: selectedRestaurant,
        table_number: formData.table_number,
        capacity: parseInt(formData.capacity)
      }, { headers });

      toast.success('Table added successfully');
      setShowDialog(false);
      setFormData({ table_number: '', capacity: '' });
      loadData();
    } catch (error) {
      console.error('Error saving table:', error);
      toast.error('Failed to add table');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this table?')) return;

    try {
      const token = localStorage.getItem('admin_token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`${API}/tables/${id}`, { headers });
      toast.success('Table deleted');
      loadData();
    } catch (error) {
      console.error('Error deleting table:', error);
      toast.error('Failed to delete table');
    }
  };

  const updateStatus = async (tableId, status) => {
    try {
      const token = localStorage.getItem('admin_token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`${API}/tables/${tableId}/status?status=${status}`, {}, { headers });
      toast.success('Table status updated');
      loadData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return '#10B981';
      case 'occupied': return '#EF4444';
      case 'reserved': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p style={{ color: '#475569' }}>Loading tables...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold gradient-text" style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Table Management
            </h1>
            <p className="text-sm mt-1" style={{ color: '#64748B' }}>Manage tables and generate QR codes</p>
          </div>
          <div className="flex gap-2">
            {restaurants.length > 0 && (
              <select
                value={selectedRestaurant || ''}
                onChange={(e) => setSelectedRestaurant(e.target.value)}
                className="px-4 py-2 rounded-xl border font-medium"
                style={{ borderColor: '#E2E8F0', color: '#1E293B', backgroundColor: '#FFFFFF' }}
              >
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            )}
            <Button
              onClick={() => setShowDialog(true)}
              className="rounded-full font-semibold"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#FFFFFF' }}
            >
              <Plus size={20} className="mr-2" /> Add Table
            </Button>
          </div>
        </div>

        {tables.length === 0 ? (
          <div className="text-center py-12 rounded-2xl gradient-card">
            <p style={{ color: '#94A3B8' }}>No tables added yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tables.map((table) => (
              <div
                key={table.id}
                className="rounded-2xl p-6 gradient-card"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold" style={{ color: '#1E293B' }}>
                      Table {table.table_number}
                    </h3>
                    <div className="flex items-center gap-1 text-sm mt-1" style={{ color: '#64748B' }}>
                      <Users size={14} />
                      <span>{table.capacity} seats</span>
                    </div>
                  </div>
                  <div 
                    className="px-3 py-1 rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: getStatusColor(table.status) }}
                  >
                    {table.status}
                  </div>
                </div>

                <div className="flex gap-2 mb-4">
                  <select
                    value={table.status}
                    onChange={(e) => updateStatus(table.id, e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border text-sm font-medium"
                    style={{ borderColor: '#E2E8F0' }}
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="reserved">Reserved</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => window.open(`/menu/${selectedRestaurant}`, '_blank')}
                    className="flex-1 rounded-xl text-xs font-semibold"
                    style={{ backgroundColor: '#F1F5F9', color: '#1E293B' }}
                  >
                    <QrCode size={14} className="mr-1" /> View QR
                  </Button>
                  <button
                    onClick={() => handleDelete(table.id)}
                    className="p-2 rounded-xl transition-all duration-200 hover:bg-red-50"
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
            <DialogTitle>Add New Table</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#475569' }}>
                Table Number
              </label>
              <Input
                type="text"
                value={formData.table_number}
                onChange={(e) => setFormData({ ...formData, table_number: e.target.value })}
                placeholder="e.g., 1, A1, VIP-1"
                className="rounded-xl"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderColor: '#E2E8F0' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#475569' }}>
                Capacity (Number of Seats)
              </label>
              <Input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                placeholder="e.g., 4"
                className="rounded-xl"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderColor: '#E2E8F0' }}
              />
            </div>
            <Button
              onClick={handleSave}
              className="w-full rounded-full py-3 font-semibold"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#FFFFFF' }}
            >
              Add Table
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminTables;
