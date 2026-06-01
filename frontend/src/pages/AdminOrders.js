import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import AdminLayout from '@/components/AdminLayout';
import { Clock, ChefHat, CheckCircle, User, Plus, X, Trash2, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STATUS_COLUMNS = {
  pending: { title: 'New Orders', icon: Clock, color: '#F59E0B' },
  preparing: { title: 'Preparing', icon: ChefHat, color: '#667eea' },
  ready: { title: 'Ready', icon: CheckCircle, color: '#10B981' },
  completed: { title: 'Completed', icon: CheckCircle, color: '#6B7280' }
};

const STATUS_OPTIONS = [
  { value: 'pending', label: 'New' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready', label: 'Ready' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' }
];

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailOrder, setDetailOrder] = useState(null);
  const [showManualOrder, setShowManualOrder] = useState(false);
  const wsRef = useRef(null);

  const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('admin_token')}` });

  const loadRestaurants = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/restaurants`, { headers: getHeaders() });
      setRestaurants(res.data);
      if (!selectedRestaurant && res.data.length > 0) {
        setSelectedRestaurant(res.data[0].id);
      }
    } catch (e) {
      console.error('Restaurants load error', e);
    }
  }, [selectedRestaurant]);

  const loadOrders = useCallback(async (rid) => {
    if (!rid) return;
    try {
      const res = await axios.get(`${API}/orders?restaurant_id=${rid}`, { headers: getHeaders() });
      setOrders(res.data);
      setLoading(false);
    } catch (e) {
      console.error('Orders load error', e);
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRestaurants(); }, [loadRestaurants]);

  useEffect(() => {
    if (selectedRestaurant) loadOrders(selectedRestaurant);
  }, [selectedRestaurant, loadOrders]);

  // WebSocket for realtime updates
  useEffect(() => {
    if (!selectedRestaurant) return;
    const wsUrl = `${process.env.REACT_APP_BACKEND_URL.replace(/^http/, 'ws')}/api/ws/restaurant/${selectedRestaurant}`;
    let ws;
    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          if (data.type === 'new_order') {
            setOrders(prev => [data.order, ...prev.filter(o => o.id !== data.order.id)]);
            toast.success(`New order for Table ${data.order.table_number || 'N/A'}`, { icon: <Bell size={16} /> });
          } else if (data.type === 'order_updated') {
            setOrders(prev => prev.map(o => o.id === data.order.id ? data.order : o));
          }
        } catch (e) { /* ignore */ }
      };
      ws.onerror = () => { /* fallback to polling */ };
    } catch (e) {
      console.error('WS error', e);
    }
    const poll = setInterval(() => loadOrders(selectedRestaurant), 20000);
    return () => {
      if (ws) ws.close();
      clearInterval(poll);
    };
  }, [selectedRestaurant, loadOrders]);

  const updateOrderStatus = async (orderId, newStatus, waitingTime = null) => {
    try {
      await axios.put(`${API}/orders/${orderId}/status`,
        { status: newStatus, waiting_time: waitingTime ? parseInt(waitingTime) : null },
        { headers: getHeaders() }
      );
      toast.success(`Order moved to ${newStatus}`);
      setDetailOrder(prev => prev ? { ...prev, status: newStatus } : null);
      loadOrders(selectedRestaurant);
    } catch (e) {
      toast.error('Failed to update order');
    }
  };

  const getOrdersByStatus = (status) => orders.filter(o => o.status === status);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p style={{ color: '#475569' }}>Loading orders...</p>
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
              Live Orders
            </h1>
            <p className="text-sm mt-1" style={{ color: '#64748B' }}>
              Click any order card to view details and update status
            </p>
          </div>
          <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
            {restaurants.length > 0 && (
              <Select value={selectedRestaurant || ''} onValueChange={setSelectedRestaurant}>
                <SelectTrigger data-testid="order-restaurant-selector" className="w-[200px] rounded-xl bg-white">
                  <SelectValue placeholder="Select restaurant" />
                </SelectTrigger>
                <SelectContent>
                  {restaurants.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              data-testid="create-manual-order-btn"
              onClick={() => setShowManualOrder(true)}
              className="rounded-xl text-white font-semibold"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              <Plus size={16} className="mr-1" />
              Manual Order
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(STATUS_COLUMNS).map(([status, config]) => {
            const Icon = config.icon;
            const statusOrders = getOrdersByStatus(status);

            return (
              <div key={status} className="flex flex-col" data-testid={`column-${status}`}>
                <div className="rounded-2xl p-4 mb-3" style={{ backgroundColor: config.color }}>
                  <div className="flex items-center gap-2 text-white">
                    <Icon size={20} />
                    <h3 className="font-semibold">{config.title}</h3>
                    <span className="ml-auto bg-white/20 px-2 py-1 rounded-full text-xs font-bold">
                      {statusOrders.length}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1 hide-scrollbar">
                  {statusOrders.length === 0 && (
                    <p className="text-xs text-center py-6" style={{ color: '#94A3B8' }}>No orders</p>
                  )}
                  {statusOrders.map(order => (
                    <button
                      key={order.id}
                      data-testid={`order-card-${order.id}`}
                      onClick={() => setDetailOrder(order)}
                      className="w-full text-left rounded-2xl p-4 gradient-card hover:scale-[1.02] transition-transform"
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-mono font-bold" style={{ color: '#667eea' }}>
                          #{order.id.slice(0, 6)}
                        </span>
                        <span className="text-xs" style={{ color: '#64748B' }}>
                          {new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mb-2 text-sm font-medium" style={{ color: '#1E293B' }}>
                        <User size={14} />
                        Table {order.table_number || 'N/A'}
                        {order.created_by === 'admin' && (
                          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                            Manual
                          </span>
                        )}
                      </div>

                      <p className="text-xs mb-3" style={{ color: '#64748B' }}>
                        {order.items.length} item{order.items.length > 1 ? 's' : ''} · {order.items.slice(0, 2).map(i => `${i.quantity}x ${i.name}`).join(', ')}{order.items.length > 2 ? '…' : ''}
                      </p>

                      <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: '#E2E8F0' }}>
                        <span className="font-bold" style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}>₹{order.total_amount}</span>
                        <span className="text-[10px] uppercase tracking-wide font-bold" style={{ color: config.color }}>
                          {status}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <OrderDetailModal
        order={detailOrder}
        onClose={() => setDetailOrder(null)}
        onUpdateStatus={updateOrderStatus}
      />
      {showManualOrder && (
        <ManualOrderModal
          restaurantId={selectedRestaurant}
          onClose={() => setShowManualOrder(false)}
          onCreated={() => { setShowManualOrder(false); loadOrders(selectedRestaurant); }}
        />
      )}
    </AdminLayout>
  );
};

// ============ Order Detail Modal ============
const OrderDetailModal = ({ order, onClose, onUpdateStatus }) => {
  const [waitingTime, setWaitingTime] = useState('');
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    if (order) {
      setWaitingTime(order.waiting_time || '');
      setNewStatus(order.status);
    }
  }, [order]);

  if (!order) return null;

  return (
    <Dialog open={!!order} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto" data-testid="order-detail-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Order #{order.id.slice(0, 8)}
          </DialogTitle>
          <DialogDescription>
            Table {order.table_number || 'N/A'} · {new Date(order.created_at).toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-xl p-3" style={{ backgroundColor: '#F8FAFC' }}>
            <h4 className="text-xs font-bold mb-2" style={{ color: '#64748B' }}>ITEMS</h4>
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm mb-1">
                <span style={{ color: '#1E293B' }}>{item.quantity}× {item.name}</span>
                <span className="font-medium">₹{item.price * item.quantity}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold pt-2 mt-2 border-t" style={{ borderColor: '#E2E8F0' }}>
              <span>Total</span>
              <span>₹{order.total_amount}</span>
            </div>
          </div>

          {order.customer_notes && (
            <div className="rounded-xl p-3" style={{ backgroundColor: '#FEF3C7' }}>
              <h4 className="text-xs font-bold mb-1" style={{ color: '#92400E' }}>NOTES</h4>
              <p className="text-sm" style={{ color: '#78350F' }}>{order.customer_notes}</p>
            </div>
          )}

          <div>
            <label className="text-xs font-bold block mb-1" style={{ color: '#64748B' }}>STATUS</label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger data-testid="status-select" className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {newStatus === 'pending' || newStatus === 'preparing' ? (
            <div>
              <label className="text-xs font-bold block mb-1" style={{ color: '#64748B' }}>WAITING TIME (MIN)</label>
              <Input
                data-testid="waiting-time-input"
                type="number"
                value={waitingTime}
                onChange={(e) => setWaitingTime(e.target.value)}
                placeholder="e.g. 15"
                className="rounded-xl"
              />
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button
            data-testid="update-status-btn"
            onClick={() => { onUpdateStatus(order.id, newStatus, waitingTime); onClose(); }}
            className="rounded-xl text-white font-semibold"
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            Update Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ============ Manual Order Modal ============
const ManualOrderModal = ({ restaurantId, onClose, onCreated }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [tableNumber, setTableNumber] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [cart, setCart] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('admin_token')}` });

  useEffect(() => {
    if (!restaurantId) return;
    (async () => {
      try {
        const [mi, tb] = await Promise.all([
          axios.get(`${API}/menu-items?restaurant_id=${restaurantId}`),
          axios.get(`${API}/tables?restaurant_id=${restaurantId}`, { headers: getHeaders() })
        ]);
        setMenuItems(mi.data.filter(m => m.is_available !== false));
        setTables(tb.data);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [restaurantId]);

  const addItem = (item) => {
    setCart(prev => {
      const existing = prev.find(c => c.menu_item_id === item.id);
      if (existing) {
        return prev.map(c => c.menu_item_id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { menu_item_id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev
      .map(c => c.menu_item_id === id ? { ...c, quantity: c.quantity + delta } : c)
      .filter(c => c.quantity > 0)
    );
  };

  const removeItem = (id) => setCart(prev => prev.filter(c => c.menu_item_id !== id));

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const submit = async () => {
    if (!tableNumber) { toast.error('Please select a table'); return; }
    if (cart.length === 0) { toast.error('Please add at least one item'); return; }
    setSubmitting(true);
    try {
      await axios.post(`${API}/orders/manual`, {
        restaurant_id: restaurantId,
        table_number: tableNumber,
        items: cart,
        customer_notes: customerNotes || null
      }, { headers: getHeaders() });
      toast.success('Manual order created!');
      onCreated();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="manual-order-modal">
        <DialogHeader>
          <DialogTitle>Create Manual Order</DialogTitle>
          <DialogDescription>For walk-in customers or phone orders</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold block mb-1" style={{ color: '#64748B' }}>TABLE</label>
            <Select value={tableNumber} onValueChange={setTableNumber}>
              <SelectTrigger data-testid="manual-table-select" className="rounded-xl">
                <SelectValue placeholder="Select a table" />
              </SelectTrigger>
              <SelectContent>
                {tables.length === 0 && <SelectItem value="walk-in">Walk-in</SelectItem>}
                {tables.map(t => (
                  <SelectItem key={t.id} value={t.table_number}>Table {t.table_number}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-bold block mb-1" style={{ color: '#64748B' }}>MENU</label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {menuItems.map(item => (
                <button
                  key={item.id}
                  data-testid={`add-item-${item.id}`}
                  onClick={() => addItem(item)}
                  className="text-left p-2 rounded-lg border hover:bg-purple-50 transition"
                  style={{ borderColor: '#E2E8F0' }}
                >
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs" style={{ color: '#667eea' }}>₹{item.price}</p>
                </button>
              ))}
              {menuItems.length === 0 && (
                <p className="text-xs col-span-2 text-center py-4" style={{ color: '#94A3B8' }}>
                  No menu items available
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold block mb-1" style={{ color: '#64748B' }}>CART ({cart.length})</label>
            <div className="rounded-xl p-3 max-h-40 overflow-y-auto" style={{ backgroundColor: '#F8FAFC' }}>
              {cart.length === 0 && (
                <p className="text-xs text-center py-2" style={{ color: '#94A3B8' }}>No items added</p>
              )}
              {cart.map(item => (
                <div key={item.menu_item_id} className="flex items-center justify-between py-1">
                  <span className="text-sm flex-1 truncate">{item.name}</span>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="outline" onClick={() => updateQty(item.menu_item_id, -1)} className="h-6 w-6 p-0">-</Button>
                    <span className="text-sm w-6 text-center">{item.quantity}</span>
                    <Button size="sm" variant="outline" onClick={() => updateQty(item.menu_item_id, 1)} className="h-6 w-6 p-0">+</Button>
                    <Button size="sm" variant="ghost" onClick={() => removeItem(item.menu_item_id)} className="h-6 w-6 p-0 text-red-500">
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
              ))}
              {cart.length > 0 && (
                <div className="flex justify-between font-bold pt-2 mt-2 border-t text-sm">
                  <span>Total</span>
                  <span>₹{total}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold block mb-1" style={{ color: '#64748B' }}>NOTES (OPTIONAL)</label>
            <Input
              data-testid="manual-notes-input"
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="Special requests..."
              className="rounded-xl"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            <X size={14} className="mr-1" /> Cancel
          </Button>
          <Button
            data-testid="submit-manual-order-btn"
            onClick={submit}
            disabled={submitting}
            className="rounded-xl text-white font-semibold"
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            {submitting ? 'Creating...' : 'Create Order'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminOrders;
