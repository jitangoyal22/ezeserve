import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdminLayout from '@/components/AdminLayout';
import { Plus, QrCode, Download, Trash2, Users, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminTables = () => {
  const [tables, setTables] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [qrTable, setQrTable] = useState(null);
  const [formData, setFormData] = useState({ table_number: '', capacity: '' });
  const [loading, setLoading] = useState(true);

  const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('admin_token')}` });

  const loadData = useCallback(async () => {
    try {
      const restaurantsRes = await axios.get(`${API}/restaurants`, { headers: getHeaders() });
      setRestaurants(restaurantsRes.data);
      const rid = selectedRestaurant || restaurantsRes.data[0]?.id;
      if (rid && !selectedRestaurant) setSelectedRestaurant(rid);
      if (rid) {
        const tablesRes = await axios.get(`${API}/tables?restaurant_id=${rid}`, { headers: getHeaders() });
        setTables(tablesRes.data);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  }, [selectedRestaurant]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async () => {
    try {
      await axios.post(`${API}/tables`, {
        restaurant_id: selectedRestaurant,
        table_number: formData.table_number,
        capacity: parseInt(formData.capacity)
      }, { headers: getHeaders() });
      toast.success('Table added');
      setShowDialog(false);
      setFormData({ table_number: '', capacity: '' });
      loadData();
    } catch (error) {
      toast.error('Failed to add table');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this table?')) return;
    try {
      await axios.delete(`${API}/tables/${id}`, { headers: getHeaders() });
      toast.success('Table deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const updateStatus = async (tableId, status) => {
    try {
      await axios.put(`${API}/tables/${tableId}/status?status=${status}`, {}, { headers: getHeaders() });
      loadData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getStatusColor = (status) => ({
    available: '#10B981', occupied: '#EF4444', reserved: '#F59E0B'
  }[status] || '#6B7280');

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
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Table Management
            </h1>
            <p className="text-sm mt-1" style={{ color: '#64748B' }}>Per-table QR codes for direct ordering</p>
          </div>
          <div className="flex gap-2">
            {restaurants.length > 0 && (
              <Select value={selectedRestaurant || ''} onValueChange={setSelectedRestaurant}>
                <SelectTrigger data-testid="tables-restaurant-selector" className="w-[200px] rounded-xl bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {restaurants.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Button
              data-testid="add-table-btn"
              onClick={() => setShowDialog(true)}
              className="rounded-xl text-white font-semibold"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              <Plus size={16} className="mr-1" /> Add Table
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
              <div key={table.id} className="rounded-2xl p-5 gradient-card" data-testid={`table-card-${table.table_number}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-bold" style={{ color: '#1E293B' }}>
                      Table {table.table_number}
                    </h3>
                    <div className="flex items-center gap-1 text-sm mt-1" style={{ color: '#64748B' }}>
                      <Users size={14} />
                      <span>{table.capacity} seats</span>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: getStatusColor(table.status) }}>
                    {table.status}
                  </div>
                </div>

                <Select value={table.status} onValueChange={(v) => updateStatus(table.id, v)}>
                  <SelectTrigger data-testid={`status-select-${table.table_number}`} className="rounded-xl mb-3 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="reserved">Reserved</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Button
                    data-testid={`view-qr-btn-${table.table_number}`}
                    onClick={() => setQrTable(table)}
                    className="flex-1 rounded-xl text-xs font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                  >
                    <QrCode size={14} className="mr-1" /> QR Code
                  </Button>
                  <button
                    data-testid={`delete-table-btn-${table.table_number}`}
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

      {/* Add Table Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Table</DialogTitle>
            <DialogDescription>Each table gets a unique QR code for direct ordering</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#475569' }}>Table Number</label>
              <Input
                data-testid="table-number-input"
                type="text"
                value={formData.table_number}
                onChange={(e) => setFormData({ ...formData, table_number: e.target.value })}
                placeholder="e.g., 1, A1, VIP-1"
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#475569' }}>Capacity</label>
              <Input
                data-testid="table-capacity-input"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                placeholder="e.g., 4"
                className="rounded-xl"
              />
            </div>
            <Button
              data-testid="save-table-btn"
              onClick={handleSave}
              className="w-full rounded-xl py-3 font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              Add Table
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Preview Dialog */}
      {qrTable && (
        <TableQRDialog
          table={qrTable}
          restaurant={restaurants.find(r => r.id === qrTable.restaurant_id) || restaurants.find(r => r.id === selectedRestaurant)}
          onClose={() => setQrTable(null)}
        />
      )}
    </AdminLayout>
  );
};

const TableQRDialog = ({ table, restaurant, onClose }) => {
  const qrUrl = `${API}/tables/${table.id}/qr`;
  const menuUrl = `${window.location.origin}/menu/${table.restaurant_id || restaurant?.id}?table=${table.table_number}`;

  const downloadQR = async () => {
    try {
      const res = await fetch(qrUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Table-${table.table_number}-QR.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('QR downloaded');
    } catch (e) {
      toast.error('Download failed');
    }
  };

  const printQR = () => {
    const w = window.open('', '_blank', 'width=400,height=600');
    if (!w) { toast.error('Popup blocked'); return; }
    w.document.write(`
      <html>
        <head>
          <title>Table ${table.table_number} QR</title>
          <style>
            @page { size: 80mm 120mm; margin: 4mm; }
            body { font-family: -apple-system, sans-serif; text-align: center; padding: 8px; }
            h1 { margin: 6px 0; font-size: 20px; color: #1E293B; }
            .sub { font-size: 11px; color: #64748B; margin-bottom: 8px; }
            img { max-width: 220px; }
            .table { font-size: 28px; font-weight: 800; margin: 8px 0; color: #667eea; }
            .url { font-size: 9px; color: #94A3B8; word-break: break-all; margin-top: 6px; }
          </style>
        </head>
        <body>
          <h1>${restaurant?.name || ''}</h1>
          <div class="sub">Scan to order</div>
          <div class="table">Table ${table.table_number}</div>
          <img src="${qrUrl}" alt="QR" onload="window.print()" />
          <div class="url">${menuUrl}</div>
        </body>
      </html>
    `);
    w.document.close();
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent data-testid="qr-preview-dialog">
        <DialogHeader>
          <DialogTitle>Table {table.table_number} QR Code</DialogTitle>
          <DialogDescription>
            Customers scan this to view the menu — table number is auto-filled.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3">
          <div className="p-4 bg-white rounded-2xl border" style={{ borderColor: '#E2E8F0' }}>
            <img src={qrUrl} alt={`Table ${table.table_number} QR`} className="w-56 h-56" data-testid="qr-image" />
          </div>
          <p className="text-xs text-center break-all" style={{ color: '#94A3B8' }}>{menuUrl}</p>
          <div className="flex gap-2 w-full">
            <Button data-testid="download-qr-btn" onClick={downloadQR} className="flex-1 rounded-xl" variant="outline">
              <Download size={14} className="mr-1" /> Download PNG
            </Button>
            <Button
              data-testid="print-qr-btn"
              onClick={printQR}
              className="flex-1 rounded-xl text-white"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              <Printer size={14} className="mr-1" /> Print
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminTables;
