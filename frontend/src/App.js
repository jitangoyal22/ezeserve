import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import LandingPage from '@/pages/LandingPage';
import CustomerMenu from '@/pages/CustomerMenu';
import Cart from '@/pages/Cart';
import OrderStatus from '@/pages/OrderStatus';
import AdminLogin from '@/pages/AdminLogin';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminOrders from '@/pages/AdminOrders';
import AdminMenu from '@/pages/AdminMenu';
import AdminRestaurants from '@/pages/AdminRestaurants';
import ProtectedRoute from '@/components/ProtectedRoute';
import '@/App.css';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/menu/:restaurantId" element={<CustomerMenu />} />
          <Route path="/cart/:restaurantId" element={<Cart />} />
          <Route path="/order-status/:orderId" element={<OrderStatus />} />
          
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute><AdminOrders /></ProtectedRoute>} />
          <Route path="/admin/menu" element={<ProtectedRoute><AdminMenu /></ProtectedRoute>} />
          <Route path="/admin/restaurants" element={<ProtectedRoute><AdminRestaurants /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" richColors />
    </div>
  );
}

export default App;