# LifeOS Backend

Industry-ready Node.js backend with Express, Mongoose, and MongoDB Atlas.

## Features

- ✅ Express.js REST API
- ✅ MongoDB Atlas integration with Mongoose
- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ Input validation with express-validator
- ✅ Error handling middleware
- ✅ Rate limiting
- ✅ Security headers with Helmet
- ✅ CORS configuration
- ✅ Winston logging
- ✅ Environment variable management
- ✅ Modular architecture

## Project Structure

```
src/
├─ config/
│  ├─ db.js              # MongoDB connection
│  ├─ env.js              # Environment variables
│  └─ constants.js        # Application constants
│
├─ modules/
│  ├─ auth/               # Authentication module
│  │  ├─ auth.controller.js
│  │  ├─ auth.service.js
│  │  ├─ auth.routes.js
│  │  └─ auth.schema.js
│  │
│  ├─ dashboard/          # Dashboard module
│  │  ├─ dashboard.controller.js
│  │  ├─ dashboard.service.js
│  │  └─ dashboard.routes.js
│  │
│  ├─ tasks/              # Tasks module (to be implemented)
│  ├─ expenses/           # Expenses module (to be implemented)
│  ├─ subscriptions/      # Subscriptions module (to be implemented)
│  ├─ journal/            # Journal module (to be implemented)
│  └─ goals/              # Goals module (to be implemented)
│
├─ middlewares/
│  ├─ auth.middleware.js      # JWT authentication
│  ├─ error.middleware.js      # Error handling
│  └─ rateLimit.middleware.js # Rate limiting
│
├─ utils/
│  ├─ date.util.js        # Date utilities
│  ├─ response.util.js    # Response helpers
│  └─ logger.util.js      # Winston logger
│
├─ app.js                 # Express app configuration
└─ server.js              # Server entry point
```

## Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your configuration:
   - MongoDB Atlas connection string
   - JWT secret key
   - Other environment variables

## Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile (requires authentication)

### Dashboard
- `GET /api/dashboard` - Get dashboard data (requires authentication)

### Health Check
- `GET /health` - Server health check

## Environment Variables

See `.env.example` for all required environment variables.

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Rate limiting on API endpoints
- Helmet.js for security headers
- Input validation
- CORS configuration

## Logging

Logs are written to:
- Console (development)
- `logs/combined.log` (all logs)
- `logs/error.log` (errors only)
- `logs/exceptions.log` (uncaught exceptions)
- `logs/rejections.log` (unhandled rejections)

## Next Steps

1. Implement remaining modules (tasks, expenses, subscriptions, journal, goals)
2. Add unit and integration tests
3. Add API documentation (Swagger/OpenAPI)
4. Set up CI/CD pipeline
5. Add database migrations
6. Implement caching (Redis)

## License

ISC
