# Backend Integration Guide

## Setup Instructions

### 1. Configure Your Backend URL

Edit `constants/api.ts` and replace the placeholder with your actual backend URL:

```typescript
export const API_CONFIG = {
  BASE_URL: 'https://your-backend-url.com', // Replace with your actual backend URL
  TIMEOUT: 10000,
};
```

### 2. Install Dependencies

The required dependency `expo-secure-store` has been installed. If you need to reinstall:

```bash
npm install expo-secure-store
```

### 3. Authentication Flow

The app now includes:
- Login screen at `/login`
- Automatic redirect based on auth state
- Secure token storage using `expo-secure-store`
- Logout functionality in settings

### 4. API Services

All backend services are located in the `services/` directory:

- `services/api.ts` - Base API client with auth token handling
- `services/auth.service.ts` - Login, logout, get current user
- `services/transactions.service.ts` - CRUD operations for transactions
- `services/categories.service.ts` - Category management
- `services/wallet.service.ts` - Wallet summary and income
- `services/ai.service.ts` - AI chat integration

### 5. Context Updates

- `AuthContext` - Manages authentication state and user data
- `TransactionsContext` - Now fetches from backend instead of local storage

### 6. Testing the Integration

1. Start your backend server
2. Update the `BASE_URL` in `constants/api.ts`
3. Run the app: `npm start` or `npx expo start`
4. Login with valid credentials
5. Transactions will now sync with your backend

### 7. API Endpoints Used

#### Authentication
- `POST /api/auth/login` - Login with email/password
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - Logout

#### Transactions
- `GET /api/transactions` - Get all transactions (supports filters)
- `GET /api/transactions/:id` - Get single transaction
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

#### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

#### Wallet
- `GET /api/wallet` - Get wallet summary
- `POST /api/wallet/income` - Add income

#### AI Chat
- `POST /api/ai/chat` - Send messages to AI assistant

### 8. Error Handling

All API calls include error handling:
- Network errors
- Timeout errors (10 second default)
- HTTP error responses
- Token expiration (401 responses)

### 9. Security

- JWT tokens stored securely using `expo-secure-store`
- Automatic token inclusion in authenticated requests
- Token cleanup on logout

### 10. Offline Support (Future Enhancement)

Currently, the app requires an active internet connection. To add offline support:
- Implement local caching with AsyncStorage
- Add sync queue for offline changes
- Handle conflict resolution

## Troubleshooting

### Login fails
- Check that `BASE_URL` is correct
- Verify backend is running
- Check network connectivity
- Verify credentials are correct

### Transactions not loading
- Ensure you're logged in
- Check auth token is valid
- Verify backend `/api/transactions` endpoint is working

### Token expired
- The app will redirect to login automatically
- User needs to login again

## Next Steps

1. Update `BASE_URL` in `constants/api.ts`
2. Test login flow
3. Verify transactions sync
4. Test AI chat integration
5. Customize error messages as needed
