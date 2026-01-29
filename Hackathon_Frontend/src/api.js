import axios from "axios";

export default class InventoryApi {
    constructor() {
        // Use environment variable or fallback to localhost for development
        this.BASE = process.env.REACT_APP_INVENTORY_URL || "http://127.0.0.1:8000/api/";
        this.username = sessionStorage.getItem("user");
        this.accessToken = sessionStorage.getItem("accessToken");
    }

    async createOrder(data) {
        const response = await axios.post(
            this.BASE + "orders/",
            JSON.stringify(data), {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.accessToken}`,
                    "X-Username": this.username
                }
            }
        );

        if(response.status === 201 || response.status === 200){
            console.log(response.data);
            return true;
        }else{
            console.log("Error");
            return false;
        }
    }

    async getAllOrders() {
        try {
            const response = await axios.get(
                this.BASE + "orders/user/", {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        "X-Username": this.username
                    }
                }
            );

            if(response.status === 200){
                console.log(response.data.orders);
                return response.data.orders;
            }
            return null;
        } catch (error) {
            console.error("Error fetching orders:", error.response?.data || error.message);
            return null;
        }
    }

    // Admin Methods
    async getAllOrdersAdmin() {
        try {
            const response = await axios.get(
                this.BASE + "admin/orders/", {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        "X-Username": this.username
                    }
                }
            );

            if(response.status === 200){
                console.log(response.data.orders);
                return response.data.orders;
            }
            return null;
        } catch (error) {
            console.error("Error fetching admin orders:", error.response?.data || error.message);
            return null;
        }
    }

    async acceptOrder(orderId) {
        try {
            const response = await axios.post(
                this.BASE + `admin/orders/${orderId}/accept/`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        "X-Username": this.username
                    }
                }
            );

            if(response.status === 200){
                console.log("Order accepted:", response.data);
                // Return the full response data to check for low stock alerts
                return response.data;
            }
            return false;
        } catch (error) {
            console.error("Error accepting order:", error.response?.data || error.message);
            return false;
        }
    }

    async cancelOrder(orderId) {
        try {
            const response = await axios.post(
                this.BASE + `admin/orders/${orderId}/cancel/`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        "X-Username": this.username
                    }
                }
            );

            if(response.status === 200){
                console.log("Order cancelled:", response.data);
                return true;
            }
            return false;
        } catch (error) {
            console.error("Error cancelling order:", error.response?.data || error.message);
            return false;
        }
    }

    async searchItems(searchQuery) {
        try {
            const response = await axios.get(
                this.BASE + "products/search/", {
                    params: {
                        search: searchQuery
                    },
                    
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        "X-Username": this.username,
                    }
                }
            );

            if(response.status === 200){
                console.log(response.data.message);
                return response.data.message;  // Returns array of products with price and stock
            }
            return [];
        } catch (error) {
            console.error("Error searching products:", error.response?.data || error.message);
            return [];
        }
    }

    // New Product Methods
    async getAllProducts() {
        try {
            const response = await axios.get(
                this.BASE + "products/", {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        "X-Username": this.username
                    }
                }
            );

            if(response.status === 200){
                return response.data.products;
            }
            return [];
        } catch (error) {
            console.error("Error fetching products:", error.response?.data || error.message);
            return [];
        }
    }

    async getLowStockProducts() {
        try {
            const response = await axios.get(
                this.BASE + "products/low-stock/", {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        "X-Username": this.username
                    }
                }
            );

            if(response.status === 200){
                return response.data.low_stock_products;
            }
            return [];
        } catch (error) {
            console.error("Error fetching low stock products:", error.response?.data || error.message);
            return [];
        }
    }

    async updateProductStock(productId, newQuantity) {
        try {
            const response = await axios.post(
                this.BASE + `products/${productId}/stock/`,
                { stock_quantity: newQuantity },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.accessToken}`,
                        "X-Username": this.username
                    }
                }
            );

            if(response.status === 200){
                console.log("Stock updated:", response.data);
                return true;
            }
            return false;
        } catch (error) {
            console.error("Error updating stock:", error.response?.data || error.message);
            return false;
        }
    }
}
