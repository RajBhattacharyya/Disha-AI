'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send } from 'lucide-react'

export default function CreateAlertPage() {
    const router = useRouter()
    const { toast } = useToast()
    const queryClient = useQueryClient()

    const [formData, setFormData] = useState({
        alertType: 'WARNING',
        message: '',
        disasterId: '',
        targetRegion: {
            latitude: 0,
            longitude: 0,
            radius: 50,
        },
        targetAll: false,
    })

    const { data: disasters } = useQuery({
        queryKey: ['admin', 'disasters', 'active'],
        queryFn: async () => {
            const response = await apiClient.getAdminDisasters({ status: 'ACTIVE' })
            return response.disasters
        },
    })

    const broadcastAlert = useMutation({
        mutationFn: async (data: any) => {
            return apiClient.broadcastAdminAlert(data)
        },
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'alerts'] })
            toast({
                title: 'Alert Broadcasted',
                description: `Alert sent to ${response.data.alertsSent} users`,
            })
            router.push('/admin/alerts')
        },
        onError: (error: any) => {
            toast({
                title: 'Broadcast Failed',
                description: error.message || 'Unable to send alert',
                variant: 'destructive',
            })
        },
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        const payload: any = {
            alertType: formData.alertType,
            message: formData.message,
        }

        if (formData.disasterId) {
            payload.disasterId = formData.disasterId
        } else if (!formData.targetAll) {
            payload.targetRegion = formData.targetRegion
        }

        broadcastAlert.mutate(payload)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">Broadcast Alert</h1>
                    <p className="text-muted-foreground">Send alerts to users</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
                {/* Alert Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Alert Details</CardTitle>
                        <CardDescription>Configure your alert message</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="alertType">Alert Type *</Label>
                            <Select
                                value={formData.alertType}
                                onValueChange={(v) => setFormData({ ...formData, alertType: v })}
                                required
                            >
                                <SelectTrigger id="alertType">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="WARNING">Warning</SelectItem>
                                    <SelectItem value="EVACUATION">Evacuation</SelectItem>
                                    <SelectItem value="UPDATE">Update</SelectItem>
                                    <SelectItem value="ALL_CLEAR">All Clear</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message">Message *</Label>
                            <Textarea
                                id="message"
                                placeholder="Enter alert message..."
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                rows={5}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                {formData.message.length} / 500 characters
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Target Audience */}
                <Card>
                    <CardHeader>
                        <CardTitle>Target Audience</CardTitle>
                        <CardDescription>Who should receive this alert?</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="disaster">Link to Disaster (Optional)</Label>
                            <Select
                                value={formData.disasterId || "none"}
                                onValueChange={(v) => setFormData({ ...formData, disasterId: v === "none" ? "" : v })}
                            >
                                <SelectTrigger id="disaster">
                                    <SelectValue placeholder="Select disaster..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {disasters?.map((disaster: any) => (
                                        <SelectItem key={disaster.id} value={disaster.id}>
                                            {disaster.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                If selected, alert will be sent to users affected by this disaster
                            </p>
                        </div>

                        {!formData.disasterId && (
                            <>
                                <div className="space-y-2">
                                    <Label>
                                        <input
                                            type="checkbox"
                                            checked={formData.targetAll}
                                            onChange={(e) =>
                                                setFormData({ ...formData, targetAll: e.target.checked })
                                            }
                                            className="mr-2"
                                        />
                                        Broadcast to all users
                                    </Label>
                                </div>

                                {!formData.targetAll && (
                                    <div className="space-y-4 p-4 border rounded-lg">
                                        <p className="text-sm font-medium">Target Region</p>
                                        <div className="grid gap-4 md:grid-cols-3">
                                            <div className="space-y-2">
                                                <Label htmlFor="lat">Latitude</Label>
                                                <Input
                                                    id="lat"
                                                    type="number"
                                                    step="any"
                                                    value={formData.targetRegion.latitude || ''}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            targetRegion: {
                                                                ...formData.targetRegion,
                                                                latitude: parseFloat(e.target.value),
                                                            },
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="lon">Longitude</Label>
                                                <Input
                                                    id="lon"
                                                    type="number"
                                                    step="any"
                                                    value={formData.targetRegion.longitude || ''}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            targetRegion: {
                                                                ...formData.targetRegion,
                                                                longitude: parseFloat(e.target.value),
                                                            },
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="radius">Radius (km)</Label>
                                                <Input
                                                    id="radius"
                                                    type="number"
                                                    value={formData.targetRegion.radius || ''}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            targetRegion: {
                                                                ...formData.targetRegion,
                                                                radius: parseInt(e.target.value),
                                                            },
                                                        })
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex gap-4">
                    <Button type="submit" disabled={broadcastAlert.isPending}>
                        <Send className="h-4 w-4 mr-2" />
                        {broadcastAlert.isPending ? 'Sending...' : 'Broadcast Alert'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    )
}
