# Admin Resources & Settings Pages

## Overview
Created two new admin panel pages: Resources Management and Settings.

## 1. Resources Management Page (`/admin/resources`)

### Features
- **Resource List** - View all emergency resources (hospitals, shelters, etc.)
- **Add Resource** - Create new emergency resources
- **Edit Resource** - Update existing resource information
- **Delete Resource** - Remove resources from the system
- **Statistics Cards** - Show total, available, limited, and unavailable resources
- **Data Table** - Sortable, searchable table with all resources

### Resource Fields
- Name (e.g., "City Hospital")
- Type (e.g., "HOSPITAL", "SHELTER")
- Location (address, latitude, longitude)
- Contact Phone
- Availability (AVAILABLE, LIMITED, UNAVAILABLE)

### API Endpoints Used
- `GET /api/emergency/resources` - Fetch all resources
- `POST /api/admin/resources` - Create resource
- `PATCH /api/admin/resources/:id` - Update resource
- `DELETE /api/admin/resources/:id` - Delete resource

### UI Components
- DataTable for resource list
- Dialog for create/edit forms
- Badge for availability status
- Stats cards for quick overview

## 2. Settings Page (`/admin/settings`)

### Tabs

#### Profile Tab
- **Personal Information**
  - Full Name
  - Email
  - Phone Number
- **Role & Permissions** - Display current admin role
- **Save Changes** - Update profile information

#### Notifications Tab
- **Email Alerts** - Toggle email notifications
- **SMS Alerts** - Toggle SMS notifications
- **Push Notifications** - Toggle browser push notifications
- **Weekly Reports** - Toggle weekly summary emails
- **Critical Only** - Only receive critical notifications

#### System Tab
- **Maintenance Mode** - Enable/disable system maintenance
- **Automatic Backups** - Toggle auto backups
- **Data Retention** - Set days to keep historical data
- **Max Upload Size** - Configure maximum file upload size

#### Security Tab
- **Change Password** - Update account password
- **Two-Factor Authentication** - Enable 2FA
- **Active Sessions** - View and manage login sessions
- **Danger Zone** - Clear cache and other critical actions

### Features
- **Tabbed Interface** - Organized settings into logical groups
- **Toggle Switches** - Easy on/off controls for boolean settings
- **Form Inputs** - Text and number inputs for configuration
- **Save Buttons** - Per-section save functionality
- **Toast Notifications** - Success/error feedback

## New Components Created

### Switch Component (`components/ui/switch.tsx`)
- Radix UI based toggle switch
- Used for boolean settings
- Accessible and keyboard navigable

## Navigation

Both pages are accessible from the Admin Sidebar:
- Resources: `/admin/resources` (MapPin icon)
- Settings: `/admin/settings` (Settings icon)

## Usage

### Resources Page
1. Navigate to `/admin/resources`
2. Click "Add Resource" to create new resource
3. Fill in resource details (name, type, location, contact, availability)
4. Click "Create Resource"
5. Edit or delete resources using action buttons in table

### Settings Page
1. Navigate to `/admin/settings`
2. Select desired tab (Profile, Notifications, System, Security)
3. Update settings as needed
4. Click "Save Changes" or "Save Preferences" to persist changes

## API Integration

### Resources
- Uses existing emergency resources endpoints
- Admin-specific CRUD operations for resources
- Proper data extraction from API responses

### Settings
- Profile updates use `updateAdminUserInfo` endpoint
- Notification and system settings are UI-only (can be connected to backend)
- Security features are placeholders for future implementation

## Future Enhancements

### Resources
- [ ] Map view of resources
- [ ] Bulk import/export
- [ ] Resource categories/tags
- [ ] Capacity tracking
- [ ] Operating hours

### Settings
- [ ] Backend integration for notification preferences
- [ ] System settings persistence
- [ ] Password change functionality
- [ ] 2FA implementation
- [ ] Session management
- [ ] Audit log viewer
- [ ] Email template customization
- [ ] API key management

## Testing

### Resources Page
1. Login as admin
2. Navigate to `/admin/resources`
3. Verify resource list displays
4. Test create, edit, and delete operations
5. Check stats cards update correctly

### Settings Page
1. Login as admin
2. Navigate to `/admin/settings`
3. Test all tabs load correctly
4. Toggle switches and verify state changes
5. Update profile and verify save works
6. Check toast notifications appear

## Notes
- Both pages follow the same design patterns as other admin pages
- Proper error handling with toast notifications
- Loading states for async operations
- Responsive design for mobile/tablet
- Accessible UI components
