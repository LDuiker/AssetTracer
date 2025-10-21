# SWR Configuration

Global SWR configuration for the Asset Tracer application.

## Overview

This file provides a centralized configuration for all SWR hooks in the application, ensuring consistent behavior for data fetching and caching.

## Configuration

### Default Settings

```typescript
{
  fetcher,                        // Global fetcher function
  revalidateOnFocus: false,       // Don't refetch when window gains focus
  revalidateOnReconnect: true,    // Refetch when connection is restored
  shouldRetryOnError: false,      // Don't automatically retry failed requests
}
```

### Settings Explained

#### `revalidateOnFocus: false`
- **Why**: Prevents unnecessary API calls when users switch between browser tabs
- **Benefit**: Reduces server load and improves performance
- **Manual refresh**: Users can still manually refresh data when needed

#### `revalidateOnReconnect: true`
- **Why**: Ensures data is fresh after internet connection issues
- **Benefit**: Automatically syncs data when connection is restored
- **UX**: Users always see up-to-date data after reconnection

#### `shouldRetryOnError: false`
- **Why**: Prevents multiple retry attempts that could cascade failures
- **Benefit**: Faster error feedback to users
- **Manual retry**: Users can manually retry via UI buttons

## Fetcher Function

The global fetcher handles all API requests:

```typescript
export const fetcher = async (url: string) => {
  const res = await fetch(url, {
    credentials: 'include', // Include cookies for authentication
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({
      error: 'An error occurred while fetching data',
    }));
    throw new Error(error.error || `Request failed with status ${res.status}`);
  }

  return res.json();
};
```

### Features
- ✅ Includes credentials (cookies) for authentication
- ✅ Parses JSON responses
- ✅ Extracts error messages from API
- ✅ Throws descriptive errors for SWR error handling

## Usage

### In Dashboard Layout

The SWRConfig provider is already set up in `app/(dashboard)/layout.tsx`:

```typescript
import { SWRConfig } from 'swr';
import { swrConfig } from '@/lib/swr-config';

<SWRConfig value={swrConfig}>
  <OrganizationProvider>
    {children}
  </OrganizationProvider>
</SWRConfig>
```

### In Components

Simply use `useSWR` without passing a fetcher:

```typescript
import useSWR from 'swr';

function MyComponent() {
  // Uses global fetcher and config
  const { data, error, isLoading } = useSWR('/api/endpoint');
  
  // ...
}
```

### Custom Fetcher (Optional)

If you need a custom fetcher for a specific hook:

```typescript
const customFetcher = async (url: string) => {
  // Custom logic
};

const { data } = useSWR('/api/endpoint', customFetcher);
```

### Manual Revalidation

```typescript
const { data, mutate } = useSWR('/api/assets');

// Trigger manual refresh
await mutate();

// Or optimistically update
mutate(newData, { revalidate: true });
```

## Error Handling

Errors thrown by the fetcher are caught by SWR:

```typescript
const { data, error } = useSWR('/api/assets');

if (error) {
  return <div>Error: {error.message}</div>;
}
```

## Optimistic Updates

Update local cache immediately, then revalidate:

```typescript
const { mutate } = useSWR('/api/assets');

// Optimistic update
await mutate(
  { assets: [...assets, newAsset] }, // New data
  { revalidate: true }                // Revalidate after
);
```

## Best Practices

### 1. Use SWR for GET requests
```typescript
const { data } = useSWR('/api/assets');
```

### 2. Use mutate for POST/PATCH/DELETE
```typescript
const response = await fetch('/api/assets', {
  method: 'POST',
  body: JSON.stringify(data),
});

// Update cache after mutation
mutate({ assets: [...assets, newAsset] });
```

### 3. Handle loading states
```typescript
if (isLoading) return <Spinner />;
if (error) return <Error />;
return <Data data={data} />;
```

### 4. Conditional fetching
```typescript
// Only fetch if userId is available
const { data } = useSWR(userId ? `/api/user/${userId}` : null);
```

## Benefits

✅ **Centralized Configuration**: All SWR hooks use the same settings
✅ **Consistent Error Handling**: Uniform error messages across the app
✅ **Authentication**: Credentials included automatically
✅ **Performance**: Reduced unnecessary API calls
✅ **Type Safety**: TypeScript support throughout
✅ **Developer Experience**: Less boilerplate code

## Troubleshooting

### Issue: Data not updating after mutation

**Solution**: Make sure to call `mutate()` after API operations:
```typescript
await fetch('/api/assets', { method: 'POST', ... });
mutate(); // Revalidate data
```

### Issue: Authentication errors

**Solution**: Ensure `credentials: 'include'` is set in fetcher (already done)

### Issue: Too many API calls

**Solution**: Check `revalidateOnFocus` and `revalidateOnMount` settings

## Related Files

- `app/(dashboard)/layout.tsx` - SWRConfig provider setup
- `app/(dashboard)/assets/page.tsx` - Example usage
- `lib/context/OrganizationContext.tsx` - Uses SWR internally

