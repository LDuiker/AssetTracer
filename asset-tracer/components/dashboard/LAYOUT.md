# Dashboard Layout Structure

## Visual Layout

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  SIDEBAR (256px)         HEADER (Full Width, 64px height)     │
│  ┌─────────────┐        ┌──────────────────────────────────┐  │
│  │             │        │  Page Title     User Menu ▾      │  │
│  │   Logo      │        └──────────────────────────────────┘  │
│  │  (64px)     │                                              │
│  ├─────────────┤        ┌──────────────────────────────────┐  │
│  │             │        │                                  │  │
│  │ Dashboard   │        │                                  │  │
│  │ Assets      │        │                                  │  │
│  │ Inventory   │        │        MAIN CONTENT              │  │
│  │ Clients     │        │        (Scrollable)              │  │
│  │ Quotations  │        │                                  │  │
│  │ Invoices    │        │                                  │  │
│  │ Settings    │        │                                  │  │
│  │             │        │                                  │  │
│  │             │        │                                  │  │
│  ├─────────────┤        └──────────────────────────────────┘  │
│  │ User Info   │                                              │
│  └─────────────┘                                              │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
DashboardLayout
├── Sidebar (Fixed, 256px width)
│   ├── Logo Section (64px height, primary-blue bg)
│   ├── Navigation Items
│   └── User Footer
│
└── Main Content Area (Flexible, with md:ml-64)
    └── DashboardWrapper
        ├── Header (64px height)
        │   ├── Page Title (Left)
        │   └── User Menu (Right)
        │       ├── Avatar
        │       └── Dropdown Menu
        │           ├── User Info
        │           ├── Settings
        │           └── Sign Out
        │
        └── Page Content (Scrollable, padded)
```

## Responsive Behavior

### Desktop (≥ 768px)
- Sidebar: Visible, fixed position (left side, 256px)
- Header: Full width minus sidebar (automatic with md:ml-64)
- Content: Scrollable with proper margins
- Hamburger menu: Hidden

### Mobile (< 768px)
- Sidebar: Hidden by default
- Mobile Sidebar: Slide-in overlay with backdrop (when hamburger clicked)
- Header: Full width with hamburger menu button
- Content: Full width, scrollable
- User info in header: Hidden (only avatar shown)
- Body scroll: Locked when mobile menu is open

### Mobile Menu Features
- **Hamburger Button**: Visible only on mobile (< 768px)
- **Slide-in Animation**: Smooth transition when opening/closing
- **Backdrop**: Semi-transparent overlay (bg-black/50)
- **Click Outside**: Closes menu when clicking backdrop
- **Auto-close**: Closes when navigating to a page
- **Resize Handler**: Auto-closes when switching to desktop view

## Color Scheme

### Light Mode
- **Sidebar**: White background
- **Header**: White background
- **Main Content**: Light-bg (#F3F4F6)
- **Active Nav**: Primary-blue (#2563EB) with 10% opacity
- **Text**: Text-primary (#0B1226)

### Dark Mode
- **Sidebar**: Slate-800 background
- **Header**: Slate-800 background
- **Main Content**: Dark background
- **Active Nav**: Primary-blue with 20% opacity
- **Text**: White/Gray colors

## Dimensions

| Element | Desktop | Mobile |
|---------|---------|--------|
| Sidebar Width | 256px (w-64) | Hidden |
| Header Height | 64px (h-16) | 64px (h-16) |
| Logo Height | 64px (h-16) | N/A |
| Content Padding | 32px (p-8) | 24px (p-6) |
| Main Margin Left | 256px (md:ml-64) | 0 |

## Key Features

1. **Fixed Sidebar**: Remains visible during scroll
2. **Sticky Header**: Always visible at top of content area
3. **Active Highlighting**: Current page highlighted automatically
4. **Dropdown Menu**: User menu with avatar
5. **Responsive**: Adapts to all screen sizes
6. **Dark Mode**: Full support for dark theme
7. **Smooth Animations**: Hover effects and transitions
8. **Accessible**: Keyboard navigation and focus states

