export const en = {
    // Common
    common: {
        loading: 'Loading...',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        create: 'Create',
        update: 'Update',
        search: 'Search',
        filter: 'Filter',
        refresh: 'Refresh',
        back: 'Back',
        next: 'Next',
        submit: 'Submit',
        close: 'Close',
    },

    // Navigation
    nav: {
        dashboard: 'Dashboard',
        disasters: 'Disasters',
        aiAssistant: 'AI Assistant',
        map: 'Map',
        emergency: 'Emergency',
        sos: 'SOS',
        resources: 'Resources',
        alerts: 'Alerts',
        profile: 'Profile',
        settings: 'Settings',
        logout: 'Logout',
        login: 'Log In',
        register: 'Sign Up',
    },

    // Dashboard
    dashboard: {
        title: 'Dashboard',
        welcome: 'Welcome back',
        activeDisasters: 'Active Disasters',
        recentAlerts: 'Recent Alerts',
        nearbyResources: 'Nearby Resources',
        quickActions: 'Quick Actions',
    },

    // SOS
    sos: {
        title: 'Emergency SOS',
        activate: 'Activate SOS',
        description: 'In case of emergency, press the SOS button to immediately alert emergency services.',
        locationPermission: 'You will be asked to share your location for accurate emergency response.',
        confirmTitle: 'Activate Emergency SOS?',
        confirmMessage: 'This will immediately notify emergency services, nearby responders, and your emergency contacts.',
        onlyEmergencies: 'Only use in genuine emergencies.',
        activated: 'SOS Activated',
        activatedMessage: 'Emergency services and nearby responders have been notified. Help is on the way.',
        failed: 'SOS Failed',
        failedMessage: 'Unable to send SOS. Please call emergency services directly.',
    },

    // Settings
    settings: {
        title: 'Settings',
        subtitle: 'Manage your account and preferences',
        profile: 'Profile',
        notifications: 'Notifications',
        language: 'Language',
        security: 'Security',
        selectLanguage: 'Select Language',
        languageDescription: 'Choose your preferred language',
        english: 'English',
        hindi: 'Hindi',
        languageChanged: 'Language changed successfully',
    },

    // Admin
    admin: {
        dashboard: 'Admin Dashboard',
        sosMonitoring: 'SOS Monitoring',
        userManagement: 'User Management',
        disasterManagement: 'Disaster Management',
        analytics: 'Analytics',
        totalUsers: 'Total Users',
        activeDisasters: 'Active Disasters',
        pendingSOS: 'Pending SOS',
        alertsSent: 'Alerts Sent',
    },
}

export type TranslationKeys = typeof en
