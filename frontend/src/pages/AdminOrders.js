import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '@/components/AdminLayout';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Clock, ChefHat, CheckCircle, XCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [waitingTimes, setWaitingTimes] = useState({});
  const [loading, setLoading] = useState(true);

  const columns = {
    pending: { title: 'New Orders', icon: Clock, color: '#F59E0B' },
    preparing: { title: 'Preparing', icon: ChefHat, color: '#667eea' },
    ready: { title: 'Ready', icon: CheckCircle, color: '#10B981' },
    completed: { title: 'Completed', icon: CheckCircle, color: '#6B7280' }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
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

      const restaurantId = selectedRestaurant || (restaurantsRes.data.length > 0 ? restaurantsRes.data[0].id : null);
      if (restaurantId) {
        const ordersRes = await axios.get(`${API}/orders?restaurant_id=${restaurantId}`, { headers });
        setOrders(ordersRes.data.filter(o => o.status !== 'rejected'));
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('admin_token');
      const headers = { Authorization: `Bearer ${token}` };

      const waitingTime = waitingTimes[orderId] || null;
      await axios.put(`${API}/orders/${orderId}/status`, 
        { status: newStatus, waiting_time: waitingTime ? parseInt(waitingTime) : null },
        { headers }
      );
      toast.success('Order status updated');
      loadData();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order status');
    }
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    
    const orderId = result.draggableId;
    const newStatus = result.destination.droppableId;
    
    updateOrderStatus(orderId, newStatus);
  };

  const getOrdersByStatus = (status) => {
    return orders.filter(order => order.status === status);
  };

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
      <div className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold gradient-text" style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Live Orders
            </h1>
            <p className="text-sm mt-1" style={{ color: '#64748B' }}>Drag & drop to change order status</p>
          </div>
          {restaurants.length > 0 && (
            <select
              data-testid="order-restaurant-selector"
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
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(columns).map(([status, config]) => {
              const Icon = config.icon;
              const statusOrders = getOrdersByStatus(status);
              
              return (
                <div key={status} className="flex flex-col">
                  <div className="rounded-2xl p-4 mb-3" style={{ backgroundColor: config.color }}>
                    <div className="flex items-center gap-2 text-white">
                      <Icon size={20} />
                      <h3 className="font-semibold">{config.title}</h3>
                      <span className="ml-auto bg-white/20 px-2 py-1 rounded-full text-xs font-bold">
                        {statusOrders.length}
                      </span>
                    </div>
                  </div>

                  <Droppable droppableId={status}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="space-y-3 min-h-[500px] rounded-2xl p-3"
                        style={{
                          backgroundColor: snapshot.isDraggingOver ? 'rgba(102, 126, 234, 0.1)' : 'transparent'
                        }}
                      >
                        {statusOrders.map((order, index) => (
                          <Draggable key={order.id} draggableId={order.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="rounded-2xl p-4 gradient-card cursor-move"
                                style={{
                                  ...provided.draggableProps.style,
                                  opacity: snapshot.isDragging ? 0.8 : 1,
                                  transform: snapshot.isDragging ? 'rotate(2deg)' : provided.draggableProps.style?.transform
                                }}
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-xs font-mono font-bold" style={{ color: '#667eea' }}>
                                    #{order.id.slice(0, 6)}
                                  </span>
                                  <span className="text-xs" style={{ color: '#64748B' }}>
                                    {new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>

                                {order.table_number && (
                                  <div className="flex items-center gap-2 mb-2 text-sm font-medium" style={{ color: '#1E293B' }}>
                                    <User size={14} />
                                    Table {order.table_number}
                                  </div>
                                )}

                                <div className="space-y-1 mb-3">
                                  {order.items.map((item, idx) => (
                                    <div key={idx} className="text-sm flex justify-between">
                                      <span style={{ color: '#475569' }}>{item.quantity}x {item.name}</span>
                                    </div>
                                  ))}
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: '#E2E8F0' }}>
                                  <span className="font-bold gradient-text" style={{ 
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                  }}>₹{order.total_amount}</span>
                                  {order.waiting_time && (
                                    <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                                      {order.waiting_time}min
                                    </span>
                                  )}
                                </div>

                                {status === 'pending' && (
                                  <div className="mt-3 space-y-2">
                                    <Input
                                      type="number"
                                      placeholder="Wait time (min)"
                                      value={waitingTimes[order.id] || ''}
                                      onChange={(e) => setWaitingTimes({ ...waitingTimes, [order.id]: e.target.value })}
                                      className="rounded-xl text-sm"
                                      style={{ borderColor: '#E2E8F0' }}
                                    />
                                    <div className="flex gap-2">
                                      <Button
                                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                                        className="flex-1 rounded-xl text-xs font-semibold"
                                        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#FFFFFF' }}
                                      >
                                        Accept
                                      </Button>
                                      <Button
                                        onClick={() => updateOrderStatus(order.id, 'rejected')}
                                        className="rounded-xl text-xs font-semibold"
                                        style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}
                                      >
                                        ✕
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;