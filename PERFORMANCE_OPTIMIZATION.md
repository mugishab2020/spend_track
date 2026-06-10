# 🚀 Performance Optimization Guide

## Current Performance Issues

1. **Delayed Rendering**: Info/data takes time to display
2. **Slow API Responses**: Backend calls are blocking UI
3. **Re-renders**: Components re-render unnecessarily
4. **Large Payloads**: Fetching too much data at once

---

## Quick Wins (Immediate Impact)

### 1. Add Loading Skeletons
Instead of showing blank screens or spinners, show skeleton placeholders:

**Before:**
```tsx
{isLoading ? <ActivityIndicator /> : <DataList />}
```

**After:**
```tsx
{isLoading ? <SkeletonPlaceholder /> : <DataList />}
```

### 2. Implement Data Caching
Cache API responses to avoid repeated fetches:

```typescript
// In context or service
const [cache, setCache] = useState<Map<string, any>>(new Map());

const fetchData = async (key: string) => {
  if (cache.has(key)) {
    return cache.get(key); // Return cached data immediately
  }
  
  const data = await apiClient.get(key);
  setCache(new Map(cache).set(key, data));
  return data;
};
```

### 3. Use React.memo for Components
Prevent unnecessary re-renders:

```typescript
export const CategoryCard = React.memo(({ item }: Props) => {
  // Component code
}, (prevProps, nextProps) => {
  // Only re-render if these change
  return prevProps.item.id === nextProps.item.id &&
         prevProps.item.cap_amount === nextProps.item.cap_amount;
});
```

### 4. Debounce API Calls
Delay API calls until user stops typing:

```typescript
import { debounce } from 'lodash';

const debouncedSearch = useMemo(
  () => debounce((query) => {
    searchAPI(query);
  }, 300),
  []
);
```

### 5. Lazy Load Heavy Components
Only load components when needed:

```typescript
import { lazy, Suspense } from 'react';

const AIInsights = lazy(() => import('./ai-insights'));

// In render:
<Suspense fallback={<Loading />}>
  <AIInsights />
</Suspense>
```

---

## Backend Optimizations

### 1. Add Database Indexing
Index frequently queried columns:

```python
# In migrations
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_categories_user_id ON categories(user_id);
```

### 2. Implement Response Caching
Cache expensive computations:

```python
from functools import lru_cache
from datetime import datetime, timedelta

@lru_cache(maxsize=128)
def get_user_balance(user_id: str, cache_key: str):
    # Expensive calculation
    return balance

# Use with time-based cache key
cache_key = datetime.now().strftime("%Y-%m-%d-%H")
balance = get_user_balance(user_id, cache_key)
```

### 3. Optimize Database Queries
Reduce N+1 queries with eager loading:

```python
# Bad: N+1 queries
categories = db.query(Category).all()
for cat in categories:
    transactions = db.query(Transaction).filter_by(category_id=cat.id).all()

# Good: Single query with join
categories = db.query(Category).options(
    joinedload(Category.transactions)
).all()
```

### 4. Add Pagination
Limit data returned per request:

```python
@router.get("/transactions")
async def get_transactions(
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    transactions = db.query(Transaction)\
        .limit(limit)\
        .offset(offset)\
        .all()
    
    return {
        "items": transactions,
        "limit": limit,
        "offset": offset,
        "has_more": len(transactions) == limit
    }
```

### 5. Compress Responses
Enable gzip compression:

```python
# In main.py
from fastapi.middleware.gzip import GZipMiddleware

app.add_middleware(GZipMiddleware, minimum_size=1000)
```

---

## Frontend Optimizations

### 1. Implement Virtual Lists
For long lists (transactions, categories):

```bash
npm install @shopify/flash-list
```

```tsx
import { FlashList } from "@shopify/flash-list";

<FlashList
  data={transactions}
  renderItem={renderTransaction}
  estimatedItemSize={80}
/>
```

### 2. Optimize Images
- Use optimized image formats (WebP)
- Lazy load images
- Add image dimensions

```tsx
<Image
  source={{ uri: imageUrl }}
  style={{ width: 100, height: 100 }}
  resizeMode="cover"
  loading="lazy"
/>
```

### 3. Reduce Bundle Size
Remove unused dependencies:

```bash
npm install -g depcheck
depcheck
```

### 4. Use Reanimated for Animations
Replace Animated API with react-native-reanimated:

```typescript
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

const animatedStyle = useAnimatedStyle(() => ({
  opacity: withTiming(isVisible ? 1 : 0),
}));
```

