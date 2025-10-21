# Dashboard Components

## Overview

The dashboard components provide a complete, professional layout for the Asset Tracer application, including sidebar navigation, header with user menu, and content wrapper.

## Components

### Sidebar Component

A fully-featured sidebar navigation component for the Asset Tracer dashboard.

### Features

- ✅ **Fixed Positioning**: Stays in place during scroll
- ✅ **Active Route Highlighting**: Automatically highlights current page
- ✅ **Responsive Design**: Hidden on mobile, shown on tablet and up
- ✅ **Dark Mode Support**: Adapts to system dark mode
- ✅ **Smooth Animations**: Hover effects and transitions
- ✅ **TypeScript Support**: Full type safety
- ✅ **Accessible**: Keyboard navigation and ARIA support

### Usage

```tsx
import { Sidebar } from '@/components/dashboard/Sidebar';

export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 md:ml-64 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
```

### Navigation Items

The sidebar includes the following navigation items:

1. **Dashboard** (`/dashboard`) - LayoutDashboard icon
2. **Assets** (`/assets`) - Package icon
3. **Inventory** (`/inventory`) - Archive icon
4. **Clients** (`/clients`) - Users icon
5. **Quotations** (`/quotations`) - FileText icon
6. **Invoices** (`/invoices`) - Receipt icon
7. **Settings** (`/settings`) - Settings icon

### Styling

- **Width**: 256px (w-64)
- **Height**: Full viewport height
- **Background**: White (light mode), Slate-800 (dark mode)
- **Logo Section**: 64px height with primary-blue background
- **Active State**: Primary-blue background with 10% opacity

### Customization

To add or modify navigation items, edit the `navItems` array in `Sidebar.tsx`:

```tsx
const navItems: NavItem[] = [
  {
    label: 'Your Label',
    href: '/your-route',
    icon: YourIcon,
  },
  // ... more items
];
```

### Responsive Behavior

- **Mobile** (< 768px): Hidden
- **Tablet & Desktop** (≥ 768px): Visible and fixed

### Dark Mode

The sidebar automatically adapts to dark mode using Tailwind's `dark:` variants:
- Background changes to slate-800
- Text colors adjust for proper contrast
- Border colors adapt to darker theme

---

## Header Component

A responsive header component with user menu and dropdown functionality.

### Features

- ✅ **Dynamic Page Title**: Accepts title as prop
- ✅ **User Avatar**: Shows user initials or profile image
- ✅ **Dropdown Menu**: Settings and sign out options
- ✅ **Responsive**: User info hidden on mobile
- ✅ **Dark Mode Support**: Adapts to system theme
- ✅ **Accessibility**: Keyboard navigation and focus states

### Usage

```tsx
import { Header } from '@/components/dashboard/Header';

export function MyPage() {
  return <Header title="Dashboard" />;
}
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| title | string | Yes | Page title displayed on the left |

### User Menu Items

1. **Settings** - Opens settings page
2. **Sign Out** - Logs out user (red text)

### Styling

- **Height**: 64px (h-16)
- **Background**: White (light mode), Slate-800 (dark mode)
- **Border**: Bottom border in gray
- **Padding**: px-6 (24px horizontal)

### Placeholder Data

Currently uses placeholder user data:
```tsx
{
  name: 'John Doe',
  email: 'john.doe@example.com',
  avatar: '',
  initials: 'JD',
}
```

Replace this with real user data from your authentication system.

---

## DashboardWrapper Component

A wrapper component that provides the Header with dynamic titles based on the current route.

### Features

- ✅ **Automatic Title Detection**: Reads pathname and sets appropriate title
- ✅ **Scrollable Content**: Proper overflow handling
- ✅ **Consistent Padding**: Standard spacing for all pages

### Usage

Used automatically in the dashboard layout:

```tsx
import { DashboardWrapper } from '@/components/dashboard';

export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 md:ml-64">
        <DashboardWrapper>{children}</DashboardWrapper>
      </main>
    </div>
  );
}
```

### Route Titles Mapping

| Route | Title |
|-------|-------|
| /dashboard | Dashboard |
| /assets | Assets |
| /inventory | Inventory |
| /clients | Clients |
| /quotations | Quotations |
| /invoices | Invoices |
| /settings | Settings |

---

## Complete Layout Example

```tsx
import { Sidebar, DashboardWrapper } from '@/components/dashboard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-light-bg">
      <Sidebar />
      <main className="flex-1 md:ml-64 flex flex-col">
        <DashboardWrapper>{children}</DashboardWrapper>
      </main>
    </div>
  );
}
```

This creates a complete dashboard layout with:
- Fixed sidebar on the left (256px width)
- Header at the top (64px height)
- Main content area with proper spacing
- Responsive design for mobile/tablet/desktop

