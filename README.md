# FlowCell - Laboratory Inventory Management System

A microservices-based inventory management system for laboratory materials, featuring real-time order tracking, admin management portal, and WebSocket-powered notifications.

## Architecture

The system consists of three main components:

1. **Auth Microservice** (Port 7000) - Handles user authentication with JWT tokens
2. **Inventory Backend** (Port 8000) - Manages orders and inventory with WebSocket support
3. **React Frontend** (Port 3000) - User interface for ordering and admin management

## Prerequisites

- Python 3.11+
- Node.js 18+ with pnpm
- MySQL 8.0+

## Database Setup

### 1. Install MySQL
```bash
sudo apt-get update
sudo apt-get install -y mysql-server
sudo service mysql start
```

### 2. Create Databases
```bash
sudo mysql -e "CREATE DATABASE IF NOT EXISTS auth_db;"
sudo mysql -e "CREATE DATABASE IF NOT EXISTS order_db;"
```

### 3. Configure MySQL User
```bash
sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '95402sahil';"
sudo mysql -e "FLUSH PRIVILEGES;"
```

> **Note:** Change the password in the settings files if you use a different password.

## Backend Setup

### Auth Microservice

```bash
cd Auth_MS
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:7000
```

### Inventory Backend

```bash
cd Backend_Inventory
pip install -r requirements.txt
python manage.py makemigrations inventory
python manage.py migrate
daphne -b 0.0.0.0 -p 8000 inventory_proj.asgi:application
```

## Frontend Setup

```bash
cd Hackathon_Frontend
pnpm install
```

### Environment Configuration

Create a `.env` file in the `Hackathon_Frontend` directory:

```env
REACT_APP_AUTH_URL=http://127.0.0.1:7000/api/auth/
REACT_APP_INVENTORY_URL=http://127.0.0.1:8000/api/
REACT_APP_WS_URL=ws://127.0.0.1:8000
```

For production/external access, update these URLs accordingly.

### Start Frontend

```bash
pnpm start
```

## Creating an Admin User

### Option 1: Via API (with manual database update)
```bash
# Register user
curl -X POST http://127.0.0.1:7000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"admin@example.com","password":"YourPassword123!"}'

# Set admin privileges in database
mysql -u root -p'95402sahil' auth_db -e "UPDATE auth_user SET is_staff=1, is_superuser=1 WHERE username='admin';"
```

### Option 2: Django Admin
```bash
cd Auth_MS
python manage.py createsuperuser
```

## API Endpoints

### Auth Service (Port 7000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/` | Register new user |
| POST | `/api/auth/login/` | Login and get JWT tokens |
| GET | `/api/auth/me/` | Get current user profile |

### Inventory Service (Port 8000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products/search/` | Search products |
| POST | `/api/orders/` | Create new order |
| GET | `/api/orders/user/` | Get user's orders |
| GET | `/api/admin/orders/` | Get all orders (admin) |
| POST | `/api/admin/orders/{id}/accept/` | Accept order (admin) |
| POST | `/api/admin/orders/{id}/cancel/` | Cancel order (admin) |

### WebSocket Endpoints

- `/ws/orders/{username}/` - User order status updates
- `/ws/admin/orders/` - Admin order notifications

## Features

### User Features
- ✅ User registration and login
- ✅ Product search with autocomplete
- ✅ Create orders with multiple items
- ✅ View order history
- ✅ Real-time order status updates

### Admin Features
- ✅ View all orders dashboard
- ✅ Accept/Cancel pending orders
- ✅ Order statistics (Pending, Processing, Completed)
- ✅ Real-time order notifications

## Project Structure

```
├── Auth_MS/                    # Authentication microservice
│   ├── auth_service/           # Django project settings
│   ├── users/                  # User app (models, views, serializers)
│   └── requirements.txt
│
├── Backend_Inventory/          # Inventory management service
│   ├── inventory_proj/         # Django project settings
│   ├── inventory/              # Inventory app
│   │   ├── models.py           # Order model
│   │   ├── views.py            # API views
│   │   ├── serializers.py      # DRF serializers
│   │   ├── consumer.py         # Order processing consumer
│   │   └── websocket_consumer.py # WebSocket handlers
│   └── requirements.txt
│
└── Hackathon_Frontend/         # React frontend
    ├── src/
    │   ├── App.jsx             # Main app with routing
    │   ├── Auth.jsx            # Login/Register component
    │   ├── Inventory.jsx       # User inventory page
    │   ├── AdminPortal.jsx     # Admin management portal
    │   ├── api.js              # Inventory API client
    │   └── authApi.js          # Auth API client
    └── package.json
```

## Fixes Applied

1. **Database Configuration** - Added MySQL setup instructions
2. **CORS Configuration** - Enabled CORS for all origins in development
3. **ALLOWED_HOSTS** - Set to allow all hosts for development
4. **CORS Middleware Order** - Fixed middleware ordering (CORS first)
5. **Username Display** - Added username field to order serializer for Admin Portal
6. **Environment Variables** - Added support for configurable API URLs
7. **WebSocket URLs** - Made WebSocket URLs configurable via environment variables

## Known Limitations

1. Products are hardcoded (no Product model in database)
2. No stock tracking system
3. Admin privileges must be set manually in database

## License

MIT License
