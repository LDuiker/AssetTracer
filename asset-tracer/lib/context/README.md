# Organization Context

React Context for managing organization data across the application.

## Overview

The `OrganizationContext` provides organization data to all components within the dashboard. It automatically fetches the user's organization on mount and provides it through the `useOrganization` hook.

## Setup

The `OrganizationProvider` is already wrapped around the dashboard layout in `app/(dashboard)/layout.tsx`.

```typescript
<OrganizationProvider>
  {/* Dashboard content */}
</OrganizationProvider>
```

## Usage

Use the `useOrganization` hook in any component within the dashboard:

```typescript
'use client';

import { useOrganization } from '@/lib/context';

export function MyComponent() {
  const { organization, organizationId, isLoading, error, refetch } = useOrganization();

  if (isLoading) {
    return <div>Loading organization...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>Organization: {organization?.name}</h1>
      <p>ID: {organizationId}</p>
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

## API

### OrganizationProvider

**Props:**
- `children: ReactNode` - Child components

**Behavior:**
- Fetches organization data on mount
- Stores organization state
- Provides data to all children

### useOrganization()

**Returns:**
```typescript
{
  organization: Organization | null;  // Full organization object
  organizationId: string | null;      // Just the ID (for quick access)
  isLoading: boolean;                 // Loading state
  error: string | null;               // Error message if any
  refetch: () => Promise<void>;       // Function to refetch data
}
```

**Organization Type:**
```typescript
interface Organization {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}
```

**Throws:**
- Error if used outside of `OrganizationProvider`

## Examples

### Using organizationId in API calls

```typescript
'use client';

import { useOrganization } from '@/lib/context';
import { useEffect, useState } from 'react';

export function AssetsList() {
  const { organizationId, isLoading } = useOrganization();
  const [assets, setAssets] = useState([]);

  useEffect(() => {
    if (organizationId) {
      fetchAssets(organizationId).then(setAssets);
    }
  }, [organizationId]);

  if (isLoading) return <div>Loading...</div>;

  return <div>{/* Render assets */}</div>;
}
```

### Conditional rendering based on organization

```typescript
'use client';

import { useOrganization } from '@/lib/context';

export function PremiumFeature() {
  const { organization } = useOrganization();

  if (organization?.plan === 'premium') {
    return <div>Premium Feature Content</div>;
  }

  return <div>Upgrade to access this feature</div>;
}
```

### Refreshing organization data

```typescript
'use client';

import { useOrganization } from '@/lib/context';

export function OrganizationSettings() {
  const { organization, refetch } = useOrganization();

  const handleSave = async (data) => {
    await updateOrganization(data);
    // Refresh organization data
    await refetch();
  };

  return <form onSubmit={handleSave}>{/* Form fields */}</form>;
}
```

## Error Handling

The context includes built-in error handling:

```typescript
const { error } = useOrganization();

if (error) {
  // Handle error (show message, redirect, etc.)
  return <ErrorBoundary error={error} />;
}
```

## Notes

- The hook must be used within a client component (`'use client'`)
- Organization data is fetched automatically on mount
- Fallback to `default-org` if user profile doesn't have organization_id
- The context handles session validation internally

