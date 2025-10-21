# Dashboard Home Page

## Overview

The dashboard home page provides a comprehensive overview of the business with stats cards, recent activity, and quick actions.

## Features

### 1. Welcome Message
- Personalized greeting with user name
- Contextual subtitle
- Clean typography with proper spacing

### 2. Stats Cards (4 cards)

#### Total Assets
- **Icon**: Package (Primary Blue)
- **Value**: Total count of assets
- **Description**: Growth indicator from last month
- **Color Scheme**: Primary Blue (#2563EB)

#### Active Invoices
- **Icon**: FileText (Accent Cyan)
- **Value**: Count of active invoices
- **Description**: Due dates information
- **Color Scheme**: Accent Cyan (#06B6D4)

#### Monthly Revenue
- **Icon**: DollarSign (Green)
- **Value**: Total monthly revenue
- **Description**: Percentage change from last month
- **Color Scheme**: Green (#16A34A)

#### Pending Payments
- **Icon**: AlertCircle (Accent Orange)
- **Value**: Total pending amount
- **Description**: Overdue invoices count
- **Color Scheme**: Accent Orange (#F97316)

### 3. Responsive Grid Layout

```
Mobile (< 768px):     1 column
Tablet (768-1024px):  2 columns
Desktop (≥ 1024px):   4 columns
```

### 4. Recent Activity Sections

#### Recent Assets (Left)
- Shows last 3 added assets
- Asset ID and added date
- Asset value
- Hover effects for interactivity

#### Recent Invoices (Right)
- Shows last 3 invoices
- Invoice number and client
- Status badges (Paid, Pending, Overdue)
- Color-coded status indicators

### 5. Quick Actions

Four quick action buttons:
1. **Add Asset** - Primary Blue theme
2. **New Invoice** - Accent Cyan theme
3. **New Quote** - Green theme
4. **Add Client** - Purple theme

Each button features:
- Dashed border hover effect
- Icon with background color
- Smooth color transitions
- Responsive grid layout

## Component Structure

```
DashboardPage
├── Welcome Section
│   ├── Greeting (h2)
│   └── Subtitle (p)
│
├── Stats Cards Grid (4 cards)
│   ├── Total Assets Card
│   ├── Active Invoices Card
│   ├── Monthly Revenue Card
│   └── Pending Payments Card
│
├── Recent Activity Grid (2 columns)
│   ├── Recent Assets Card
│   │   └── 3 Asset Items
│   └── Recent Invoices Card
│       └── 3 Invoice Items
│
└── Quick Actions Card
    ├── Add Asset Button
    ├── New Invoice Button
    ├── New Quote Button
    └── Add Client Button
```

## Styling Details

### Stats Cards
- **Height**: Auto (content-based)
- **Padding**: Standard Card padding
- **Border**: 2px border
- **Hover**: Shadow lift effect
- **Transition**: 200ms duration
- **Icon Background**: 10% opacity of icon color
- **Icon Size**: 20px (h-5 w-5)
- **Value Size**: 3xl (30px)
- **Title Size**: sm (14px)

### Recent Activity Cards
- **Spacing**: 4 units between items
- **Item Padding**: 12px (p-3)
- **Hover**: Light gray background
- **Icons**: 10px x 10px container with icon
- **Status Badges**: Rounded full, colored

### Quick Actions
- **Grid**: 2 columns on mobile, 4 on tablet+
- **Button Border**: 2px dashed
- **Icon Container**: 12px x 12px
- **Hover**: Color-themed background and border
- **Transition**: All properties, smooth

## Color Schemes

### Primary Blue
- Icon: `text-primary-blue` (#2563EB)
- Background: `bg-primary-blue/10`
- Hover: `hover:border-primary-blue`

### Accent Cyan
- Icon: `text-accent-cyan` (#06B6D4)
- Background: `bg-accent-cyan/10`
- Hover: `hover:border-accent-cyan`

### Green (Revenue)
- Icon: `text-green-600` (#16A34A)
- Background: `bg-green-100`
- Hover: `hover:border-green-600`

### Accent Orange (Alerts)
- Icon: `text-accent-orange` (#F97316)
- Background: `bg-accent-orange/10`
- Hover: `hover:border-accent-orange`

## Placeholder Data

Currently uses static placeholder data:

```tsx
// User Data
{
  name: 'John Doe'
}

// Stats Data
[
  { title: 'Total Assets', value: '127', ... },
  { title: 'Active Invoices', value: '18', ... },
  { title: 'Monthly Revenue', value: '$12,450', ... },
  { title: 'Pending Payments', value: '$3,280', ... }
]
```

Replace with real data from your API/database.

## Usage

```tsx
// The page is automatically routed at /dashboard
// No additional setup needed
```

## Dark Mode Support

All elements have dark mode variants:
- Text colors adapt automatically
- Card backgrounds use dark variants
- Hover states maintain visibility
- Icons remain clearly visible

## Responsive Behavior

### Mobile (< 768px)
- Stats: 1 column stack
- Recent Activity: 1 column stack
- Quick Actions: 2 columns

### Tablet (768px - 1024px)
- Stats: 2 columns
- Recent Activity: 1 or 2 columns
- Quick Actions: 4 columns

### Desktop (≥ 1024px)
- Stats: 4 columns
- Recent Activity: 2 columns side-by-side
- Quick Actions: 4 columns

## Future Enhancements

1. Connect to real API data
2. Add click handlers to quick actions
3. Add loading states
4. Add error handling
5. Add charts/graphs for trends
6. Add date range filters
7. Add export functionality

