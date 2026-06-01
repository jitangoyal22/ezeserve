import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdminLayout from '@/components/AdminLayout';
import { CheckCircle, Clock, IndianRupee, Plus, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminBilling = () => {
  const [bills, setBills] = useState([]);
  const [orders, setOrders] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('admin_token')}` });

  const loadAll = useCallback(async () => {
    try {
      const resR = await axios.get(`${API}/restaurants`, { headers: getHeaders() });
      setRestaurants(resR.data);
      const rid = selectedRestaurant || resR.data[0]?.id;
      if (rid && !selectedRestaurant) setSelectedRestaurant(rid);
      if (!rid) { setLoading(false); return; }

      const [bRes, oRes] = await Promise.all([
        axios.get(`${API}/bills?restaurant_id=${rid}`, { headers: getHeaders() }),
        axios.get(`${API}/orders?restaurant_id=${rid}&status=completed`, { headers: getHeaders() })
      ]);
      setBills(bRes.data);
      const billedOrderIds = new Set(bRes.data.map(b => b.order_id));
      setOrders(oRes.data.filter(o => !billedOrderIds.has(o.id)));
      setLoading(false);
    } catch (e) {
      setLoading(false);
    }
  }, [selectedRestaurant]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const payBill = async (billId, method) => {
    try {
      await axios.put(`${API}/bills/${billId}/pay`, { payment_method: method }, { headers: getHeaders() });
      toast.success('Bill marked as paid');
      setSelectedBill(null);
      loadAll();
    } catch (e) {
      toast.error('Failed to mark as paid');
    }
  };

  const filteredBills = bills.filter(b => filter === 'all' ? true : b.payment_status === filter);
  const totalRevenue = bills.filter(b => b.payment_status === 'paid').reduce((s, b) => s + b.total, 0);
  const unpaidAmount = bills.filter(b => b.payment_status === 'unpaid').reduce((s, b) => s + b.total, 0);
  const restaurant = restaurants.find(r => r.id === selectedRestaurant);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p style={{ color: '#475569' }}>Loading bills...</p>
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
              Billing
            </h1>
            <p className="text-sm mt-1" style={{ color: '#64748B' }}>Generate invoices, manage GST, print receipts</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {restaurants.length > 0 && (
              <Select value={selectedRestaurant || ''} onValueChange={setSelectedRestaurant}>
                <SelectTrigger data-testid="billing-restaurant-selector" className="w-[200px] rounded-xl bg-white">
                  <SelectValue placeholder="Restaurant" />
                </SelectTrigger>
                <SelectContent>
                  {restaurants.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Button
              data-testid="create-bill-btn"
              onClick={() => setShowCreate(true)}
              className="rounded-xl text-white font-semibold"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              <Plus size={16} className="mr-1" /> Generate Bill
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard icon={IndianRupee} label="Total Revenue" value={`₹${totalRevenue.toFixed(2)}`} color="#10B981" testId="stat-revenue" />
          <StatCard icon={CheckCircle} label="Paid Bills" value={bills.filter(b => b.payment_status === 'paid').length} color="#667eea" testId="stat-paid" />
          <StatCard icon={Clock} label={`Unpaid ₹${unpaidAmount.toFixed(2)}`} value={bills.filter(b => b.payment_status === 'unpaid').length} color="#F59E0B" testId="stat-unpaid" />
        </div>

        <div className="flex gap-2 mb-4">
          {['all', 'unpaid', 'paid'].map(f => (
            <button
              key={f}
              data-testid={`filter-${f}`}
              onClick={() => setFilter(f)}
              className="px-4 py-2 rounded-xl text-sm font-medium capitalize transition"
              style={{
                backgroundColor: filter === f ? '#667eea' : '#FFFFFF',
                color: filter === f ? '#FFFFFF' : '#64748B',
                border: '1px solid #E2E8F0'
              }}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="gradient-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: '#F8FAFC' }}>
                <tr>
                  <th className="text-left p-3 font-semibold" style={{ color: '#475569' }}>Bill #</th>
                  <th className="text-left p-3 font-semibold" style={{ color: '#475569' }}>Table</th>
                  <th className="text-left p-3 font-semibold" style={{ color: '#475569' }}>Total</th>
                  <th className="text-left p-3 font-semibold" style={{ color: '#475569' }}>Status</th>
                  <th className="text-left p-3 font-semibold" style={{ color: '#475569' }}>Date</th>
                  <th className="text-right p-3 font-semibold" style={{ color: '#475569' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.length === 0 && (
                  <tr><td colSpan={6} className="text-center p-8" style={{ color: '#94A3B8' }}>No bills found</td></tr>
                )}
                {filteredBills.map(b => (
                  <tr key={b.id} className="border-t" style={{ borderColor: '#E2E8F0' }}>
                    <td className="p-3 font-mono" style={{ color: '#667eea' }}>#{b.bill_number}</td>
                    <td className="p-3">{b.table_number || 'N/A'}</td>
                    <td className="p-3 font-bold">₹{b.total}</td>
                    <td className="p-3">
                      <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{
                        backgroundColor: b.payment_status === 'paid' ? '#D1FAE5' : '#FEF3C7',
                        color: b.payment_status === 'paid' ? '#065F46' : '#92400E'
                      }}>
                        {b.payment_status}
                      </span>
                    </td>
                    <td className="p-3 text-xs" style={{ color: '#64748B' }}>
                      {new Date(b.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        data-testid={`view-bill-${b.id}`}
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedBill(b)}
                        className="rounded-lg"
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <BillDetailModal
        bill={selectedBill}
        restaurant={restaurants.find(r => r.id === selectedBill?.restaurant_id) || restaurant}
        onClose={() => setSelectedBill(null)}
        onPay={payBill}
      />
      {showCreate && (
        <CreateBillModal
          orders={orders}
          restaurant={restaurant}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); loadAll(); }}
        />
      )}
    </AdminLayout>
  );
};

const StatCard = ({ icon: Icon, label, value, color, testId }) => (
  <div className="gradient-card rounded-2xl p-4" data-testid={testId}>
    <div className="flex items-center justify-between mb-2">
      <p className="text-xs font-medium" style={{ color: '#64748B' }}>{label}</p>
      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
        <Icon size={16} style={{ color }} />
      </div>
    </div>
    <p className="text-2xl font-bold" style={{ color: '#1E293B' }}>{value}</p>
  </div>
);

// ============ Print helper ============
const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

const printThermalReceipt = (bill, restaurant) => {
  const w = window.open('', '_blank', 'width=400,height=700');
  if (!w) { toast.error('Popup blocked - allow popups to print'); return; }
  const date = new Date(bill.created_at).toLocaleString('en-IN');
  const itemRows = bill.items.map(i => `
    <tr>
      <td>${escapeHtml(i.name)} x${i.quantity}</td>
      <td class="r">₹${(i.price * i.quantity).toFixed(2)}</td>
    </tr>
  `).join('');
  const taxEnabled = bill.tax_enabled !== false && bill.tax_percent > 0;
  w.document.write(`
    <html>
      <head>
        <title>Bill #${bill.bill_number}</title>
        <style>
          @page { size: 80mm auto; margin: 4mm; }
          * { box-sizing: border-box; }
          body { font-family: 'Courier New', monospace; width: 72mm; margin: 0; padding: 4px; color: #000; font-size: 12px; }
          h1 { text-align: center; font-size: 16px; margin: 4px 0; }
          .sub { text-align: center; font-size: 10px; margin: 2px 0; }
          .divider { border-top: 1px dashed #000; margin: 6px 0; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          td { padding: 2px 0; vertical-align: top; }
          .r { text-align: right; white-space: nowrap; }
          .total-row td { font-weight: bold; font-size: 13px; padding-top: 4px; }
          .info { font-size: 10px; line-height: 1.5; }
          .footer { text-align: center; font-size: 10px; margin-top: 6px; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(restaurant?.name || 'Restaurant')}</h1>
        <div class="sub">${escapeHtml(restaurant?.location || '')}</div>
        ${restaurant?.contact ? `<div class="sub">Ph: ${escapeHtml(restaurant.contact)}</div>` : ''}
        ${bill.gst_number || restaurant?.gst_number ? `<div class="sub">GSTIN: ${escapeHtml(bill.gst_number || restaurant?.gst_number)}</div>` : ''}
        <div class="divider"></div>
        <div class="info">
          Bill #: <b>${bill.bill_number}</b><br/>
          Table: <b>${escapeHtml(bill.table_number || 'N/A')}</b><br/>
          Date: ${escapeHtml(date)}
        </div>
        <div class="divider"></div>
        <table>${itemRows}</table>
        <div class="divider"></div>
        <table>
          <tr><td>Subtotal</td><td class="r">₹${bill.subtotal.toFixed(2)}</td></tr>
          ${taxEnabled ? `<tr><td>GST (${bill.tax_percent}%)</td><td class="r">₹${bill.tax_amount.toFixed(2)}</td></tr>` : ''}
          ${bill.discount_amount > 0 ? `<tr><td>Discount</td><td class="r">-₹${bill.discount_amount.toFixed(2)}</td></tr>` : ''}
          <tr class="total-row"><td>TOTAL</td><td class="r">₹${bill.total.toFixed(2)}</td></tr>
        </table>
        <div class="divider"></div>
        ${bill.payment_status === 'paid'
          ? `<div class="footer">PAID via ${escapeHtml(bill.payment_method || '')}</div>`
          : `<div class="footer">** UNPAID **</div>`}
        <div class="footer">Thank you! Visit again.</div>
        <script>
          window.onload = function() { setTimeout(function() { window.print(); }, 200); };
        </script>
      </body>
    </html>
  `);
  w.document.close();
};

// ============ Bill Detail Modal ============
const BillDetailModal = ({ bill, restaurant, onClose, onPay }) => {
  const [method, setMethod] = useState('cash');
  if (!bill) return null;

  const taxEnabled = bill.tax_enabled !== false && bill.tax_percent > 0;

  return (
    <Dialog open={!!bill} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md" data-testid="bill-detail-modal">
        <DialogHeader>
          <DialogTitle>Bill #{bill.bill_number}</DialogTitle>
          <DialogDescription>Table {bill.table_number || 'N/A'}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          {bill.items.map((item, i) => (
            <div key={i} className="flex justify-between">
              <span>{item.quantity}× {item.name}</span>
              <span>₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t pt-2 mt-2 space-y-1">
            <div className="flex justify-between"><span style={{ color: '#64748B' }}>Subtotal</span><span>₹{bill.subtotal.toFixed(2)}</span></div>
            {taxEnabled ? (
              <div className="flex justify-between"><span style={{ color: '#64748B' }}>GST ({bill.tax_percent}%)</span><span>₹{bill.tax_amount.toFixed(2)}</span></div>
            ) : (
              <div className="flex justify-between"><span style={{ color: '#94A3B8' }}>GST</span><span style={{ color: '#94A3B8' }}>Not applied</span></div>
            )}
            {bill.discount_amount > 0 && (
              <div className="flex justify-between"><span style={{ color: '#64748B' }}>Discount</span><span>-₹{bill.discount_amount.toFixed(2)}</span></div>
            )}
            <div className="flex justify-between font-bold text-base pt-1"><span>Total</span><span>₹{bill.total.toFixed(2)}</span></div>
          </div>
          {(bill.gst_number || restaurant?.gst_number) && (
            <p className="text-xs font-mono pt-1" style={{ color: '#94A3B8' }}>
              GSTIN: {bill.gst_number || restaurant?.gst_number}
            </p>
          )}
          {bill.payment_status === 'paid' ? (
            <p className="text-center py-2 text-green-600 font-semibold">Paid via {bill.payment_method}</p>
          ) : (
            <div className="pt-2">
              <label className="text-xs font-bold block mb-1" style={{ color: '#64748B' }}>PAYMENT METHOD</label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger data-testid="payment-method-select" className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            data-testid="print-bill-btn"
            onClick={() => printThermalReceipt(bill, restaurant)}
            variant="outline"
            className="rounded-xl"
          >
            <Printer size={14} className="mr-1" /> Print
          </Button>
          <Button variant="outline" onClick={onClose} className="rounded-xl">Close</Button>
          {bill.payment_status === 'unpaid' && (
            <Button
              data-testid="mark-paid-btn"
              onClick={() => onPay(bill.id, method)}
              className="rounded-xl text-white font-semibold"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              Mark Paid
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ============ Create Bill Modal (with GST flex) ============
const CreateBillModal = ({ orders, restaurant, onClose, onCreated }) => {
  const defaultTax = restaurant?.tax_percent ?? 5;
  const defaultEnabled = restaurant?.tax_enabled !== false;
  const [orderId, setOrderId] = useState('');
  const [discount, setDiscount] = useState('0');
  const [taxEnabled, setTaxEnabled] = useState(defaultEnabled);
  const [taxPercent, setTaxPercent] = useState(String(defaultTax));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setTaxEnabled(restaurant?.tax_enabled !== false);
    setTaxPercent(String(restaurant?.tax_percent ?? 5));
  }, [restaurant]);

  const selectedOrder = orders.find(o => o.id === orderId);
  const subtotal = selectedOrder?.total_amount || 0;
  const computedTax = taxEnabled ? Math.round(subtotal * (parseFloat(taxPercent) || 0)) / 100 : 0;
  const taxAmt = taxEnabled ? +(subtotal * (parseFloat(taxPercent) || 0) / 100).toFixed(2) : 0;
  const computedTotal = +(subtotal + taxAmt - (parseFloat(discount) || 0)).toFixed(2);

  const submit = async () => {
    if (!orderId) { toast.error('Select an order'); return; }
    setSubmitting(true);
    try {
      await axios.post(`${API}/bills`, {
        order_id: orderId,
        discount_amount: parseFloat(discount) || 0,
        tax_enabled: taxEnabled,
        tax_percent_override: taxEnabled ? (parseFloat(taxPercent) || 0) : 0
      }, { headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` } });
      toast.success('Bill generated');
      onCreated();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to create bill');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md" data-testid="create-bill-modal">
        <DialogHeader>
          <DialogTitle>Generate Bill</DialogTitle>
          <DialogDescription>GST applies on top of subtotal; toggle off to skip GST for this bill</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold block mb-1" style={{ color: '#64748B' }}>ORDER</label>
            <Select value={orderId} onValueChange={setOrderId}>
              <SelectTrigger data-testid="bill-order-select" className="rounded-xl">
                <SelectValue placeholder={orders.length === 0 ? 'No eligible orders' : 'Select order'} />
              </SelectTrigger>
              <SelectContent>
                {orders.map(o => (
                  <SelectItem key={o.id} value={o.id}>
                    Table {o.table_number || 'N/A'} · ₹{o.total_amount} · #{o.id.slice(0, 6)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-xl p-3" style={{ backgroundColor: '#F8FAFC' }}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold" style={{ color: '#64748B' }}>APPLY GST</label>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: taxEnabled ? '#10B981' : '#64748B' }}>
                  {taxEnabled ? 'ON' : 'OFF'}
                </span>
                <Switch
                  data-testid="bill-tax-switch"
                  checked={taxEnabled}
                  onCheckedChange={setTaxEnabled}
                />
              </div>
            </div>
            {taxEnabled && (
              <div>
                <label className="block text-[10px] font-bold mb-1" style={{ color: '#64748B' }}>GST %</label>
                <Input
                  data-testid="bill-tax-percent-input"
                  type="number"
                  step="0.1"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-bold block mb-1" style={{ color: '#64748B' }}>DISCOUNT (₹)</label>
            <Input
              data-testid="discount-input"
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="rounded-xl"
            />
          </div>

          {selectedOrder && (
            <div className="rounded-xl p-3 text-sm" style={{ backgroundColor: '#EDE9FE' }}>
              <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>GST</span><span>{taxEnabled ? `₹${taxAmt.toFixed(2)}` : '—'}</span></div>
              {parseFloat(discount) > 0 && <div className="flex justify-between"><span>Discount</span><span>-₹{parseFloat(discount).toFixed(2)}</span></div>}
              <div className="flex justify-between font-bold pt-1 border-t mt-1" style={{ borderColor: '#C4B5FD' }}>
                <span>Total</span><span data-testid="bill-preview-total">₹{computedTotal.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button
            data-testid="submit-bill-btn"
            onClick={submit}
            disabled={submitting || !orderId}
            className="rounded-xl text-white font-semibold"
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            {submitting ? 'Generating...' : 'Generate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminBilling;
