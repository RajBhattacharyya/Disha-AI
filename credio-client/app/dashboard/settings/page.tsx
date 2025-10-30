'use client'

import { useState } from 'react'
import { useAuthStore } from '@/lib/store/auth-store'
import { useLanguageStore, Language } from '@/lib/store/language-store'
import { useTranslation } from '@/lib/translations'
import { useUpdateNotificationPreferences } from '@/lib/hooks/use-user'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { Bell, Globe, Volume2 } from 'lucide-react'

export default function SettingsPage() {
    const { user } = useAuthStore()
    const { language, setLanguage: setGlobalLanguage } = useLanguageStore()
    const t = useTranslation(language)
    const { toast } = useToast()
    const updatePreferences = useUpdateNotificationPreferences()

    const [notifications, setNotifications] = useState({
        push: true,
        sms: false,
        email: true,
    })

    const [soundEnabled, setSoundEnabled] = useState(true)

    const handleSaveNotifications = () => {
        updatePreferences.mutate(notifications)
    }

    const handleLanguageChange = (newLanguage: Language) => {
        setGlobalLanguage(newLanguage)
        toast({
            title: t.settings.languageChanged,
            description: `Language changed to ${newLanguage === 'en' ? 'English' : 'हिंदी'}`,
        })
        // Optionally update user preference on server
        // apiClient.updateUserProfile(user?.id, { preferredLanguage: newLanguage })
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">{t.settings.title}</h1>
                <p className="text-muted-foreground">{t.settings.subtitle}</p>
            </div>

            {/* Notifications */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        {t.settings.notifications}
                    </CardTitle>
                    <CardDescription>Choose how you want to receive alerts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="push">Push Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                                Receive alerts on your device
                            </p>
                        </div>
                        <Switch
                            id="push"
                            checked={notifications.push}
                            onCheckedChange={(checked: boolean) =>
                                setNotifications({ ...notifications, push: checked })
                            }
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="sms">SMS Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                                Receive critical alerts via text message
                            </p>
                        </div>
                        <Switch
                            id="sms"
                            checked={notifications.sms}
                            onCheckedChange={(checked: boolean) =>
                                setNotifications({ ...notifications, sms: checked })
                            }
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="email">Email Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                                Receive daily summary and updates
                            </p>
                        </div>
                        <Switch
                            id="email"
                            checked={notifications.email}
                            onCheckedChange={(checked: boolean) =>
                                setNotifications({ ...notifications, email: checked })
                            }
                        />
                    </div>

                    <Button onClick={handleSaveNotifications} disabled={updatePreferences.isPending}>
                        Save Preferences
                    </Button>
                </CardContent>
            </Card>

            {/* Language */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        {t.settings.language}
                    </CardTitle>
                    <CardDescription>{t.settings.languageDescription}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>{t.settings.selectLanguage}</Label>
                            <Select value={language} onValueChange={(value) => handleLanguageChange(value as Language)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="en">{t.settings.english} (English)</SelectItem>
                                    <SelectItem value="hi">{t.settings.hindi} (हिंदी)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button>Update Language</Button>
                    </div>
                </CardContent>
            </Card>

            {/* Sound */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Volume2 className="h-5 w-5" />
                        Sound
                    </CardTitle>
                    <CardDescription>Control alert sounds</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="sound">Alert Sounds</Label>
                            <p className="text-sm text-muted-foreground">
                                Play sounds for emergency alerts
                            </p>
                        </div>
                        <Switch
                            id="sound"
                            checked={soundEnabled}
                            onCheckedChange={setSoundEnabled}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    <CardDescription>Irreversible actions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full">
                        Delete All Chat History
                    </Button>
                    <Button variant="destructive" className="w-full">
                        Delete Account
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
