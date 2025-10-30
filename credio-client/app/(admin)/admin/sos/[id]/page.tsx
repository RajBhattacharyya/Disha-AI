'use client'

import { useState, use } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import {
    AlertTriangle,
    MapPin,
    Clock,
    User,
    Phone,
    Mail,
    Navigation,
    CheckCircle,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'

export default function SOSDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const [notes, setNotes] = useState('')

    // Unwrap params Promise
    const { id } = use(params)

    const { data: sos, isLoading } = useQuery({
        queryKey: ['admin', 'sos', id],
        queryFn: async () => {
            const response = await apiClient.getAdminSOSDetails(id)
            console.log('SOS Detail response:', response)
            // Extract from nested response structure
            return response?.data?.sos || response?.sos
        },
    })

    const { data: responders } = useQuery({
        queryKey: ['admin', 'responders'],
        queryFn: async () => {
            const response = await apiClient.getAdminUsers({ role: 'RESPONDER' })
            console.log('Responders response:', response)
            // Extract from nested response structure
            return response?.data?.users || response?.users || []
        },
    })

    const assignResponder = useMutation({
        mutationFn: async (responderId: string) => {
            return apiClient.assignSOSResponder(id, responderId)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'sos'] })
            toast({ description: 'Responder assigned successfully' })
        },
    })

    const updateStatus = useMutation({
        mutationFn: async ({ status, notes }: { status: string; notes?: string }) => {
            return apiClient.updateAdminSOSStatus(id, status, notes)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'sos'] })
            toast({ description: 'SOS status updated' })
            setNotes('')
        },
    })

    if (isLoading) {
        return <SOSDetailSkeleton />
    }

    if (!sos) {
        return (
            <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <p className="text-lg font-medium">SOS request not found</p>
                <Button className="mt-4" onClick={() => router.push('/admin/sos')}>
                    Back to SOS List
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">SOS Request Details</h1>
                    <p className="text-muted-foreground">ID: {sos.id}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge
                        variant={
                            sos.status === 'PENDING'
                                ? 'destructive'
                                : sos.status === 'RESOLVED'
                                    ? 'default'
                                    : 'secondary'
                        }
                        className="text-lg px-4 py-2"
                    >
                        {sos.status}
                    </Badge>
                    <Badge variant="outline" className="text-lg px-4 py-2">
                        {sos.severity}
                    </Badge>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* User Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            User Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <p className="text-sm font-medium">{sos.user?.name || 'Unknown'}</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Phone</Label>
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <a href={`tel:${sos.user?.phoneNumber}`} className="text-sm hover:underline">
                                    {sos.user?.phoneNumber || 'Not provided'}
                                </a>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <a href={`mailto:${sos.user?.email}`} className="text-sm hover:underline">
                                    {sos.user?.email}
                                </a>
                            </div>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                            <Label>Emergency Contacts</Label>
                            {sos.user?.emergencyContacts && sos.user.emergencyContacts.length > 0 ? (
                                <div className="space-y-2">
                                    {sos.user.emergencyContacts.map((contact: any, idx: number) => (
                                        <div key={idx} className="text-sm border p-2 rounded">
                                            <p className="font-medium">{contact.name}</p>
                                            <p className="text-muted-foreground">{contact.phone}</p>
                                            <Badge variant="outline" className="mt-1">
                                                {contact.relationship}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No emergency contacts</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Emergency Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Emergency Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Emergency Type</Label>
                            <p className="text-sm font-medium">{sos.emergencyType}</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Severity</Label>
                            <Badge variant={sos.severity === 'CRITICAL' ? 'destructive' : 'default'}>
                                {sos.severity}
                            </Badge>
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <p className="text-sm">{sos.description || 'No description provided'}</p>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                            <Label>Time</Label>
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <p className="text-sm">
                                    {formatDistanceToNow(new Date(sos.createdAt), { addSuffix: true })}
                                </p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {new Date(sos.createdAt).toLocaleString()}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Location */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            Location
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Address</Label>
                            <p className="text-sm">{sos.location?.address || 'Unknown location'}</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Coordinates</Label>
                            <p className="text-sm text-muted-foreground">
                                {sos.location?.latitude?.toFixed(6)}, {sos.location?.longitude?.toFixed(6)}
                            </p>
                        </div>
                        <Button
                            className="w-full"
                            variant="outline"
                            onClick={() => {
                                window.open(
                                    `https://www.google.com/maps/dir/?api=1&destination=${sos.location?.latitude},${sos.location?.longitude}`,
                                    '_blank'
                                )
                            }}
                        >
                            <Navigation className="mr-2 h-4 w-4" />
                            Get Directions
                        </Button>
                    </CardContent>
                </Card>

                {/* Responder Assignment */}
                <Card>
                    <CardHeader>
                        <CardTitle>Responder Management</CardTitle>
                        <CardDescription>Assign and manage responders</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {sos.responder ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 p-3 border rounded-lg">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <div>
                                        <p className="font-medium">{sos.responder.name}</p>
                                        <p className="text-sm text-muted-foreground">{sos.responder.phoneNumber}</p>
                                    </div>
                                </div>
                                <Badge variant="default">Assigned</Badge>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <Label>Assign Responder</Label>
                                <Select
                                    onValueChange={(value) => assignResponder.mutate(value)}
                                    disabled={assignResponder.isPending}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select responder..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {responders?.map((responder: any) => (
                                            <SelectItem key={responder.id} value={responder.id}>
                                                {responder.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <Separator />

                        <div className="space-y-4">
                            <Label>Update Status</Label>
                            <div className="grid gap-2">
                                {['DISPATCHED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'].map((status) => (
                                    <Button
                                        key={status}
                                        variant={sos.status === status ? 'default' : 'outline'}
                                        className="w-full"
                                        onClick={() => updateStatus.mutate({ status, notes })}
                                        disabled={updateStatus.isPending || sos.status === status}
                                    >
                                        {status.replace('_', ' ')}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Add Notes</Label>
                            <Textarea
                                placeholder="Add status update notes..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Media */}
            {sos.mediaUrls && sos.mediaUrls.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Media Attachments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                            {sos.mediaUrls.map((url: string, idx: number) => (
                                <img
                                    key={idx}
                                    src={url}
                                    alt={`Media ${idx + 1}`}
                                    className="rounded-lg border"
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Timeline */}
            {sos.responderNotes && (
                <Card>
                    <CardHeader>
                        <CardTitle>Timeline & Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm whitespace-pre-wrap">{sos.responderNotes}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

function SOSDetailSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-20" />
            <div className="grid gap-6 md:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-96" />
                ))}
            </div>
        </div>
    )
}
