import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import InventoryApi from './api';
import './AdminPortal.css';

export default function AdminPortal() {
    const [pendingOrders, setPendingOrders] = useState([]);
    const [processingOrders, setProcessingOrders] = useState([]);
    const [completedOrders, setCompletedOrders] = useState([]);
    const [ws, setWs] = useState(null);
    const [activeTab, setActiveTab] = useState('pending');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const inventoryClass = new InventoryApi();
    const navigate = useNavigate();

    useEffect(() => {
        // Connect to WebSocket for real-time updates
        const wsUrl = process.env.REACT_APP_WS_URL || 'ws://127.0.0.1:8000';
        const websocket = new WebSocket(`${wsUrl}/ws/admin/orders/`);

        websocket.onopen = () => {
            console.log('Admin WebSocket connected');
        };

        websocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'order_update') {
                console.log('Order update received:', data.data);
                // Refresh all orders when an update is received
                fetchAllOrders();
            }
        };

        websocket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        websocket.onclose = () => {
            console.log('Admin WebSocket disconnected');
        };

        setWs(websocket);

        return () => {
            websocket.close();
        };
    }, []);

    useEffect(() => {
        fetchAllOrders();
        // Poll for updates every 10 seconds
        const interval = setInterval(fetchAllOrders, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchAllOrders = async () => {
        try {
            const orders = await inventoryClass.getAllOrdersAdmin();
            if (orders) {
                // Categorize orders by status
                setPendingOrders(orders.filter(o => o.status === 'Pending'));
                setProcessingOrders(orders.filter(o => o.status === 'Processing'));
                setCompletedOrders(orders.filter(o => o.status === 'Processed' || o.status === 'Cancelled'));
            }
        } catch (err) {
            console.error('Error fetching orders:', err);
            setError('Failed to fetch orders');
        }
    };

    const handleAcceptOrder = async (orderId) => {
        try {
            const result = await inventoryClass.acceptOrder(orderId);
            if (result) {
                setSuccessMessage(`Order #${orderId} accepted successfully`);
                setTimeout(() => setSuccessMessage(''), 3000);
                await fetchAllOrders();
            } else {
                setError('Failed to accept order');
            }
        } catch (err) {
            console.error('Error accepting order:', err);
            setError('An error occurred while accepting the order');
        }
    };

    const handleCancelOrder = async (orderId) => {
        if (window.confirm(`Are you sure you want to cancel order #${orderId}?`)) {
            try {
                const result = await inventoryClass.cancelOrder(orderId);
                if (result) {
                    setSuccessMessage(`Order #${orderId} cancelled successfully`);
                    setTimeout(() => setSuccessMessage(''), 3000);
                    await fetchAllOrders();
                } else {
                    setError('Failed to cancel order');
                }
            } catch (err) {
                console.error('Error canceling order:', err);
                setError('An error occurred while canceling the order');
            }
        }
    };

    const handleLogout = () => {
        // Close WebSocket if open
        if (ws) {
            ws.close();
        }

        // Clear auth data
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
        localStorage.removeItem('isAdmin');

        // Redirect to login
        navigate('/login', { replace: true });
    };

    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleString();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending':
                return '#fbbf24';
            case 'Processing':
                return '#60a5fa';
            case 'Processed':
                return '#34d399';
            case 'Cancelled':
                return '#f87171';
            default:
                return '#9ca3af';
        }
    };

    const renderOrderTable = (orders, showActions = false) => {
        if (orders.length === 0) {
            return (
                <div className="empty-state">
                    <div className="empty-icon">📦</div>
                    <p>No orders in this category</p>
                </div>
            );
        }

        return (
            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>User</th>
                            <th>Item</th>
                            <th>Quantity</th>
                            <th>Status</th>
                            <th>Order Date</th>
                            {showActions && <th>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => (
                            <tr key={order.id} className="admin-table-row">
                                <td className="order-id">#{order.id}</td>
                                <td className="username">{order.username}</td>
                                <td className="item-name">{order.item_name}</td>
                                <td className="quantity">{order.item_quantity}</td>
                                <td>
                                    <span 
                                        className="status-badge"
                                        style={{ backgroundColor: getStatusColor(order.status) }}
                                    >
                                        {order.status}
                                    </span>
                                </td>
                                <td className="date">{formatDate(order.created_on)}</td>
                                {showActions && (
                                    <td className="actions">
                                        <button
                                            className="action-btn accept-btn"
                                            onClick={() => handleAcceptOrder(order.id)}
                                        >
                                            ✓ Accept
                                        </button>
                                        <button
                                            className="action-btn cancel-btn"
                                            onClick={() => handleCancelOrder(order.id)}
                                        >
                                            ✕ Cancel
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="admin-portal">
            <div className="admin-header">
    <div className="admin-header-top">
        <h1 className="admin-title">Order Management Portal</h1>
        <button className="logout-btn" onClick={handleLogout}>
            Logout
        </button>
    </div>
    <div className="admin-subtitle">Review and manage customer orders</div>
</div>


            {error && (
                <div className="alert alert-error">
                    <span className="alert-icon">⚠</span>
                    {error}
                    <button className="alert-close" onClick={() => setError('')}>×</button>
                </div>
            )}

            {successMessage && (
                <div className="alert alert-success">
                    <span className="alert-icon">✓</span>
                    {successMessage}
                    <button className="alert-close" onClick={() => setSuccessMessage('')}>×</button>
                </div>
            )}

            <div className="stats-grid">
                <div className="stat-card pending-card">
                    <div className="stat-number">{pendingOrders.length}</div>
                    <div className="stat-label">Pending Orders</div>
                </div>
                <div className="stat-card processing-card">
                    <div className="stat-number">{processingOrders.length}</div>
                    <div className="stat-label">Processing</div>
                </div>
                <div className="stat-card completed-card">
                    <div className="stat-number">{completedOrders.length}</div>
                    <div className="stat-label">Completed</div>
                </div>
            </div>

            <div className="tabs-container">
                <div className="tabs">
                    <button
                        className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
                        onClick={() => setActiveTab('pending')}
                    >
                        Pending ({pendingOrders.length})
                    </button>
                    <button
                        className={`tab ${activeTab === 'processing' ? 'active' : ''}`}
                        onClick={() => setActiveTab('processing')}
                    >
                        Processing ({processingOrders.length})
                    </button>
                    <button
                        className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
                        onClick={() => setActiveTab('completed')}
                    >
                        Completed ({completedOrders.length})
                    </button>
                </div>

                <div className="tab-content">
                    {activeTab === 'pending' && renderOrderTable(pendingOrders, true)}
                    {activeTab === 'processing' && renderOrderTable(processingOrders, false)}
                    {activeTab === 'completed' && renderOrderTable(completedOrders, false)}
                </div>
            </div>
        </div>
    );
}