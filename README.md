# Vertex Link Authentication Service (authn)

A standalone authentication and user management microservice for Vertex Link projects, built with Deno and powered by Deno KV for zero-dependency data persistence.

## Overview

This service provides:
- **User Authentication** - Session-based login/logout with secure password hashing
- **User Management** - Profile management, role-based access control
- **Author/Creator Profiles** - Extended profiles for content creators
- **RESTful API** - Easy integration with any client (studio-prototype, visualizer, etc.)
- **File-based Database** - Deno KV for simple deployment (no MongoDB required)

## Features

### Authentication
- ✅ User registration with validation
- ✅ Session-based authentication
- ✅ Secure password hashing (bcrypt)
- ✅ Failed login attempt tracking
- ✅ Session management and expiration

### User Management
- ✅ User CRUD operations
- ✅ Username/email availability checking
- ✅ Role-based access control (RBAC)
- ✅ User profile preferences
- ✅ Account activation/deactivation

### Author System
- ✅ Author profile creation
- ✅ Author verification badges
- ✅ Social links and portfolio
- ✅ Project count tracking
- ✅ Custom metadata support

### Security
- ✅ CORS protection
- ✅ HTTP-only cookies
- ✅ Password strength validation
- ✅ Input sanitization
- ✅ Session security

## Tech Stack

- **Runtime:** Deno 1.x
- **Framework:** Oak (HTTP server)
- **Database:** Deno KV (file-based key-value store)
- **Authentication:** Session-based with Oak Sessions
- **Password Hashing:** bcrypt
- **Language:** TypeScript

## Quick Start

### Prerequisites

- [Deno](https://deno.land/) 1.40 or higher

### Installation

1. Clone the repository:
```bash
git clone https://github.com/vertex-link/authn.git
cd authn
```

2. Copy the environment file:
```bash
cp .env.example .env
```

3. Edit `.env` with your configuration:
```bash
PORT=8080
CORS_ORIGIN=http://localhost:3000
SESSION_SECRET=your-secret-key-here
```

4. Run the development server:
```bash
deno task dev
```

The server will start at `http://localhost:8080`

### Production

```bash
deno task start
```

## API Documentation

### Authentication Endpoints

#### POST /api/v1/auth/register
Register a new user.

**Request:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "authorized": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "username": "johndoe"
  }
}
```

#### POST /api/v1/auth/login
Login with email and password.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "authorized": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "username": "johndoe"
  }
}
```

#### POST /api/v1/auth/logout
Logout current user.

**Response:**
```json
{
  "success": true,
  "authorized": false,
  "message": "Logged out successfully"
}
```

#### GET /api/v1/auth/state
Get current authentication state.

**Response:**
```json
{
  "authorized": true,
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john@example.com",
  "roles": ["user"]
}
```

### User Endpoints

#### GET /api/v1/users/me
Get current user profile.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "johndoe",
    "email": "john@example.com",
    "emailVerified": false,
    "isActive": true,
    "roles": ["user"],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### GET /api/v1/users/:id
Get user by ID.

#### GET /api/v1/users/username/:username/available
Check if username is available.

**Response:**
```json
{
  "success": true,
  "available": true
}
```

#### PATCH /api/v1/users/:id
Update user profile.

#### DELETE /api/v1/users/:id
Delete user account.

#### GET /api/v1/users
List all users (admin only).

### Author Endpoints

#### POST /api/v1/authors
Create author profile.

**Request:**
```json
{
  "displayName": "John Doe",
  "bio": "Game developer and 3D artist",
  "website": "https://johndoe.com",
  "socialLinks": {
    "twitter": "johndoe",
    "github": "johndoe"
  }
}
```

#### GET /api/v1/authors/me
Get current user's author profile.

#### GET /api/v1/authors/:id
Get author by ID.

#### GET /api/v1/authors/user/:userId
Get author by user ID.

#### PATCH /api/v1/authors/:id
Update author profile.

#### DELETE /api/v1/authors/:id
Delete author profile.

#### GET /api/v1/authors
List all authors.

### Health Check

#### GET /health
Service health check.

**Response:**
```json
{
  "status": "healthy",
  "service": "authn",
  "version": "1.0.0",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Integration

### From TypeScript/Deno

```typescript
// Login
const response = await fetch('http://localhost:8080/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'SecurePass123'
  })
});

const data = await response.json();
```

### From Studio Prototype

The authentication flow can replace the existing MongoDB-based auth:

```typescript
// Instead of direct MongoDB access, call the authn service
const authState = await fetch('http://localhost:8080/api/v1/auth/state', {
  credentials: 'include'
});
```

### From Visualizer

Use the RESTful API to check user/author information:

```typescript
const author = await fetch('http://localhost:8080/api/v1/authors/user/USER_ID');
```

## Database

The service uses **Deno KV**, a file-based key-value database built into Deno:

- **Local Development:** Creates `authn.db` file
- **Production:** Can scale to FoundationDB via Deno Deploy
- **Zero Setup:** No database server needed
- **ACID Transactions:** Atomic operations guaranteed

### Data Structure

```
users/
  {userId} → User object
users_by_email/
  {email} → userId
users_by_username/
  {username} → userId
authors/
  {authorId} → Author object
authors_by_user/
  {userId} → authorId
sessions/
  {sessionId} → Session object
sessions_by_user/
  {userId}/{sessionId} → Session object
```

## Configuration

All configuration is done via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 8080 | Server port |
| `ENVIRONMENT` | development | Environment mode |
| `CORS_ORIGIN` | http://localhost:3000 | Allowed CORS origin |
| `SESSION_SECRET` | (required) | Session encryption secret |
| `SESSION_MAX_AGE` | 86400000 | Session duration (ms) |
| `KV_PATH` | ./authn.db | Database file path |
| `BCRYPT_ROUNDS` | 12 | Password hash rounds |

## Development

### Run Tests
```bash
deno task test
```

### Code Formatting
```bash
deno fmt
```

### Linting
```bash
deno lint
```

## Architecture

```
src/
├── controllers/     # Request handlers
├── db/              # Deno KV repositories
├── middleware/      # Express-style middleware
├── routes/          # API route definitions
├── services/        # Business logic
├── types/           # TypeScript type definitions
├── utils/           # Helper functions
└── main.ts          # Application entry point
```

## Migration from studio-prototype

This service was designed to replace the MongoDB-based authentication in studio-prototype:

1. **Database:** MongoDB → Deno KV (file-based)
2. **Same API:** Compatible session-based auth
3. **Same Flow:** Login/logout/registration work the same way
4. **Drop-in Replacement:** Update endpoint URLs only

## Contributing

This is a Vertex Link project. Contributions welcome!

## License

MIT License - see LICENSE file

## Acknowledgments

Built with:
- [Deno](https://deno.land/) - Modern JavaScript/TypeScript runtime
- [Oak](https://deno.land/x/oak) - Middleware framework
- [Deno KV](https://deno.com/kv) - Built-in key-value database

Ported from the working authentication system in [vertex-link/studio-prototype](https://github.com/vertex-link/studio-prototype).
