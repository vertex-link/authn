# API Examples

Example requests for testing the authn service using `curl`.

## Authentication

### Register a new user

```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "SecurePass123"
  }'
```

### Login

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123"
  }'
```

Note: `-c cookies.txt` saves the session cookie for subsequent requests.

### Check auth state

```bash
curl -X GET http://localhost:8080/api/v1/auth/state \
  -b cookies.txt
```

### Logout

```bash
curl -X POST http://localhost:8080/api/v1/auth/logout \
  -b cookies.txt
```

## User Management

### Get current user

```bash
curl -X GET http://localhost:8080/api/v1/users/me \
  -b cookies.txt
```

### Check username availability

```bash
curl -X GET http://localhost:8080/api/v1/users/username/testuser/available
```

### Update user profile

```bash
curl -X PATCH http://localhost:8080/api/v1/users/USER_ID \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "preferences": {
      "theme": "dark",
      "language": "en"
    }
  }'
```

## Author Management

### Create author profile

```bash
curl -X POST http://localhost:8080/api/v1/authors \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "displayName": "Test Creator",
    "bio": "I create awesome 3D content",
    "website": "https://example.com",
    "socialLinks": {
      "twitter": "testcreator",
      "github": "testcreator"
    }
  }'
```

### Get my author profile

```bash
curl -X GET http://localhost:8080/api/v1/authors/me \
  -b cookies.txt
```

### List all authors

```bash
curl -X GET http://localhost:8080/api/v1/authors
```

### Update author profile

```bash
curl -X PATCH http://localhost:8080/api/v1/authors/AUTHOR_ID \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "bio": "Updated bio",
    "socialLinks": {
      "youtube": "mychannel"
    }
  }'
```

## Health Check

```bash
curl -X GET http://localhost:8080/health
```

## Complete Flow Example

Here's a complete workflow from registration to creating an author profile:

```bash
# 1. Register
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "username": "creator123",
    "email": "creator@example.com",
    "password": "SecurePass123"
  }'

# 2. Login (if not already logged in from registration)
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "creator@example.com",
    "password": "SecurePass123"
  }'

# 3. Check auth state
curl -X GET http://localhost:8080/api/v1/auth/state \
  -b cookies.txt

# 4. Get my user profile
curl -X GET http://localhost:8080/api/v1/users/me \
  -b cookies.txt

# 5. Create author profile
curl -X POST http://localhost:8080/api/v1/authors \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "displayName": "Amazing Creator",
    "bio": "Building the future of 3D web experiences",
    "website": "https://myportfolio.com",
    "socialLinks": {
      "twitter": "creator123",
      "github": "creator123"
    }
  }'

# 6. Get my author profile
curl -X GET http://localhost:8080/api/v1/authors/me \
  -b cookies.txt

# 7. Logout
curl -X POST http://localhost:8080/api/v1/auth/logout \
  -b cookies.txt
```

## Using with JavaScript/TypeScript

```typescript
// Login example
const login = async (email: string, password: string) => {
  const response = await fetch('http://localhost:8080/api/v1/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Important: includes cookies
    body: JSON.stringify({ email, password }),
  });

  return await response.json();
};

// Get current user
const getMe = async () => {
  const response = await fetch('http://localhost:8080/api/v1/users/me', {
    credentials: 'include',
  });

  return await response.json();
};

// Create author profile
const createAuthor = async (data: {
  displayName: string;
  bio?: string;
  website?: string;
}) => {
  const response = await fetch('http://localhost:8080/api/v1/authors', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  return await response.json();
};
```

## Error Responses

All endpoints return structured error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "type": "ValidationError",
    "code": 400,
    "message": "Detailed error message"
  }
}
```

Common status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error
