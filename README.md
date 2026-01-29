# FlowCell - Laboratory Inventory Management System

A microservices-based laboratory inventory management system with real-time order tracking and low-stock alerts.

## Features

### Core Features
- **User Authentication**: JWT-based authentication with role-based access (Admin/User)
- **Product Search**: Search 50+ lab materials with real-time autocomplete
- **Order Management**: Create, track, and manage orders with status updates
- **Admin Portal**: Comprehensive dashboard for order management

### New Features (Hackathon Addition)
- **Product Database**: 50 lab materials across 5 categories (Glassware, Chemicals, Equipment, Consumables, Safety)
- **Stock Tracking**: Real-time inventory levels with automatic stock decrement on order acceptance
- **Low-Stock Alerts**: Visual alerts in Admin Portal when products fall below threshold
- **Real-Time Updates**: WebSocket-powered notifications for order and stock changes

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React Frontend │────│   Auth Service   │────│  MySQL (auth_db) │
│   (Port 3000)    │    │   (Port 7000)    │    │                  │
└────────┬─────────┘    └─────────────────┘    └─────────────────┘
         │
         │              ┌─────────────────┐     ┌─────────────────┐
         └──────────────│ Inventory Service│────│ MySQL (order_db) │
                        │   (Port 8000)    │    │                  │
                        └─────────────────┘    └─────────────────┘
```

## Quick Start (Windows)

### Prerequisites
- Python 3.11+
- Node.js 18+
- MySQL 8.0

### Step 1: Clone Repository
```cmd
git clone https://github.com/DillanPatel22/Hackathon-code-fixed.git
cd Hackathon-code-fixed
```

### Step 2: Setup MySQL
Open MySQL Command Line Client and run:
```sql
CREATE DATABASE auth_db;
CREATE DATABASE order_db;
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '95402sahil';
FLUSH PRIVILEGES;
EXIT;
```

### Step 3: Setup Auth Service (Terminal 1)
```cmd
cd Auth_MS
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:7000
```

### Step 4: Setup Inventory Service (Terminal 2)
```cmd
cd Backend_Inventory
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py populate_products
daphne -b 0.0.0.0 -p 8000 inventory_proj.asgi:application
```

### Step 5: Setup Frontend (Terminal 3)
```cmd
cd Hackathon_Frontend
```

Create `.env` file with:
```
REACT_APP_AUTH_URL=http://127.0.0.1:7000/api/auth/
REACT_APP_INVENTORY_URL=http://127.0.0.1:8000/api/
REACT_APP_WS_URL=ws://127.0.0.1:8000
```

Then run:
```cmd
pnpm install
pnpm start
```

### Step 6: Create Admin User
1. Register a user through the app at http://localhost:3000
2. Open MySQL and make them admin:
```sql
USE auth_db;
UPDATE auth_user SET is_staff=1, is_superuser=1 WHERE username='YourUsername';
```

## API Endpoints

### Auth Service (Port 7000)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/` | Register new user |
| POST | `/api/auth/login/` | Login and get JWT token |

### Inventory Service (Port 8000)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products/` | List all products |
| GET | `/api/products/search/?search=query` | Search products |
| GET | `/api/products/low-stock/` | Get low-stock products |
| POST | `/api/orders/` | Create new order |
| GET | `/api/orders/user/` | Get user's orders |
| GET | `/api/admin/orders/` | Get all orders (admin) |
| POST | `/api/admin/orders/{id}/accept/` | Accept order (admin) |
| POST | `/api/admin/orders/{id}/cancel/` | Cancel order (admin) |

### WebSocket Endpoints
| Endpoint | Description |
|----------|-------------|
| `/ws/orders/{username}/` | User order status updates |
| `/ws/admin/orders/` | Admin order and low-stock notifications |

## Product Categories

| Category | Example Items |
|----------|---------------|
| Glassware | Beakers, Flasks, Test Tubes, Pipettes, Graduated Cylinders |
| Chemicals | Ethanol, Sodium Chloride, Hydrochloric Acid, Sodium Hydroxide |
| Equipment | Microscopes, Centrifuges, Bunsen Burners, Hot Plates, Scales |
| Consumables | Petri Dishes, Filter Paper, Syringes, Gloves, Pipette Tips |
| Safety | Safety Goggles, Lab Coats, Face Shields, First Aid Kits |

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
│   │   ├── models.py           # Product and Order models
│   │   ├── views.py            # API views with stock tracking
│   │   ├── serializers.py      # DRF serializers
│   │   ├── consumer.py         # Order processing consumer
│   │   ├── websocket_consumer.py # WebSocket handlers
│   │   └── management/commands/populate_products.py  # Product seeder
│   └── requirements.txt
│
└── Hackathon_Frontend/         # React frontend
    ├── src/
    │   ├── App.jsx             # Main app with routing
    │   ├── Auth.jsx            # Login/Register component
    │   ├── Inventory.jsx       # User inventory page with product search
    │   ├── AdminPortal.jsx     # Admin portal with low-stock alerts
    │   ├── api.js              # Inventory API client
    │   └── authApi.js          # Auth API client
    └── package.json
```

## Troubleshooting

### MySQL Connection Issues
- Verify MySQL is running (check Services on Windows)
- Check password in `settings.py` matches your MySQL root password

### "mysqlclient" Installation Fails on Windows
Install Visual C++ Build Tools from: https://visualstudio.microsoft.com/visual-cpp-build-tools/

### Port Already in Use
```cmd
netstat -ano | findstr :7000
taskkill /PID <PID> /F
```

## Fixes Applied in This Version

1. ✅ Database Configuration - MySQL setup with proper authentication
2. ✅ CORS Configuration - Enabled for all origins in development
3. ✅ ALLOWED_HOSTS - Set to allow all hosts
4. ✅ Username Display - Fixed in Admin Portal order table
5. ✅ Product Database - 50 lab materials with stock tracking
6. ✅ Low-Stock Alerts - Real-time alerts in Admin Portal
7. ✅ Stock Decrement - Automatic stock reduction on order acceptance

## License

MIT License
