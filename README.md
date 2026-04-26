# 🚢 British Auction RFQ System (Logistics/Freight)

A robust, real-time full-stack web application designed for the logistics industry to host and manage **Reverse British Auctions** (Request for Quote). This platform allows buyers to create RFQs for freight forwarding, while suppliers place competitive real-time bids. 

Designed with fairness and data integrity in mind, the system employs automated anti-sniping extensions and idempotent job queues to manage auction lifecycles.

## ✨ Core Features

- **Role-Based Workflows**: Segregated experiences for `Buyers` (create and manage RFQs) and `Suppliers` (place competitive bids).
- **Reverse British Auction Mechanics**: Focuses on driving prices down. Suppliers compete based on total freight, origin, and destination charges.
- **Dynamic Anti-Sniping (Bid Extensions)**: Integrates an `extensionService` that automatically extends the auction time if a new bid causes a rank change near the closing time, ensuring fair competition.
- **Real-Time Data Sync**: Instant updates for bids, rankings, and auction statuses across all connected clients utilizing `Socket.io` and Redis mechanisms.
- **Idempotent Queue Management**: Relies on `BullMQ` and `Redis` to accurately and reliably handle forced auction closures exactly when the timer hits zero.
- **Audit Trails**: Built-in `ActivityLog` to track every bid submission, rank shift, and auction state change for transparency.
- **Modern Light Theme UI**: A clean, accessible, and responsive interface built with React, Tailwind CSS, and custom UI components (e.g., `CountdownTimer`, `ActivityFeed`, `BidTable`).

## 🛠️ Technology Stack

### Frontend (`rfq-client`)
- **Core**: React 18, Vite
- **Styling**: Tailwind CSS (Custom Light Theme, Inter Typography)
- **Routing**: React Router DOM (v6)
- **Real-Time**: `socket.io-client`
- **State/Hooks**: Context API, Custom Hooks (`useAuth`)
- **Icons**: Lucide React

### Backend (`rfq-server`)
- **Core**: Node.js, Express.js
- **Database**: MongoDB (Mongoose) for persistent storage (Users, RFQs, Bids, Activity Logs)
- **Caching & Queues**: Redis & BullMQ (for high-performance job processing and state tracking)
- **Real-Time**: Socket.io
- **Security**: JWT-based Authentication, bcryptjs

## 📁 Project Architecture

```text
.
├── rfq-client/                 # Frontend React application
│   ├── src/                    
│   │   ├── components/         # Reusable UI (ActivityFeed, BidTable, etc.)
│   │   ├── context/            # Auth and Socket contexts
│   │   ├── hooks/              # Custom React hooks
│   │   ├── pages/              # CreateRfq, SubmitBid, AuctionDetail, etc.
│   │   └── styles.css          # Global Tailwind configurations & utility classes
│
└── rfq-server/                 # Backend Node.js application
    ├── src/                    
    │   ├── controllers/        # Route logic (auction, auth, bid)
    │   ├── jobs/               # BullMQ workers (e.g., auctionClose.job.js)
    │   ├── models/             # Mongoose schemas (Rfq, Bid, User, ActivityLog)
    │   ├── services/           # Core logic (auctionEngine, rankingService)
    │   └── utils/              # Redis keys and helpers
    └── server.js               # Application entry point
```

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v16+)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas)
- [Redis](https://redis.io/) (Running locally on default port 6379, or a remote Redis URL)

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd "British Auction RFQ System"
```

### 2. Backend Setup (`rfq-server`)

```bash
cd rfq-server
npm install
```

Create a `.env` file in the `rfq-server` directory. Use the following as a template:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
REDIS_URL=redis://127.0.0.1:6379
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

Start the backend development server:
```bash
npm run dev
```

### 3. Frontend Setup (`rfq-client`)

Open a new terminal window:
```bash
cd rfq-client
npm install
```

Create a `.env` file in the `rfq-client` directory if you are running the backend on a different port:
```env
VITE_API_URL=http://localhost:5000
```

Start the frontend development server:
```bash
npm run dev
```

## 🔐 System Rules & Constraints

1. **Authentication**: Users must log in. Routes are strictly protected based on roles (`ProtectedRoute`).
2. **Bidding**: Only `supplier` roles can place bids. Buyers create the RFQs.
3. **Closing Logic**: The `forcedCloseAt` constraint is enforced at the database schema level. The auction closing job is idempotent to prevent duplicate execution in case of server restarts or job retries.

