import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Home from './pages/Home';
import QuotationList from './pages/QuotationList';
import CustomerDetails from './pages/CustomerDetails';
import QuotationBuilder from './pages/QuotationBuilder';
import QuotationView from './pages/QuotationView';
import AdminPanel from './pages/AdminPanel';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Private Routes */}
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/quotations" 
          element={
            <PrivateRoute>
              <QuotationList />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/customer-details" 
          element={
            <PrivateRoute>
              <CustomerDetails />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/customer/:customerId/create-quotation" 
          element={
            <PrivateRoute>
              <ErrorBoundary>
                <QuotationBuilder />
              </ErrorBoundary>
            </PrivateRoute>
          } 
        />
        <Route 
          path="/quotation/:quoteId" 
          element={
            <PrivateRoute>
              <QuotationView />
            </PrivateRoute>
          } 
        />
        
        {/* Admin/Super Admin Only Route */}
        <Route 
          path="/admin" 
          element={
            <PrivateRoute requiredRoles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']}>
              <AdminPanel />
            </PrivateRoute>
          } 
        />

        {/* Fallback redirect */}
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="container py-5 text-danger" style={{ background: '#fff', padding: '20px', borderRadius: '8px', margin: '20px auto', maxWidth: '800px', border: '1px solid #dc3545' }}>
          <h4>Something went wrong rendering this page:</h4>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{this.state.error?.stack || this.state.error?.message || String(this.state.error)}</pre>
          <button className="btn btn-outline-danger mt-3" onClick={() => window.location.reload()}>Reload Page</button>
        </div>
      );
    }
    return this.props.children;
  }
}
