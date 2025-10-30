'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
import { ArrowLeft, Save } from 'lucide-react'

export default function CreateDisasterPage() {
    const router = useRouter()
    const { toast } = useToast()
    const queryClient = useQueryClient()

    const [formData, setFormData] = useState({
        type: '',
        severity: '',
        title: '',
        description: '',
        location: {
            latitude: 0,
            longitude: 0,
            address: '',
            radius: 50,
        },
        status: 'ACTIVE',
    })

    const createDisaster = useMutation({
        mutationFn: async (data: any) => {
            return apiClient.createAdminDisaster(data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'disasters'] })
            toast({
                title: 'Success',
                description: 'Disaster created and alerts sent to affected users',
            })
            router.push('/admin/disasters')
        },
        onError: (error: any) => {
            toast({
                title: 'Creation Failed',
                description: error.message || 'Unable to create disaster',
                variant: 'destructive',
            })
        },
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        createDisaster.mutate(formData)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">Create Disaster Event</h1>
                    <p className="text-muted-foreground">Add a new disaster to the system</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                        <CardDescription>Disaster type and severity</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="type">Disaster Type *</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(v) => setFormData({ ...formData, type: v })}
                                    required
                                >
                                    <SelectTrigger id="type">
                                        <SelectValue placeholder="Select type..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="EARTHQUAKE">Earthquake</SelectItem>
                                        <SelectItem value="FLOOD">Flood</SelectItem>
                                        <SelectItem value="FIRE">Fire</SelectItem>
                                        <SelectItem value="HURRICANE">Hurricane</SelectItem>
                                        <SelectItem value="TORNADO">Tornado</SelectItem>
                                        <SelectItem value="TSUNAMI">Tsunami</SelectItem>
                                        <SelectItem value="WILDFIRE">Wildfire</SelectItem>
                                        <SelectItem value="CYCLONE">Cyclone</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="severity">Severity *</Label>
                                <Select
                                    value={formData.severity}
                                    onValueChange={(v) => setFormData({ ...formData, severity: v })}
                                    required
                                >
                                    <SelectTrigger id="severity">
                                        <SelectValue placeholder="Select severity..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="LOW">Low</SelectItem>
                                        <SelectItem value="MEDIUM">Medium</SelectItem>
                                        <SelectItem value="HIGH">High</SelectItem>
                                        <SelectItem value="CRITICAL">Critical</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="title">Title *</Label>
                            <Input
                                id="title"
                                placeholder="e.g., Major Earthquake in California"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description *</Label>
                            <Textarea
                                id="description"
                                placeholder="Detailed description of the disaster..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={4}
                                required
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Location */}
                <Card>
                    <CardHeader>
                        <CardTitle>Location</CardTitle>
                        <CardDescription>Disaster epicenter and affected area</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="address">Address *</Label>
                            <Input
                                id="address"
                                placeholder="e.g., Los Angeles, CA, USA"
                                value={formData.location.address}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        location: { ...formData.location, address: e.target.value },
                                    })
                                }
                                required
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="latitude">Latitude *</Label>
                                <Input
                                    id="latitude"
                                    type="number"
                                    step="any"
                                    placeholder="34.0522"
                                    value={formData.location.latitude || ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            location: { ...formData.location, latitude: parseFloat(e.target.value) },
                                        })
                                    }
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="longitude">Longitude *</Label>
                                <Input
                                    id="longitude"
                                    type="number"
                                    step="any"
                                    placeholder="-118.2437"
                                    value={formData.location.longitude || ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            location: { ...formData.location, longitude: parseFloat(e.target.value) },
                                        })
                                    }
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="radius">Affected Radius (km) *</Label>
                                <Input
                                    id="radius"
                                    type="number"
                                    placeholder="50"
                                    value={formData.location.radius || ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            location: { ...formData.location, radius: parseInt(e.target.value) },
                                        })
                                    }
                                    required
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex gap-4">
                    <Button type="submit" disabled={createDisaster.isPending}>
                        <Save className="h-4 w-4 mr-2" />
                        {createDisaster.isPending ? 'Creating...' : 'Create Disaster'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    )
}
