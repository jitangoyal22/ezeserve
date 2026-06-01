import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdminLayout from '@/components/AdminLayout';
import { UserPlus, Trash2, ShieldCheck, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteUser, setDeleteUser] = useState(null);

  const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('admin_token')}` });

  const loadAll = useCallback(async () => {
    try {
      const [uRes, rRes] = await Promise.all([
        axios.get(`${API}/admin/users`, { headers: getHeaders() }),
        axios.get(`${API}/restaurants`, { headers: getHeaders() })
      ]);
      setUsers(uRes.data);
      setRestaurants(rRes.data);
      setLoading(false);
    } catch (e) {
      setLoading(false);
      toast.error('Failed to load users');
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleDelete = async () => {
    if (!deleteUser) return;
    try {
      await axios.delete(`${API}/admin/users/${deleteUser.id}`, { headers: getHeaders() });
      toast.success('User deleted');
      setDeleteUser(null);
      loadAll();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to delete');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p style={{ color: '#475569' }}>Loading users...</p>
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
              Admin Users
            </h1>
            <p className="text-sm mt-1" style={{ color: '#64748B' }}>Manage admins and restaurant access</p>
          </div>
          <Button
            data-testid="create-user-btn"
            onClick={() => setShowCreate(true)}
            className="rounded-xl text-white font-semibold"
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            <UserPlus size={16} className="mr-1" /> Add User
          </Button>
        </div>

        <div className="gradient-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: '#F8FAFC' }}>
                <tr>
                  <th className="text-left p-3 font-semibold" style={{ color: '#475569' }}>Name</th>
                  <th className="text-left p-3 font-semibold" style={{ color: '#475569' }}>Email</th>
                  <th className="text-left p-3 font-semibold" style={{ color: '#475569' }}>Role</th>
                  <th className="text-left p-3 font-semibold" style={{ color: '#475569' }}>Restaurant</th>
                  <th className="text-right p-3 font-semibold" style={{ color: '#475569' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-t" style={{ borderColor: '#E2E8F0' }} data-testid={`user-row-${u.id}`}>
                    <td className="p-3 font-medium">{u.name}</td>
                    <td className="p-3" style={{ color: '#475569' }}>{u.email}</td>
                    <td className="p-3">
                      <span className="text-xs px-2 py-1 rounded-full font-semibold inline-flex items-center gap-1" style={{
                        backgroundColor: u.role === 'super_admin' ? '#EDE9FE' : '#DBEAFE',
                        color: u.role === 'super_admin' ? '#5B21B6' : '#1E40AF'
                      }}>
                        {u.role === 'super_admin' ? <ShieldCheck size={12} /> : <Store size={12} />}
                        {u.role === 'super_admin' ? 'Super Admin' : 'Restaurant Admin'}
                      </span>
                    </td>
                    <td className="p-3" style={{ color: '#64748B' }}>{u.restaurant_name || '—'}</td>
                    <td className="p-3 text-right">
                      {u.role !== 'super_admin' && (
                        <Button
                          data-testid={`delete-user-${u.id}`}
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteUser(u)}
                          className="text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showCreate && (
        <CreateUserModal
          restaurants={restaurants}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); loadAll(); }}
        />
      )}

      <AlertDialog open={!!deleteUser} onOpenChange={(v) => !v && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove access for {deleteUser?.email}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-delete-user">Cancel</AlertDialogCancel>
            <AlertDialogAction data-testid="confirm-delete-user" onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

const CreateUserModal = ({ restaurants, onClose, onCreated }) => {
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'restaurant_admin', restaurant_id: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!form.name || !form.email || !form.password) {
      toast.error('Please fill all required fields'); return;
    }
    if (form.role === 'restaurant_admin' && !form.restaurant_id) {
      toast.error('Restaurant is required for restaurant admin'); return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API}/admin/users`, {
        ...form,
        restaurant_id: form.role === 'super_admin' ? null : form.restaurant_id
      }, { headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` } });
      toast.success('User created');
      onCreated();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md" data-testid="create-user-modal">
        <DialogHeader>
          <DialogTitle>Add Admin User</DialogTitle>
          <DialogDescription>Create a new admin account with role-based access</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold block mb-1" style={{ color: '#64748B' }}>NAME</label>
            <Input data-testid="user-name-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="rounded-xl" />
          </div>
          <div>
            <label className="text-xs font-bold block mb-1" style={{ color: '#64748B' }}>EMAIL</label>
            <Input data-testid="user-email-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="rounded-xl" />
          </div>
          <div>
            <label className="text-xs font-bold block mb-1" style={{ color: '#64748B' }}>PASSWORD</label>
            <Input data-testid="user-password-input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="rounded-xl" />
          </div>
          <div>
            <label className="text-xs font-bold block mb-1" style={{ color: '#64748B' }}>ROLE</label>
            <Select value={form.role} onValueChange={v => setForm({ ...form, role: v, restaurant_id: v === 'super_admin' ? '' : form.restaurant_id })}>
              <SelectTrigger data-testid="user-role-select" className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="restaurant_admin">Restaurant Admin</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.role === 'restaurant_admin' && (
            <div>
              <label className="text-xs font-bold block mb-1" style={{ color: '#64748B' }}>RESTAURANT</label>
              <Select value={form.restaurant_id} onValueChange={v => setForm({ ...form, restaurant_id: v })}>
                <SelectTrigger data-testid="user-restaurant-select" className="rounded-xl">
                  <SelectValue placeholder="Select restaurant" />
                </SelectTrigger>
                <SelectContent>
                  {restaurants.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button
            data-testid="submit-user-btn"
            onClick={submit}
            disabled={submitting}
            className="rounded-xl text-white font-semibold"
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            {submitting ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminUsers;
