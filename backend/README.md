
# POS Backend API

A complete backend API for a Point of Sale system built with Fastify, Prisma, and TypeScript.

## Features

- 🔐 JWT Authentication with bcrypt password hashing
- 👥 Role-based access control (Admin/Cashier)
- 📦 Complete CRUD operations for Users and Products
- ⏰ Shift management and tracking
- 🛒 Order processing and management
- 📊 Sales reporting with PDF generation
- 🖼️ Image upload for products and user profiles
- 🗃️ SQLite database with Prisma ORM
- 📱 Ready for Electron desktop app integration

## Quick Start

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set up the database:**
   ```bash
   npm run db:generate
   npm run db:push
   ```

3. **Seed the database with sample data:**
   ```bash
   npx tsx src/scripts/seed.ts
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3001`

## Default Users

After seeding, you can log in with:
- **Admin:** username: `admin`, password: `password`
- **Cashier 1:** username: `cashier1`, password: `password`
- **Cashier 2:** username: `cashier2`, password: `password`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/users` - Get all users (Admin only)
- `POST /api/auth/users` - Create user (Admin only)
- `PUT /api/auth/users/:id` - Update user (Admin only)
- `DELETE /api/auth/users/:id` - Delete user (Admin only)

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (Admin only)
- `PUT /api/products/:id` - Update product (Admin only)
- `DELETE /api/products/:id` - Delete product (Admin only)

### Shifts
- `POST /api/shifts/start` - Start a new shift
- `PUT /api/shifts/:id/end` - End a shift
- `GET /api/shifts/active` - Get active shift for current user
- `GET /api/shifts/history` - Get shift history

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get orders (filtered by user role)
- `GET /api/orders/:id` - Get order by ID
- `GET /api/orders/:id/receipt` - Generate PDF receipt

### Reports
- `GET /api/reports/sales` - Get sales report data
- `GET /api/reports/sales/pdf` - Generate PDF sales report

## File Structure

```
backend/
├── src/
│   ├── config/         # Database and environment config
│   ├── controllers/    # Route handlers
│   ├── middleware/     # Authentication middleware
│   ├── routes/         # API route definitions
│   ├── services/       # Business logic
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   ├── scripts/        # Database seeding
│   └── index.ts        # Application entry point
├── prisma/
│   └── schema.prisma   # Database schema
├── data/               # SQLite database file
├── profile_images/     # User profile images
├── product_images/     # Product images
└── package.json
```

## Environment Variables

Create a `.env` file with:

```env
DATABASE_URL="file:./data/app.sqlite"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
PORT=3001
NODE_ENV=development
```

## Database Management

- **Generate Prisma client:** `npm run db:generate`
- **Push schema changes:** `npm run db:push`
- **Open Prisma Studio:** `npm run db:studio`

## Image Upload

- Profile images are stored in `/profile_images/`
- Product images are stored in `/product_images/`
- Both directories are created automatically on first run
- Images are accessible via static file serving

## Production Build

```bash
npm run build
npm start
```

## Integration with Frontend

The backend is designed to work seamlessly with the existing frontend. Update your frontend's API calls to point to `http://localhost:3001/api/`.
