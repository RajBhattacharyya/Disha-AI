'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/lib/store/auth-store'
import { apiClient } from '@/lib/api-client'
import {
    Settings as SettingsIcon,
    Bell,
    Shield,
    Database,
    Mail,
    Globe,
    Save,
} from 'lucide-react'

export default function AdminSettingsPage() {
    const { toast } = useToast()
    const { user } = useAuthStore()
    const queryClient = useQueryClient()

    // Profile settings
    const [profileData, setProfileData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phoneNumber: user?.phoneNumber || '',
    })

    // Notification settings
    const [notificationSettings, setNotificationSettings] = useState({
        emailAlerts: true,
        smsAlerts: false,
        pushNotifications: true,
        weeklyReports: true,
        criticalOnly: false,
    })

    // System settings
    const [systemSettings, setSystemSettings] = useState({
        maintenanceMode: false,
        autoBackup: true,
        backupFrequency: 'daily',
        dataRetention: '90',
        maxUploadSize: '10',
    })

    const updateProfile = useMutation({
        mutationFn: async (data: any) => {
            if (user?.id) {
                return apiClient.updateAdminUserInfo(user.id, data)
            }
            throw new Error('User ID not found')
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'user'] })
            toast({ description: 'Profile updated successfully' })
        },
        onError: () => {
            toast({
                title: 'Update Failed',
                description: 'Unable to update profile',
                variant: 'destructive',
            })
        },
    })

    const handleSaveProfile = () => {
        updateProfile.mutate(profileData)
    }

    const handleSaveNotifications = () => {
        toast({ description: 'Notification settings saved' })
    }

    const handleSaveSystem = () => {
        toast({ description: 'System settings saved' })
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground">Manage your admin account and system preferences</p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    <TabsTrigger value="system">System</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <SettingsIcon className="h-5 w-5" />
                                Profile Information
                            </CardTitle>
                            <CardDescription>
                                Update your personal information and contact details
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="profile-name">Full Name</Label>
                                <Input
                                    id="profile-name"
                                    value={profileData.name}
                                    onChange={(e) =>
                                        setProfileData({ ...profileData, name: e.target.value })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="profile-email">Email</Label>
                                <Input
                                    id="profile-email"
                                    type="email"
                                    value={profileData.email}
                                    onChange={(e) =>
                                        setProfileData({ ...profileData, email: e.target.value })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="profile-phone">Phone Number</Label>
                                <Input
                                    id="profile-phone"
                                    value={profileData.phoneNumber}
                                    onChange={(e) =>
                                        setProfileData({ ...profileData, phoneNumber: e.target.value })
                                    }
                                />
                            </div>
                            <Separator />
                            <div className="flex justify-end">
                                <Button onClick={handleSaveProfile} disabled={updateProfile.isPending}>
                                    <Save className="h-4 w-4 mr-2" />
                                    {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Role & Permissions</CardTitle>
                            <CardDescription>Your current role and access level</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Administrator</p>
                                    <p className="text-sm text-muted-foreground">
                                        Full access to all system features
                                    </p>
                                </div>
                                <Shield className="h-8 w-8 text-primary" />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="h-5 w-5" />
                                Notification Preferences
                            </CardTitle>
                            <CardDescription>
                                Configure how you receive alerts and updates
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Email Alerts</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Receive email notifications for important events
                                    </p>
                                </div>
                                <Switch
                                    checked={notificationSettings.emailAlerts}
                                    onCheckedChange={(checked) =>
                                        setNotificationSettings({
                                            ...notificationSettings,
                                            emailAlerts: checked,
                                        })
                                    }
                                />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>SMS Alerts</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Get text messages for critical alerts
                                    </p>
                                </div>
                                <Switch
                                    checked={notificationSettings.smsAlerts}
                                    onCheckedChange={(checked) =>
                                        setNotificationSettings({
                                            ...notificationSettings,
                                            smsAlerts: checked,
                                        })
                                    }
                                />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Push Notifications</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Browser push notifications for real-time updates
                                    </p>
                                </div>
                                <Switch
                                    checked={notificationSettings.pushNotifications}
                                    onCheckedChange={(checked) =>
                                        setNotificationSettings({
                                            ...notificationSettings,
                                            pushNotifications: checked,
                                        })
                                    }
                                />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Weekly Reports</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Receive weekly summary reports via email
                                    </p>
                                </div>
                                <Switch
                                    checked={notificationSettings.weeklyReports}
                                    onCheckedChange={(checked) =>
                                        setNotificationSettings({
                                            ...notificationSettings,
                                            weeklyReports: checked,
                                        })
                                    }
                                />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Critical Only</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Only receive notifications for critical events
                                    </p>
                                </div>
                                <Switch
                                    checked={notificationSettings.criticalOnly}
                                    onCheckedChange={(checked) =>
                                        setNotificationSettings({
                                            ...notificationSettings,
                                            criticalOnly: checked,
                                        })
                                    }
                                />
                            </div>
                            <Separator />
                            <div className="flex justify-end">
                                <Button onClick={handleSaveNotifications}>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Preferences
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* System Tab */}
                <TabsContent value="system" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Database className="h-5 w-5" />
                                System Configuration
                            </CardTitle>
                            <CardDescription>
                                Manage system-wide settings and configurations
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Maintenance Mode</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Temporarily disable public access to the system
                                    </p>
                                </div>
                                <Switch
                                    checked={systemSettings.maintenanceMode}
                                    onCheckedChange={(checked) =>
                                        setSystemSettings({
                                            ...systemSettings,
                                            maintenanceMode: checked,
                                        })
                                    }
                                />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Automatic Backups</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Enable automatic database backups
                                    </p>
                                </div>
                                <Switch
                                    checked={systemSettings.autoBackup}
                                    onCheckedChange={(checked) =>
                                        setSystemSettings({ ...systemSettings, autoBackup: checked })
                                    }
                                />
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                <Label htmlFor="data-retention">Data Retention (days)</Label>
                                <Input
                                    id="data-retention"
                                    type="number"
                                    value={systemSettings.dataRetention}
                                    onChange={(e) =>
                                        setSystemSettings({
                                            ...systemSettings,
                                            dataRetention: e.target.value,
                                        })
                                    }
                                />
                                <p className="text-sm text-muted-foreground">
                                    How long to keep historical data before archiving
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="max-upload">Max Upload Size (MB)</Label>
                                <Input
                                    id="max-upload"
                                    type="number"
                                    value={systemSettings.maxUploadSize}
                                    onChange={(e) =>
                                        setSystemSettings({
                                            ...systemSettings,
                                            maxUploadSize: e.target.value,
                                        })
                                    }
                                />
                                <p className="text-sm text-muted-foreground">
                                    Maximum file size for uploads
                                </p>
                            </div>
                            <Separator />
                            <div className="flex justify-end">
                                <Button onClick={handleSaveSystem}>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Settings
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Security Settings
                            </CardTitle>
                            <CardDescription>Manage your account security</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Change Password</Label>
                                <p className="text-sm text-muted-foreground mb-2">
                                    Update your password to keep your account secure
                                </p>
                                <Button variant="outline">Change Password</Button>
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                <Label>Two-Factor Authentication</Label>
                                <p className="text-sm text-muted-foreground mb-2">
                                    Add an extra layer of security to your account
                                </p>
                                <Button variant="outline">Enable 2FA</Button>
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                <Label>Active Sessions</Label>
                                <p className="text-sm text-muted-foreground mb-2">
                                    Manage devices where you're currently logged in
                                </p>
                                <Button variant="outline">View Sessions</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-destructive">Danger Zone</CardTitle>
                            <CardDescription>Irreversible actions</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Clear All Cache</p>
                                    <p className="text-sm text-muted-foreground">
                                        Clear system cache and temporary files
                                    </p>
                                </div>
                                <Button variant="destructive" size="sm">
                                    Clear Cache
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
