# Translation Implementation Guide

## Overview
The Credio app now supports multi-language functionality with English and Hindi. This guide shows how to implement translations across all pages.

## System Architecture

### 1. Language Store (`lib/store/language-store.ts`)
- Manages current language state
- Persists language preference in localStorage
- Supports 'en' (English) and 'hi' (Hindi)

### 2. Translation Files
- `lib/translations/en.ts` - English translations
- `lib/translations/hi.ts` - Hindi translations
- `lib/translations/index.ts` - Translation utilities

### 3. Usage Pattern

```typescript
// Import the hooks
import { useLanguageStore } from '@/lib/store/language-store'
import { useTranslation } from '@/lib/translations'

// In your component
const { language } = useLanguageStore()
const t = useTranslation(language)

// Use translations
<h1>{t.dashboard.title}</h1>
<Button>{t.common.save}</Button>
```

## Implementation Steps for Each Page

### Step 1: Add Translations to Translation Files

**English (`lib/translations/en.ts`):**
```typescript
export const en = {
  pageName: {
    title: 'Page Title',
    subtitle: 'Page subtitle',
    button: 'Click Me',
  },
}
```

**Hindi (`lib/translations/hi.ts`):**
```typescript
export const hi: TranslationKeys = {
  pageName: {
    title: 'पेज शीर्षक',
    subtitle: 'पेज उपशीर्षक',
    button: 'मुझे क्लिक करें',
  },
}
```

### Step 2: Update Page Component

```typescript
'use client'

import { useLanguageStore } from '@/lib/store/language-store'
import { useTranslation } from '@/lib/translations'

export default function YourPage() {
  const { language } = useLanguageStore()
  const t = useTranslation(language)

  return (
    <div>
      <h1>{t.pageName.title}</h1>
      <p>{t.pageName.subtitle}</p>
      <button>{t.pageName.button}</button>
    </div>
  )
}
```

## Pages to Update

### Priority 1 - User-Facing Pages
- [x] Settings Page (`/dashboard/settings`)
- [ ] Login Page (`/(auth)/login`)
- [ ] Register Page (`/(auth)/register`)
- [ ] Dashboard (`/dashboard`)
- [ ] SOS Page (`/emergency/sos`)
- [ ] Disasters Page (`/disasters`)
- [ ] Alerts Page (`/dashboard/alerts`)
- [ ] Chat Page (`/chat`)

### Priority 2 - Components
- [ ] Navigation (`components/layout/Navigation.tsx`)
- [ ] SOS Button (`components/emergency/SOSButton.tsx`)
- [ ] Disaster Card (`components/disasters/DisasterCard.tsx`)
- [ ] Alert Notification (`components/alerts/AlertNotification.tsx`)

### Priority 3 - Admin Pages
- [ ] Admin Dashboard (`/admin`)
- [ ] SOS Monitoring (`/admin/sos`)
- [ ] User Management (`/admin/users`)
- [ ] Disaster Management (`/admin/disasters`)
- [ ] Analytics (`/admin/analytics`)

## Translation Keys Structure

```typescript
{
  common: {
    // Buttons, actions
    save, cancel, delete, edit, create, update, search, filter, refresh
  },
  nav: {
    // Navigation items
    dashboard, disasters, aiAssistant, map, emergency, sos, resources
  },
  dashboard: {
    // Dashboard specific
    title, welcome, activeDisasters, recentAlerts
  },
  sos: {
    // SOS page specific
    title, activate, description, confirmTitle, confirmMessage
  },
  settings: {
    // Settings page specific
    title, profile, notifications, language, security
  },
  admin: {
    // Admin pages
    dashboard, sosMonitoring, userManagement, analytics
  }
}
```

## Example: Updating Login Page

### Before:
```typescript
<h1 className="text-2xl font-bold">Welcome to Credio</h1>
<p>Log in to access disaster alerts</p>
<Button>Log In</Button>
```

### After:
```typescript
const { language } = useLanguageStore()
const t = useTranslation(language)

<h1 className="text-2xl font-bold">{t.login.title}</h1>
<p>{t.login.subtitle}</p>
<Button>{t.login.loginButton}</Button>
```

## Adding New Translation Keys

1. Add to English file:
```typescript
// lib/translations/en.ts
export const en = {
  // ... existing keys
  newSection: {
    newKey: 'New English Text',
  },
}
```

2. Add to Hindi file:
```typescript
// lib/translations/hi.ts
export const hi: TranslationKeys = {
  // ... existing keys
  newSection: {
    newKey: 'नया हिंदी पाठ',
  },
}
```

3. Use in component:
```typescript
{t.newSection.newKey}
```

## Dynamic Content

For dynamic content with variables:
```typescript
// Translation file
welcome: (name: string) => `Welcome, ${name}!`

// Usage
{t.dashboard.welcome(user.name)}
```

## Best Practices

1. **Keep keys organized** - Group by page/feature
2. **Use descriptive names** - `loginButton` not `btn1`
3. **Avoid hardcoded text** - Always use translation keys
4. **Test both languages** - Switch language and verify all text displays correctly
5. **Handle plurals** - Create separate keys for singular/plural if needed
6. **Keep translations short** - UI space is limited
7. **Use consistent terminology** - Same term should have same translation

## Testing

1. Go to Settings page
2. Change language to Hindi
3. Navigate through all pages
4. Verify all text is translated
5. Check for:
   - Missing translations (English text in Hindi mode)
   - Layout issues (Hindi text might be longer/shorter)
   - Special characters rendering correctly

## Current Status

✅ **Implemented:**
- Language store with persistence
- Translation system with English and Hindi
- Settings page with language selector
- Basic translations for common UI elements

🔄 **In Progress:**
- Expanding translation coverage to all pages

📋 **To Do:**
- Translate all user-facing pages
- Translate all components
- Translate admin pages
- Add more languages (if needed)
- RTL support for Arabic (future)

## Quick Reference

### Change Language Programmatically
```typescript
const { setLanguage } = useLanguageStore()
setLanguage('hi') // Switch to Hindi
setLanguage('en') // Switch to English
```

### Get Current Language
```typescript
const { language } = useLanguageStore()
console.log(language) // 'en' or 'hi'
```

### Check if Translation Exists
```typescript
const t = useTranslation(language)
const text = t.section?.key || 'Fallback text'
```

## Support

For adding new languages:
1. Create new translation file (e.g., `lib/translations/es.ts` for Spanish)
2. Add language to Language type in `language-store.ts`
3. Import and add to translations object in `lib/translations/index.ts`
4. Add language option to Settings page selector

## Notes

- Language preference is saved in localStorage
- Language persists across sessions
- Changing language updates entire app immediately
- No page refresh required
- Works with both client and server components (use 'use client' directive)
