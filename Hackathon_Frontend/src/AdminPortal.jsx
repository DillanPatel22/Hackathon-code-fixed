import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import InventoryApi from './api';
import './AdminPortal.css';

// Simple Bar Chart Component (no external dependencies)
function BarChart({ data, title }) {
    if (!data || data.length === 0) {
        return <div className="empty-chart">No data available</div>;
    }

    const maxValue = Math.max(...data.map(d => d.value));
    const colors = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

    return (
        <div className="bar-chart">
            <div className="chart-bars">
                {data.slice(0, 8).map((item, index) => (
                    <div key={index} className="bar-container">
                        <div className="bar-wrapper">
                            <div 
                                className="bar"
                                style={{ 
                                    height: `${(item.value / maxValue) * 100}%`,
                                    backgroundColor: colors[index % colors.length]
                                }}
                            >
                                <span className="bar-value">{item.value}</span>
                            </div>
                        </div>
                        <span className="bar-label" title={item.label}>
                            {item.label.length > 10 ? item.label.substring(0, 10) + '...' : item.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function AdminPortal() {
    const [pendingOrders, setPendingOrders] = useState([]);
    const [processingOrders, setProcessingOrders] = useState([]);
    const [completedOrders, setCompletedOrders] = useState([]);
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [salesData, setSalesData] = useState([]);
    const [popularProducts, setPopularProducts] = useState([]);
    const [ws, setWs] = useState(null);
    const [activeTab, setActiveTab] = useState('pending');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showLowStockPanel, setShowLowStockPanel] = useState(true);
    const [stockFilter, setStockFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [sortBy, setSortBy] = useState('name');

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
                fetchAllOrders();
                fetchLowStockProducts();
                fetchAllProducts();
            }
            if (data.type === 'low_stock_alert') {
                console.log('Low stock alert:', data.data);
                fetchLowStockProducts();
                fetchAllProducts();
                setError(`⚠️ Low Stock Alert: ${data.data.product_name} has only ${data.data.remaining_stock} left!`);
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
        fetchLowStockProducts();
        fetchAllProducts();
        // Poll for updates every 10 seconds
        const interval = setInterval(() => {
            fetchAllOrders();
            fetchLowStockProducts();
            fetchAllProducts();
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchAllOrders = async () => {
        try {
            const orders = await inventoryClass.getAllOrdersAdmin();
            if (orders) {
                setPendingOrders(orders.filter(o => o.status === 'Pending'));
                setProcessingOrders(orders.filter(o => o.status === 'Processing'));
                setCompletedOrders(orders.filter(o => o.status === 'Processed' || o.status === 'Cancelled'));
                
                // Calculate sales data from completed orders
                const completedOnly = orders.filter(o => o.status === 'Processed');
                const salesByProduct = {};
                completedOnly.forEach(order => {
                    const name = order.item_name;
                    if (!salesByProduct[name]) {
                        salesByProduct[name] = 0;
                    }
                    salesByProduct[name] += order.item_quantity;
                });
                
                const salesArray = Object.entries(salesByProduct)
                    .map(([label, value]) => ({ label, value }))
                    .sort((a, b) => b.value - a.value);
                
                setSalesData(salesArray);
                setPopularProducts(salesArray);
            }
        } catch (err) {
            console.error('Error fetching orders:', err);
            setError('Failed to fetch orders');
        }
    };

    const fetchLowStockProducts = async () => {
        try {
            const products = await inventoryClass.getLowStockProducts();
            if (products) {
                setLowStockProducts(products);
            }
        } catch (err) {
            console.error('Error fetching low stock products:', err);
        }
    };

    const fetchAllProducts = async () => {
        try {
            const products = await inventoryClass.getAllProducts();
            if (products) {
                setAllProducts(products);
            }
        } catch (err) {
            console.error('Error fetching all products:', err);
        }
    };

    const handleAcceptOrder = async (orderId) => {
        try {
            const result = await inventoryClass.acceptOrder(orderId);
            if (result) {
                setSuccessMessage(`Order #${orderId} accepted successfully`);
                setTimeout(() => setSuccessMessage(''), 3000);
                
                // Check for low stock alert in response
                if (result.low_stock_alert) {
                    const alert = result.low_stock_alert;
                    setError(`⚠️ Low Stock Alert: ${alert.product_name} has only ${alert.remaining_stock} left!`);
                }
                
                await fetchAllOrders();
                await fetchLowStockProducts();
                await fetchAllProducts();
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
        if (ws) {
            ws.close();
        }
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
        localStorage.removeItem('isAdmin');
        navigate('/login', { replace: true });
    };

    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleString();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return '#f59e0b';
            case 'Processing': return '#3b82f6';
            case 'Processed': return '#10b981';
            case 'Cancelled': return '#ef4444';
            default: return '#9ca3af';
        }
    };

    const getCategoryLabel = (category) => {
        const labels = {
            'glassware': 'Glassware',
            'chemicals': 'Chemicals',
            'equipment': 'Equipment',
            'consumables': 'Consumables',
            'safety': 'Safety'
        };
        return labels[category] || category;
    };

    const getStockStatus = (product) => {
        if (product.stock_quantity === 0) return 'out-of-stock';
        if (product.stock_quantity <= product.low_stock_threshold) return 'low-stock';
        return 'in-stock';
    };

    const getStockPercentage = (product) => {
        const maxStock = 100; // Assume max stock is 100 for visualization
        return Math.min((product.stock_quantity / maxStock) * 100, 100);
    };

    // Filter and sort products for stock inventory
    const getFilteredProducts = () => {
        let filtered = [...allProducts];

        // Apply category filter
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(p => p.category === categoryFilter);
        }

        // Apply stock filter
        if (stockFilter === 'low') {
            filtered = filtered.filter(p => p.stock_quantity <= p.low_stock_threshold && p.stock_quantity > 0);
        } else if (stockFilter === 'out') {
            filtered = filtered.filter(p => p.stock_quantity === 0);
        } else if (stockFilter === 'in') {
            filtered = filtered.filter(p => p.stock_quantity > p.low_stock_threshold);
        }

        // Apply sorting
        if (sortBy === 'name') {
            filtered.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortBy === 'stock-low') {
            filtered.sort((a, b) => a.stock_quantity - b.stock_quantity);
        } else if (sortBy === 'stock-high') {
            filtered.sort((a, b) => b.stock_quantity - a.stock_quantity);
        } else if (sortBy === 'category') {
            filtered.sort((a, b) => a.category.localeCompare(b.category));
        }

        return filtered;
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

    const renderLowStockPanel = () => {
        if (lowStockProducts.length === 0) {
            return null;
        }

        return (
            <div className="low-stock-panel">
                <div className="low-stock-header" onClick={() => setShowLowStockPanel(!showLowStockPanel)}>
                    <h3>
                        <span className="warning-icon">⚠️</span>
                        Low Stock Alerts ({lowStockProducts.length})
                    </h3>
                    <span className="toggle-icon">{showLowStockPanel ? '▼' : '▶'}</span>
                </div>
                {showLowStockPanel && (
                    <div className="low-stock-content">
                        <table className="low-stock-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Category</th>
                                    <th>Current Stock</th>
                                    <th>Threshold</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lowStockProducts.map((product) => (
                                    <tr key={product.id} className={product.is_out_of_stock ? 'out-of-stock' : ''}>
                                        <td className="product-name">{product.name}</td>
                                        <td className="category">{getCategoryLabel(product.category)}</td>
                                        <td className="stock-quantity">
                                            <span className={product.is_out_of_stock ? 'critical' : 'warning'}>
                                                {product.stock_quantity}
                                            </span>
                                        </td>
                                        <td className="threshold">{product.low_stock_threshold}</td>
                                        <td>
                                            <span className={`stock-status ${product.is_out_of_stock ? 'out-of-stock-badge' : 'low-stock-badge'}`}>
                                                {product.is_out_of_stock ? 'Out of Stock' : 'Low Stock'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="admin-portal">
            {/* Animated Bubbles Background */}
            <div className="bubbles">
                <div className="bubble"></div>
                <div className="bubble"></div>
                <div className="bubble"></div>
                <div className="bubble"></div>
                <div className="bubble"></div>
                <div className="bubble"></div>
                <div className="bubble"></div>
            </div>

            {/* Test Tubes Decoration */}
            <div className="test-tubes">
                <div className="test-tube"></div>
                <div className="test-tube"></div>
                <div className="test-tube"></div>
            </div>

            <div className="admin-header">
                <div className="admin-header-top">
                    <div>
                        <h1 className="admin-title">Lab Management Portal</h1>
                        <div className="admin-subtitle">Monitor inventory and manage orders</div>
                    </div>
                    <button className="logout-btn" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </div>

            <div className="admin-content">
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

                {/* Stats Grid */}
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
                    <div className={`stat-card ${lowStockProducts.length > 0 ? 'alert-card' : 'completed-card'}`}>
                        <div className="stat-number">{lowStockProducts.length}</div>
                        <div className="stat-label">Low Stock Items</div>
                    </div>
                    <div className="stat-card processing-card">
                        <div className="stat-number">{allProducts.length}</div>
                        <div className="stat-label">Total Products</div>
                    </div>
                </div>

                {/* Low Stock Alerts Panel */}
                {renderLowStockPanel()}

                {/* Charts Section */}
                <div className="charts-section">
                    {/* Sales by Product Chart */}
                    <div className="chart-card">
                        <h3>📊 Sales by Product</h3>
                        <div className="chart-container">
                            <BarChart data={salesData} title="Sales by Product" />
                        </div>
                    </div>

                    {/* Popular Products */}
                    <div className="chart-card">
                        <h3>🏆 Most Popular Products</h3>
                        <div className="popular-list">
                            {popularProducts.length === 0 ? (
                                <p className="empty-text">No sales data yet</p>
                            ) : (
                                <table className="stock-table">
                                    <thead>
                                        <tr>
                                            <th>Rank</th>
                                            <th>Product</th>
                                            <th>Units Sold</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {popularProducts.slice(0, 5).map((product, index) => (
                                            <tr key={index}>
                                                <td>
                                                    <span className={`rank-badge rank-${index + 1}`}>
                                                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                                                    </span>
                                                </td>
                                                <td>{product.label}</td>
                                                <td className="quantity">{product.value}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stock Inventory Table */}
                <div className="stock-inventory-card">
                    <h3>📦 Stock Inventory</h3>
                    <div className="filter-controls">
                        <select 
                            className="filter-select"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                            <option value="all">All Categories</option>
                            <option value="glassware">Glassware</option>
                            <option value="chemicals">Chemicals</option>
                            <option value="equipment">Equipment</option>
                            <option value="consumables">Consumables</option>
                            <option value="safety">Safety</option>
                        </select>
                        <select 
                            className="filter-select"
                            value={stockFilter}
                            onChange={(e) => setStockFilter(e.target.value)}
                        >
                            <option value="all">All Stock Levels</option>
                            <option value="in">In Stock</option>
                            <option value="low">Low Stock</option>
                            <option value="out">Out of Stock</option>
                        </select>
                        <select 
                            className="filter-select"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="name">Sort by Name</option>
                            <option value="stock-low">Stock: Low to High</option>
                            <option value="stock-high">Stock: High to Low</option>
                            <option value="category">Sort by Category</option>
                        </select>
                    </div>
                    <div className="admin-table-container">
                        <table className="stock-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Category</th>
                                    <th>Price</th>
                                    <th>Stock Level</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {getFilteredProducts().map((product) => (
                                    <tr key={product.id}>
                                        <td className="item-name">{product.name}</td>
                                        <td>{getCategoryLabel(product.category)}</td>
                                        <td>${parseFloat(product.price).toFixed(2)}</td>
                                        <td>
                                            <div className="stock-level">
                                                <span>{product.stock_quantity}</span>
                                                <div className="stock-bar">
                                                    <div 
                                                        className={`stock-bar-fill ${getStockStatus(product) === 'in-stock' ? 'high' : getStockStatus(product) === 'low-stock' ? 'medium' : 'low'}`}
                                                        style={{ width: `${getStockPercentage(product)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`stock-badge ${getStockStatus(product)}`}>
                                                {getStockStatus(product) === 'in-stock' ? 'In Stock' : 
                                                 getStockStatus(product) === 'low-stock' ? 'Low Stock' : 'Out of Stock'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Orders Tabs */}
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
        </div>
    );
}
