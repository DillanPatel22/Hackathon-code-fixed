import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './Auth';
import Inventory from './Inventory';
import AdminPortal from './AdminPortal';

function ProtectedRoute({ children }) {
    const accessToken = sessionStorage.getItem('accessToken');
    return accessToken ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
    const accessToken = sessionStorage.getItem('accessToken');
    const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
    
    if (!accessToken) return <Navigate to="/login" replace />;
    if (!isAdmin) return <Navigate to="/inventory" replace />;
    
    return children;
}

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Auth />} />
                
                <Route path="/inventory" element={
                    <ProtectedRoute>
                        <Inventory />
                    </ProtectedRoute>
                } />
                
                <Route path="/admin" element={
                    <AdminRoute>
                        <AdminPortal />
                    </AdminRoute>
                } />
                
                <Route path="/" element={<Navigate to="/login" />} />
            </Routes>
        </Router>
    );
}

export default App;