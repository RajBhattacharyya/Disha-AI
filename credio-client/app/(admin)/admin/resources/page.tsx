'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { DataTable } from '../components/DataTable'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Plus, Edit, Trash2, MapPin, Phone } from 'lucide-react'

export default function ResourcesManagementPage() {
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const [showDialog, setShowDialog] = useState(false)
    const [editingResource, setEditingResource] = useState<any>(null)
    const [formData, setFormData] = useState({
        name: '',
        type: '',
        location: {
            latitude: '',
            longitude: '',
            address: '',
        },
        contactPhone: '',
        availability: 'AVAILABLE',
    })

    const { data: resourcesResponse } = useQuery({
        queryKey: ['admin', 'resources'],
        queryFn: async () => {
            // Using emergency resources endpoint
            const response = await apiClient.getEmergencyResources({
                latitude: 0,
                longitude: 0,
                radius: 10000, // Large radius to get all
            })
            console.log('Resources response:', response)
            return response
        },
    })

    const createResource = useMutation({
        mutationFn: async (data: any) => {
            return apiClient.createAdminResource(data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'resources'] })
            toast({ description: 'Resource created successfully' })
            setShowDialog(false)
            resetForm()
        },
        onError: () => {
            toast({
                title: 'Create Failed',
                description: 'Unable to create resource',
                variant: 'destructive',
            })
        },
    })

    const updateResource = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            return apiClient.updateAdminResource(id, data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'resources'] })
            toast({ description: 'Resource updated successfully' })
            setShowDialog(false)
            resetForm()
        },
        onError: () => {
            toast({
                title: 'Update Failed',
                description: 'Unable to update resource',
                variant: 'destructive',
            })
        },
    })

    const deleteResource = useMutation({
        mutationFn: async (id: string) => {
            return apiClient.deleteAdminResource(id)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'resources'] })
            toast({ description: 'Resource deleted successfully' })
        },
        onError: () => {
            toast({
                title: 'Delete Failed',
                description: 'Unable to delete resource',
                variant: 'destructive',
            })
        },
    })

    const resourcesData = resourcesResponse?.data?.resources || resourcesResponse?.resources || []

    const resetForm = () => {
        setFormData({
            name: '',
            type: '',
            location: {
                latitude: '',
                longitude: '',
                address: '',
            },
            contactPhone: '',
            availability: 'AVAILABLE',
        })
        setEditingResource(null)
    }

    const handleOpenDialog = (resource?: any) => {
        if (resource) {
            setEditingResource(resource)
            setFormData({
                name: resource.name,
                type: resource.type,
                location: {
                    latitude: resource.location?.latitude?.toString() || '',
                    longitude: resource.location?.longitude?.toString() || '',
                    address: resource.location?.address || '',
                },
                contactPhone: resource.contactPhone,
                availability: resource.availability,
            })
        } else {
            resetForm()
        }
        setShowDialog(true)
    }

    const handleSubmit = () => {
        const data = {
            ...formData,
            location: {
                ...formData.location,
                latitude: parseFloat(formData.location.latitude),
                longitude: parseFloat(formData.location.longitude),
            },
        }

        if (editingResource) {
            updateResource.mutate({ id: editingResource.id, data })
        } else {
            createResource.mutate(data)
        }
    }

    const columns = [
        {
            header: 'Name',
            accessorKey: 'name',
            cell: (row: any) => (
                <div>
                    <p className="font-medium">{row.name}</p>
                    <p className="text-xs text-muted-foreground">{row.type}</p>
                </div>
            ),
        },
        {
            header: 'Location',
            accessorKey: 'location.address',
            cell: (row: any) => (
                <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="text-sm">{row.location?.address || 'N/A'}</span>
                </div>
            ),
        },
        {
            header: 'Contact',
            accessorKey: 'contactPhone',
            cell: (row: any) => (
                <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{row.contactPhone}</span>
                </div>
            ),
        },
        {
            header: 'Availability',
            accessorKey: 'availability',
            cell: (row: any) => (
                <Badge
                    variant={
                        row.availability === 'AVAILABLE'
                            ? 'default'
                            : row.availability === 'LIMITED'
                                ? 'secondary'
                                : 'destructive'
                    }
                >
                    {row.availability}
                </Badge>
            ),
        },
        {
            header: 'Actions',
            accessorKey: 'id',
            cell: (row: any) => (
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                            e.stopPropagation()
                            handleOpenDialog(row)
                        }}
                    >
                        <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive"
                        onClick={(e) => {
                            e.stopPropagation()
                            if (confirm('Are you sure you want to delete this resource?')) {
                                deleteResource.mutate(row.id)
                            }
                        }}
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
            ),
        },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Resource Management</h1>
                    <p className="text-muted-foreground">Manage emergency resources and facilities</p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Resource
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{resourcesData.length}</div>
                        <p className="text-xs text-muted-foreground">Total Resources</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-green-600">
                            {resourcesData.filter((r: any) => r.availability === 'AVAILABLE').length}
                        </div>
                        <p className="text-xs text-muted-foreground">Available</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-orange-600">
                            {resourcesData.filter((r: any) => r.availability === 'LIMITED').length}
                        </div>
                        <p className="text-xs text-muted-foreground">Limited</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-red-600">
                            {resourcesData.filter((r: any) => r.availability === 'UNAVAILABLE').length}
                        </div>
                        <p className="text-xs text-muted-foreground">Unavailable</p>
                    </CardContent>
                </Card>
            </div>

            {/* Table */}
            <DataTable data={resourcesData} columns={columns} searchPlaceholder="Search resources..." />

            {/* Create/Edit Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingResource ? 'Edit Resource' : 'Add New Resource'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingResource
                                ? 'Update resource information'
                                : 'Add a new emergency resource or facility'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Resource Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., City Hospital"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="type">Type *</Label>
                                <Input
                                    id="type"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    placeholder="e.g., HOSPITAL, SHELTER"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Address *</Label>
                            <Input
                                id="address"
                                value={formData.location.address}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        location: { ...formData.location, address: e.target.value },
                                    })
                                }
                                placeholder="Full address"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="latitude">Latitude *</Label>
                                <Input
                                    id="latitude"
                                    type="number"
                                    step="any"
                                    value={formData.location.latitude}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            location: { ...formData.location, latitude: e.target.value },
                                        })
                                    }
                                    placeholder="34.0522"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="longitude">Longitude *</Label>
                                <Input
                                    id="longitude"
                                    type="number"
                                    step="any"
                                    value={formData.location.longitude}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            location: { ...formData.location, longitude: e.target.value },
                                        })
                                    }
                                    placeholder="-118.2437"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Contact Phone *</Label>
                                <Input
                                    id="phone"
                                    value={formData.contactPhone}
                                    onChange={(e) =>
                                        setFormData({ ...formData, contactPhone: e.target.value })
                                    }
                                    placeholder="+1234567890"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="availability">Availability *</Label>
                                <Select
                                    value={formData.availability}
                                    onValueChange={(v) => setFormData({ ...formData, availability: v })}
                                >
                                    <SelectTrigger id="availability">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="AVAILABLE">Available</SelectItem>
                                        <SelectItem value="LIMITED">Limited</SelectItem>
                                        <SelectItem value="UNAVAILABLE">Unavailable</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={createResource.isPending || updateResource.isPending}
                        >
                            {createResource.isPending || updateResource.isPending
                                ? 'Saving...'
                                : editingResource
                                    ? 'Update Resource'
                                    : 'Create Resource'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
