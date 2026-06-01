import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '@/components/AdminLayout';
import { Plus, Edit, Trash2, Download, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const EMPTY_FORM = {
  name: '', location: '', contact: '',
  tax_percent: 5.0, gst_number: '', tax_enabled: true
};

const AdminRestaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);

  const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('admin_token')}` });

  useEffect(() => { loadRestaurants(); }, []);

  const loadRestaurants = async () => {
    try {
      const res = await axios.get(`${API}/restaurants`, { headers: getHeaders() });
      setRestaurants(res.data);
      setLoading(false);
    } catch (e) { setLoading(false); }
  };

  const handleSave = async () => {
    try {
      const payload = {
        name: formData.name,
        location: formData.location,
        contact: formData.contact || null,
        tax_percent: parseFloat(formData.tax_percent) || 0,
        gst_number: formData.gst_number || null,
        tax_enabled: !!formData.tax_enabled
      };
      if (editingId) {
        await axios.put(`${API}/restaurants/${editingId}`, payload, { headers: getHeaders() });
        toast.success('Restaurant updated');
      } else {
        await axios.post(`${API}/restaurants`, payload, { headers: getHeaders() });
        toast.success('Restaurant created');
      }
      setShowDialog(false);
      setFormData(EMPTY_FORM);
      setEditingId(null);
      loadRestaurants();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to save');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this restaurant?')) return;
    try {
      await axios.delete(`${API}/restaurants/${id}`, { headers: getHeaders() });
      toast.success('Restaurant deleted');
      loadRestaurants();
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  const openEdit = (r) => {
    setFormData({
      name: r.name,
      location: r.location,
      contact: r.contact || '',
      tax_percent: r.tax_percent ?? 5.0,
      gst_number: r.gst_number || '',
      tax_enabled: r.tax_enabled !== false
    });
    setEditingId(r.id);
    setShowDialog(true);
  };

  const downloadQR = async (id, name) => {
    try {
      const res = await fetch(`${API}/restaurants/${id}/qr`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${name.replace(/\s+/g, '-')}-QR.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('QR downloaded');
    } catch (e) {
      toast.error('Download failed');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p style={{ color: '#475569' }}>Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-start sm:items-center mb-6 flex-col sm:flex-row gap-4">
          <div>
            <h1 className="text-3xl font-bold" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Restaurants
            </h1>
            <p className="text-sm mt-1" style={{ color: '#64748B' }}>Manage restaurants, GST settings & QR codes</p>
          </div>
          <Button
            data-testid="add-restaurant-btn"
            onClick={() => { setFormData(EMPTY_FORM); setEditingId(null); setShowDialog(true); }}
            className="rounded-xl text-white font-semibold"
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            <Plus size={16} className="mr-1" /> Add Restaurant
          </Button>
        </div>

        {restaurants.length === 0 ? (
          <div className="text-center py-12 rounded-2xl gradient-card">
            <Store size={48} className="mx-auto mb-3" style={{ color: '#CBD5E1' }} />
            <p style={{ color: '#94A3B8' }}>No restaurants added yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {restaurants.map((r) => (
              <div
                key={r.id}
                data-testid={`restaurant-card-${r.name.toLowerCase().replace(/\s+/g, '-')}`}
                className="rounded-2xl p-5 gradient-card"
              >
                <h3 className="text-lg font-bold mb-1" style={{ color: '#1E293B' }}>{r.name}</h3>
                <p className="text-sm mb-1" style={{ color: '#64748B' }}>{r.location}</p>
                {r.contact && <p className="text-xs mb-2" style={{ color: '#94A3B8' }}>{r.contact}</p>}

                <div className="flex flex-wrap gap-2 my-3">
                  <span className="text-[10px] px-2 py-1 rounded-full font-semibold" style={{
                    backgroundColor: r.tax_enabled !== false ? '#DBEAFE' : '#F1F5F9',
                    color: r.tax_enabled !== false ? '#1E40AF' : '#64748B'
                  }}>
                    {r.tax_enabled !== false ? `GST ${r.tax_percent ?? 5}%` : 'GST OFF'}
                  </span>
                  {r.gst_number && (
                    <span className="text-[10px] px-2 py-1 rounded-full font-mono" style={{ backgroundColor: '#F1F5F9', color: '#475569' }}>
                      {r.gst_number}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    data-testid={`download-restaurant-qr-${r.name.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => downloadQR(r.id, r.name)}
                    className="flex-1 rounded-xl text-xs font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                    size="sm"
                  >
                    <Download size={14} className="mr-1" /> QR
                  </Button>
                  <button
                    data-testid={`edit-restaurant-${r.name.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => openEdit(r)}
                    className="p-2 rounded-xl transition hover:bg-purple-50"
                  >
                    <Edit size={16} style={{ color: '#667eea' }} />
                  </button>
                  <button
                    data-testid={`delete-restaurant-${r.name.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => handleDelete(r.id)}
                    className="p-2 rounded-xl transition hover:bg-red-50"
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
        <DialogContent className="max-w-md" data-testid="restaurant-form-dialog">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Restaurant' : 'Add Restaurant'}</DialogTitle>
            <DialogDescription>Set details and tax configuration</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: '#64748B' }}>NAME</label>
              <Input data-testid="restaurant-name-input" value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="rounded-xl" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: '#64748B' }}>LOCATION</label>
              <Input data-testid="restaurant-location-input" value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="rounded-xl" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: '#64748B' }}>CONTACT (OPTIONAL)</label>
              <Input data-testid="restaurant-contact-input" value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })} className="rounded-xl" />
            </div>
            <div className="rounded-xl p-3" style={{ backgroundColor: '#F8FAFC' }}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold" style={{ color: '#64748B' }}>GST / TAX</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: formData.tax_enabled ? '#10B981' : '#64748B' }}>
                    {formData.tax_enabled ? 'ENABLED' : 'DISABLED'}
                  </span>
                  <Switch
                    data-testid="tax-enabled-switch"
                    checked={!!formData.tax_enabled}
                    onCheckedChange={(v) => setFormData({ ...formData, tax_enabled: v })}
                  />
                </div>
              </div>
              {formData.tax_enabled && (
                <>
                  <div className="mb-2">
                    <label className="block text-[10px] font-bold mb-1" style={{ color: '#64748B' }}>DEFAULT GST %</label>
                    <Input
                      data-testid="tax-percent-input"
                      type="number"
                      step="0.1"
                      value={formData.tax_percent}
                      onChange={(e) => setFormData({ ...formData, tax_percent: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold mb-1" style={{ color: '#64748B' }}>GST NUMBER (OPTIONAL)</label>
                    <Input
                      data-testid="gst-number-input"
                      value={formData.gst_number}
                      onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                      placeholder="e.g., 29ABCDE1234F1Z5"
                      className="rounded-xl font-mono text-sm"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} className="rounded-xl">Cancel</Button>
            <Button
              data-testid="save-restaurant-btn"
              onClick={handleSave}
              className="rounded-xl text-white font-semibold"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminRestaurants;
