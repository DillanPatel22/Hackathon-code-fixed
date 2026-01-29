import React from 'react'
import { useState, useEffect, useRef } from 'react';
import InventoryApi from  './api';
import './Inventory.css';

export default function Inventory() {
    const inventoryClass = new InventoryApi();

    const [rows, setRows] = useState([
        { item_id: Math.floor(Math.random() * 100), item_name: '', item_quantity: 1, product_id: null}
    ]);

    const [submit, setSubmit] = useState(false);
    const [orderHistory, setOrderHistory] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [ws, setWs] = useState(null);

    useEffect(() => {
        // Connect to WebSocket
        const username = sessionStorage.getItem("user");
        const wsUrl = process.env.REACT_APP_WS_URL || 'ws://127.0.0.1:8000';
        const websocket = new WebSocket(`${wsUrl}/ws/orders/${username}/`);

        websocket.onopen = () => {
            console.log('WebSocket connected');
        };

        websocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'order_status') {
                console.log('Order status update:', data.data);
                
                // Update order status in the UI
                setOrderHistory(prev => 
                    prev.map(order => 
                        order.id === data.data.order_id 
                            ? { ...order, status: data.data.status }
                            : order
                    )
                );

                // Show success message for status updates
                setSuccess(`Order #${data.data.order_id} status updated to: ${data.data.status}`);
                setTimeout(() => setSuccess(''), 5000);
            }
        };

        websocket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        websocket.onclose = () => {
            console.log('WebSocket disconnected');
        };

        setWs(websocket);

        // Cleanup on unmount
        return () => {
            websocket.close();
        };
    }, []);

    // Fetch order history on component mount
    useEffect(() => {
        fetchOrderHistory();
    }, []);

    const fetchOrderHistory = async () => {
        try {
            const orders = await inventoryClass.getAllOrders();
            if(orders) {
                setOrderHistory(orders);
                if(orders.length > 0) {
                    setSubmit(true);
                }
            }
        } catch (err) {
            console.error('Error fetching order history:', err);
        }
    };

    // Check if all rows have items selected
    const areAllRowsValid = () => {
        return rows.every(row => row.item_name !== '');
    };

    const addRow = () => {
        // Only add a new row if all existing rows have items selected
        if (!areAllRowsValid()) {
            setError('Please select an item for all rows before adding a new one');
            setTimeout(() => setError(''), 3000);
            return;
        }

        setRows(prev => [
            ...prev,
            { item_id: Math.floor(Math.random() * 100), item_name: '', item_quantity: 1, product_id: null}
        ]);
    };

    const removeRow = (id) => {
        setRows(prev => prev.filter(row => row.item_id !== id));
    };

    const updateRow = (id, field, value) => {
        setRows(prev =>
            prev.map(row =>
                row.item_id === id ? { ...row, [field]: value } : row
            )
        );
    };

    const mergeAndConsolidateRows = (rowsToMerge) => {
        const mergedItems = {};

        rowsToMerge.forEach(row => {
            if (row.item_name !== '') {
                const key = row.product_id || row.item_name;
                if (mergedItems[key]) {
                    // Item already exists, add quantities
                    mergedItems[key].item_quantity += row.item_quantity;
                } else {
                    // New item, create entry
                    mergedItems[key] = {
                        item_id: row.item_id,
                        item_name: row.item_name,
                        item_quantity: row.item_quantity,
                        product_id: row.product_id
                    };
                }
            }
        });

        return Object.values(mergedItems);
    };

    const submitOrder = async () => {
        // Clear any previous errors
        setError('');
        setSuccess('');

        // Filter out rows that don't have an item selected
        const validRows = rows.filter(row => row.item_name !== '');

        if (validRows.length === 0) {
            setError('Please select at least one item before submitting');
            setTimeout(() => setError(''), 3000);
            return;
        }

        // Merge duplicate items and consolidate quantities
        const consolidatedRows = mergeAndConsolidateRows(validRows);

        try {
            // Send only consolidated rows to backend
            const result = await inventoryClass.createOrder(consolidatedRows);

            if(result){
                setSubmit(true);
                setSuccess('Order submitted successfully!');
                setTimeout(() => setSuccess(''), 5000);
                
                // Fetch updated order history from database
                await fetchOrderHistory();
                
                setRows([
                    { item_id: Math.floor(Math.random() * 100), item_name: '', item_quantity: 1, product_id: null, user: sessionStorage.getItem("user")}
                ]);
            } else {
                setError('Failed to create order. Please try again.');
                setTimeout(() => setError(''), 5000);
            }
        } catch (err) {
            setError('An error occurred while submitting the order. Please try again.');
            setTimeout(() => setError(''), 5000);
            console.error('Order submission error:', err);
        }
    };

    const handleLogout = () => {
        // Close WebSocket connection
        if (ws) {
            ws.close();
        }
        
        // Clear session storage
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('isAuthenticated');
        
        // Redirect to login page or home
        window.location.href = '/login'; // Adjust this to your login route
    };

    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleString();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending':
                return 'status-pending';
            case 'Processing':
                return 'status-processing';
            case 'Processed':
                return 'status-completed';
            case 'Cancelled':
                return 'status-cancelled';
            default:
                return 'status-default';
        }
    };

    return (
        <div className="inventory-portal">
            <div className="inventory-header">
                <div className="inventory-header-top">
                    <div>
                        <h1 className="inventory-title">Inventory Management</h1>
                        <p className="inventory-subtitle">Welcome, {sessionStorage.getItem("user") || 'User'}</p>
                    </div>
                    <button className="logout-btn" onClick={handleLogout}>
                        🚪 Logout
                    </button>
                </div>
            </div>

            <div className="inventory-content">
                {/* Alert Messages */}
                {error && (
                    <div className="alert alert-error">
                        <span className="alert-icon">⚠️</span>
                        <span>{error}</span>
                        <button className="alert-close" onClick={() => setError('')}>×</button>
                    </div>
                )}

                {success && (
                    <div className="alert alert-success">
                        <span className="alert-icon">✓</span>
                        <span>{success}</span>
                        <button className="alert-close" onClick={() => setSuccess('')}>×</button>
                    </div>
                )}

                {/* Order Form Card */}
                <div className="order-form-card">
                    <h2 className="card-title">Create New Order</h2>
                    
                    <div className="order-table-container">
                        <table className="order-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Quantity</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row) => (
                                    <tr key={row.item_id}>
                                        <td>
                                            <InlineProductSearch
                                                rowId={row.item_id}
                                                value={row.item_name}
                                                onProductSelect={(product) => {
                                                    updateRow(row.item_id, 'item_name', product.name);
                                                    updateRow(row.item_id, 'product_id', product.id);
                                                }}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                className="input-item-quantity"
                                                min="1"
                                                value={row.item_quantity}
                                                onChange={(e) =>
                                                    updateRow(row.item_id, 'item_quantity', Number(e.target.value))
                                                }
                                            />
                                        </td>
                                        <td>
                                            <button
                                                className="remove-button"
                                                onClick={() => removeRow(row.item_id)}
                                                disabled={rows.length === 1}
                                            >
                                                🗑️ Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="order-actions">
                        <button className="button-add-item" onClick={addRow}>
                            ➕ Add Item
                        </button>
                        <button className="button-submit-order" onClick={submitOrder}>
                            📦 Submit Order
                        </button>
                    </div>
                </div>

                {/* Order History */}
                {submit && orderHistory.length > 0 && (
                    <div className="order-history-card">
                        <h2 className="card-title">Order History</h2>
                        
                        <div className="history-table-container">
                            <table className="history-table">
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Item</th>
                                        <th>Quantity</th>
                                        <th>Status</th>
                                        <th>Order Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orderHistory.map((order) => (
                                        <tr key={order.id}>
                                            <td className="order-id">#{order.id}</td>
                                            <td className="item-name">{order.item_name}</td>
                                            <td className="quantity">{order.item_quantity}</td>
                                            <td>
                                                <span className={`status-badge ${getStatusColor(order.status)}`}>
                                                    {order.status || 'Pending'}
                                                </span>
                                            </td>
                                            <td className="date">{formatDate(order.created_on)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!submit || orderHistory.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📋</div>
                        <p>No orders yet. Create your first order above!</p>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

// Inline Product Search Component (embedded in the same file)
function InlineProductSearch({ rowId, value, onProductSelect }) {
    const [searchTerm, setSearchTerm] = useState(value || '');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);
    const inventoryClass = new InventoryApi();

    // Update searchTerm when value prop changes
    useEffect(() => {
        setSearchTerm(value || '');
    }, [value]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = async (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        setIsSearching(true);

        try {
            const result = await inventoryClass.searchItems(value);
            setSearchResults(result);
            setShowDropdown(true);
            setSelectedIndex(-1);
        }catch(error) {
            console.error("Error searching the product: ", error);
            setSearchResults([]);
        }finally{
            setIsSearching(false);
        }
    };

    const handleProductClick = (product) => {
        setSearchTerm(product.name);
        setShowDropdown(false);
        onProductSelect(product);
    };

    const handleKeyDown = (e) => {
        if (!showDropdown || searchResults.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => 
                    prev < searchResults.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && searchResults[selectedIndex]) {
                    handleProductClick(searchResults[selectedIndex]);
                }
                break;
            case 'Escape':
                setShowDropdown(false);
                setSelectedIndex(-1);
                break;
            default:
                break;
        }
    };

    const highlightMatch = (text, query) => {
        if (!query) return text;
        
        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return parts.map((part, index) => 
            part.toLowerCase() === query.toLowerCase() 
                ? <span key={index} className="search-highlight">{part}</span>
                : part
        );
    };

    return (
        <div className="inline-product-search" ref={dropdownRef}>
            <div className="search-input-wrapper">
                <input
                    ref={inputRef}
                    type="text"
                    className="search-input"
                    value={searchTerm}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Search for a product..."
                    autoComplete="off"
                />
                {isSearching && (
                    <div className="search-spinner">
                        <div className="spinner"></div>
                    </div>
                )}
                {searchTerm && !isSearching && (
                    <button
                        className="search-clear"
                        onClick={() => {
                            setSearchTerm('');
                            setSearchResults([]);
                            setShowDropdown(false);
                            onProductSelect({ id: null, name: '' });
                        }}
                    >
                        ×
                    </button>
                )}
            </div>

            {showDropdown && searchResults.length > 0 && (
                <div className="search-dropdown">
                    <div className="search-results-header">
                        {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'} found
                    </div>
                    <ul className="search-results">
                        {searchResults.map((product, index) => (
                            <li
                                key={product.id}
                                className={`search-result-item ${index === selectedIndex ? 'selected' : ''}`}
                                onClick={() => handleProductClick(product)}
                                onMouseEnter={() => setSelectedIndex(index)}
                            >
                                <div className="product-info">
                                    <div className="product-name">
                                        {highlightMatch(product.name, searchTerm)}
                                    </div>
                                    {product.description && (
                                        <div className="product-description">
                                            {product.description}
                                        </div>
                                    )}
                                    {product.category && (
                                        <div className="product-meta">
                                            <span className="product-category">{product.category}</span>
                                            {product.stock !== undefined && (
                                                <span className={`product-stock ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                                                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {product.price && (
                                    <div className="product-price">
                                        ${product.price}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {showDropdown && !isSearching && searchTerm.length >= 2 && searchResults.length === 0 && (
                <div className="search-dropdown">
                    <div className="search-no-results">
                        <div className="no-results-icon">🔍</div>
                        <div className="no-results-text">No products found</div>
                        <div className="no-results-hint">Try a different search term</div>
                    </div>
                </div>
            )}
        </div>
    );
}