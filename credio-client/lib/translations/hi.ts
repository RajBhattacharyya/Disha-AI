import { TranslationKeys } from './en'

export const hi: TranslationKeys = {
    // Common
    common: {
        loading: 'लोड हो रहा है...',
        save: 'सहेजें',
        cancel: 'रद्द करें',
        delete: 'हटाएं',
        edit: 'संपादित करें',
        create: 'बनाएं',
        update: 'अपडेट करें',
        search: 'खोजें',
        filter: 'फ़िल्टर',
        refresh: 'रीफ्रेश करें',
        back: 'वापस',
        next: 'अगला',
        submit: 'जमा करें',
        close: 'बंद करें',
    },

    // Navigation
    nav: {
        dashboard: 'डैशबोर्ड',
        disasters: 'आपदाएं',
        aiAssistant: 'AI सहायक',
        map: 'नक्शा',
        emergency: 'आपातकाल',
        sos: 'SOS',
        resources: 'संसाधन',
        alerts: 'अलर्ट',
        profile: 'प्रोफ़ाइल',
        settings: 'सेटिंग्स',
        logout: 'लॉग आउट',
        login: 'लॉग इन',
        register: 'साइन अप',
    },

    // Dashboard
    dashboard: {
        title: 'डैशबोर्ड',
        welcome: 'वापसी पर स्वागत है',
        activeDisasters: 'सक्रिय आपदाएं',
        recentAlerts: 'हाल के अलर्ट',
        nearbyResources: 'आस-पास के संसाधन',
        quickActions: 'त्वरित कार्य',
    },

    // SOS
    sos: {
        title: 'आपातकालीन SOS',
        activate: 'SOS सक्रिय करें',
        description: 'आपातकाल की स्थिति में, आपातकालीन सेवाओं को तुरंत सूचित करने के लिए SOS बटन दबाएं।',
        locationPermission: 'सटीक आपातकालीन प्रतिक्रिया के लिए आपसे अपना स्थान साझा करने के लिए कहा जाएगा।',
        confirmTitle: 'आपातकालीन SOS सक्रिय करें?',
        confirmMessage: 'यह तुरंत आपातकालीन सेवाओं, आस-पास के उत्तरदाताओं और आपके आपातकालीन संपर्कों को सूचित करेगा।',
        onlyEmergencies: 'केवल वास्तविक आपात स्थितियों में उपयोग करें।',
        activated: 'SOS सक्रिय',
        activatedMessage: 'आपातकालीन सेवाओं और आस-पास के उत्तरदाताओं को सूचित कर दिया गया है। मदद आ रही है।',
        failed: 'SOS विफल',
        failedMessage: 'SOS भेजने में असमर्थ। कृपया सीधे आपातकालीन सेवाओं को कॉल करें।',
    },

    // Settings
    settings: {
        title: 'सेटिंग्स',
        subtitle: 'अपने खाते और प्राथमिकताओं को प्रबंधित करें',
        profile: 'प्रोफ़ाइल',
        notifications: 'सूचनाएं',
        language: 'भाषा',
        security: 'सुरक्षा',
        selectLanguage: 'भाषा चुनें',
        languageDescription: 'अपनी पसंदीदा भाषा चुनें',
        english: 'अंग्रेज़ी',
        hindi: 'हिंदी',
        languageChanged: 'भाषा सफलतापूर्वक बदल गई',
    },

    // Admin
    admin: {
        dashboard: 'एडमिन डैशबोर्ड',
        sosMonitoring: 'SOS निगरानी',
        userManagement: 'उपयोगकर्ता प्रबंधन',
        disasterManagement: 'आपदा प्रबंधन',
        analytics: 'विश्लेषण',
        totalUsers: 'कुल उपयोगकर्ता',
        activeDisasters: 'सक्रिय आपदाएं',
        pendingSOS: 'लंबित SOS',
        alertsSent: 'भेजे गए अलर्ट',
    },
}