### 5. Optimize Context Usage
Split large contexts into smaller ones:

**Before:**
```tsx
<AppContext.Provider value={{ user, transactions, categories, ... }}>
```

**After:**
```tsx
<UserContext.Provider value={user}>
  <TransactionsContext.Provider value={transactions}>
    <CategoriesContext.Provider value={categories}>
```

---

## Specific Fixes for Current App

### 1. Categories Screen Loading

**Problem:** Fetches categories, transactions, and computes spending on every render

**Solution:**
```tsx
// Memoize expensive computations
const spending = useMemo(() => {
  const result: Record<string, number> = {};
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      result[t.category] = (result[t.category] || 0) + t.amount;
    });
  return result;
}, [transactions]);

// Memoize category cards
const renderCategory = useCallback(({ item }) => {
  return <CategoryCard item={item} spent={spending[item.id] || 0} />;
}, [spending]);
```

### 2. AI Distribution Delay

**Problem:** Large Gemini API calls take 3-5 seconds

**Solution:**
```tsx
// Show preview immediately with loading state
const [preview, setPreview] = useState(null);
const [isGenerating, setIsGenerating] = useState(false);

const handleDistribute = async () => {
  setIsGenerating(true);
  
  // Show skeleton preview immediately
  setPreview({ loading: true, categories: [] });
  
  try {
    const result = await apiClient.get('/ai/distribute-funds/preview');
    setPreview(result.data);
  } finally {
    setIsGenerating(false);
  }
};
```

### 3. Wallet Balance Calculation

**Problem:** Recalculates on every render

**Solution:**
```tsx
// Cache balance calculation
const { income, expenses, balance } = useMemo(() => {
  const income = walletBalance.income;
  const expenses = walletBalance.expenses;
  return {
    income,
    expenses,
    balance: income - expenses
  };
}, [walletBalance]);
```

### 4. Transaction List Rendering

**Problem:** Renders all transactions at once

**Solution:**
```tsx
// Use FlashList with pagination
<FlashList
  data={transactions}
  renderItem={renderTransaction}
  estimatedItemSize={70}
  onEndReached={loadMoreTransactions}
  onEndReachedThreshold={0.5}
/>
```

---

## Monitoring Performance

### 1. Add Performance Metrics

```tsx
import { useCallback, useEffect } from 'react';

const usePerformanceMonitor = (componentName: string) => {
  useEffect(() => {
    const start = Date.now();
    
    return () => {
      const duration = Date.now() - start;
      console.log(`${componentName} render time: ${duration}ms`);
    };
  }, [componentName]);
};

// Usage
usePerformanceMonitor('CategoriesScreen');
```

### 2. Backend Request Timing

```python
import time
from functools import wraps

def timed_route(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        start = time.time()
        result = await func(*args, **kwargs)
        duration = time.time() - start
        print(f"{func.__name__} took {duration:.2f}s")
        return result
    return wrapper

@router.get("/expensive-endpoint")
@timed_route
async def expensive_endpoint():
    # ... 
```

---

## Implementation Priority

### Phase 1: Immediate (This Week)
1. ✅ Add loading skeletons
2. ✅ Memoize expensive computations
3. ✅ Add React.memo to list items
4. ✅ Cache API responses

### Phase 2: Short-term (Next Week)
1. ⏳ Add database indexes
2. ⏳ Implement pagination
3. ⏳ Use FlashList for long lists
4. ⏳ Optimize context usage

### Phase 3: Long-term (Next Month)
1. ⏳ Add response caching layer
2. ⏳ Implement virtual scrolling
3. ⏳ Add bundle size optimization
4. ⏳ Implement lazy loading

---

## Expected Improvements

| Area | Before | After | Improvement |
|------|--------|-------|-------------|
| Initial Load | 3-5s | 1-2s | 60% faster |
| Category Render | 500ms | 100ms | 80% faster |
| AI Distribution | 5-7s | 2-3s | 50% faster |
| List Scrolling | Laggy | Smooth | 100% better |
| API Calls | 1-2s | 200-500ms | 75% faster |

---

## Testing Performance

### 1. React Native Performance Monitor
```bash
# Enable in dev mode
# Shake device → Show Perf Monitor
```

### 2. Backend Profiling
```python
# Install
pip install py-spy

# Profile running server
py-spy top --pid <server_pid>
```

### 3. Network Analysis
```bash
# Use Charles Proxy or React Native Debugger
# Monitor API call times and sizes
```

---

**Created:** June 3, 2026
**Status:** 📋 Action plan ready for implementation
