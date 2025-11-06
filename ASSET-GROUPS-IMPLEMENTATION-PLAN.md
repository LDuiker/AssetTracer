# Asset Groups Feature - Implementation Plan

## Overview
Allow creating grouped assets (e.g., "Cutlery Set - 24 pieces") where individual items can be tracked as part of a group, reducing manual entry for sets.

## Database Schema Changes

### Option 1: Self-Referencing (Simpler)
Add fields to existing `assets` table:
- `asset_type`: 'individual' | 'group'
- `parent_group_id`: UUID reference to parent group (nullable)
- `quantity`: INTEGER (for groups: total items, for individuals: 1)

### Option 2: Separate Table (More Flexible)
Create `asset_groups` table:
- Links groups to individual assets
- Tracks quantity per item
- Allows better querying

**Recommendation: Option 1** - Simpler, easier to implement, sufficient for most use cases.

## Features to Implement

### 1. Create Group Asset
- Toggle: "Individual Asset" vs "Group Asset"
- For groups: Quantity field
- For groups: Option to add individual items later

### 2. Add Items to Group
- Select existing individual assets
- Or create new assets and add to group
- Track quantity per item in group

### 3. Group Display
- Show groups with badge/icon
- Show quantity in group
- Expandable view to see individual items

### 4. Group Operations
- Track group-level rentals/sales
- Update group status affects all items
- Group financial tracking

## Implementation Steps

1. **Database Migration** - Add fields to assets table
2. **Type Updates** - Update TypeScript interfaces
3. **Form Updates** - Add group/individual toggle
4. **UI Components** - Group management interface
5. **API Updates** - Handle group creation/updates
6. **List View** - Show groups differently

