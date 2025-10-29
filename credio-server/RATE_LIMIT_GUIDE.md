# Rate Limiting Guide

## Current Rate Limits

### Authentication
- **Register**: 5 requests per 15 minutes
- **Login**: 10 requests per 15 minutes
- **Forgot Password**: 3 requests per hour

### Emergency
- **SOS Creation**: 10 requests per minute
- **Resources**: No specific limit (uses general API limit)

### Chat
- **Send Message**: 30 messages per minute
- **Stream Message**: 20 requests per minute

### Disasters
- **List Disasters**: 60 requests per minute
- **Risk Assessment**: 30 requests per minute
- **Guidance**: 20 requests per minute

### Translation
- **All Translation Endpoints**: 100 requests per minute

## Clearing Rate Limits

If you hit a rate limit during testing, you can clear all rate limits:

```bash
npm run clear-rate-limits
```

Or manually:

```bash
node clear-rate-limits.js
```

## Rate Limit Response

When you hit a rate limit, you'll receive:

```json
{
  "success": false,
  "error": {
    "message": "Too many requests. Please try again in 60 seconds.",
    "retryAfter": 60
  }
}
```

## Adjusting Rate Limits

To adjust rate limits, edit the route files:
- `src/routes/authRoutes.ts`
- `src/routes/emergencyRoutes.ts`
- `src/routes/chatRoutes.ts`
- `src/routes/disasterRoutes.ts`
- `src/routes/translationRoutes.ts`

Example:
```typescript
rateLimiter({ windowMs: 60 * 1000, max: 10 }) // 10 requests per minute
```

## Production Recommendations

For production, consider:
- Stricter limits for authentication endpoints
- Per-user limits instead of IP-based
- Different limits for authenticated vs unauthenticated users
- Whitelist for trusted IPs
- Exponential backoff for repeated violations
