'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
    AlertCircle,
    CheckCircle,
    Clock,
    MapPin,
    Phone,
    User,
    ArrowLeft,
    Navigation
} from 'lucide-react'
import { apiClient } from '@/lib/api-client'

interface SOSTracking {
    id: string
    status: 'PENDING' | 'DISPATCHED' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED'
    emergencyType: string
    severity: string
    description: string
    location: {
        latitude: number
        longitude: number
        address: string
    }
    createdAt: string
    updatedAt: string
    responder?: {
        name: string
        phone: string
        role: string
    }
    estimatedArrival?: string
    notes?: string
}

export default function EmergencyTrackingPage() {
    const params = useParams()
    const router = useRouter()
    const [tracking, setTracking] = useState<SOSTracking | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchTracking()
        // Poll for updates every 10 seconds
        const interval = setInterval(fetchTracking, 10000)
        return () => clearInterval(interval)
    }, [params.id])

    const fetchTracking = async () => {
        try {
            const response = await apiClient.getSOSTracking(params.id as string)
            setTracking(response.data.sos)
            setError(null)
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to load tracking information')
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING':
                return 'bg-yellow-500'
            case 'DISPATCHED':
                return 'bg-blue-500'
            case 'IN_PROGRESS':
                return 'bg-orange-500'
            case 'RESOLVED':
                return 'bg-green-500'
            case 'CANCELLED':
                return 'bg-gray-500'
            default:
                return 'bg-gray-500'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PENDING':
                return <Clock className="w-5 h-5" />
            case 'DISPATCHED':
            case 'IN_PROGRESS':
                return <AlertCircle className="w-5 h-5" />
            case 'RESOLVED':
                return <CheckCircle className="w-5 h-5" />
            default:
                return <AlertCircle className="w-5 h-5" />
        }
    }

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'CRITICAL':
                return 'bg-red-500'
            case 'HIGH':
                return 'bg-orange-500'
            case 'MEDIUM':
                return 'bg-yellow-500'
            case 'LOW':
                return 'bg-blue-500'
            default:
                return 'bg-gray-500'
        }
    }

    const openInMaps = () => {
        if (tracking) {
            window.open(
                `https://www.google.com/maps/dir/?api=1&destination=${tracking.location.latitude},${tracking.location.longitude}`,
                '_blank'
            )
        }
    }

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading tracking information...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (error || !tracking) {
        return (
            <div className="container mx-auto p-6">
                <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error || 'SOS request not found'}</AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
            </Button>

            <div className="space-y-6">
                {/* Status Header */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-2xl">Emergency Tracking</CardTitle>
                            <Badge className={getStatusColor(tracking.status)}>
                                <span className="flex items-center gap-2">
                                    {getStatusIcon(tracking.status)}
                                    {tracking.status}
                                </span>
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Emergency Type</p>
                                <p className="font-semibold">{tracking.emergencyType.replace('_', ' ')}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Severity</p>
                                <Badge className={getSeverityColor(tracking.severity)}>
                                    {tracking.severity}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Request ID</p>
                                <p className="text-xs font-mono">{tracking.id}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Created</p>
                                <p className="text-sm">{new Date(tracking.createdAt).toLocaleString()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Status Timeline */}
                <Card>
                    <CardHeader>
                        <CardTitle>Status Updates</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {tracking.status === 'PENDING' && (
                                <Alert>
                                    <Clock className="h-4 w-4" />
                                    <AlertDescription>
                                        Your emergency request is pending. Help is being dispatched.
                                    </AlertDescription>
                                </Alert>
                            )}
                            {tracking.status === 'DISPATCHED' && (
                                <Alert className="border-blue-500">
                                    <AlertCircle className="h-4 w-4 text-blue-500" />
                                    <AlertDescription>
                                        Emergency responders have been dispatched to your location.
                                        {tracking.estimatedArrival && (
                                            <span className="block mt-1 font-semibold">
                                                Estimated arrival: {tracking.estimatedArrival}
                                            </span>
                                        )}
                                    </AlertDescription>
                                </Alert>
                            )}
                            {tracking.status === 'IN_PROGRESS' && (
                                <Alert className="border-orange-500">
                                    <AlertCircle className="h-4 w-4 text-orange-500" />
                                    <AlertDescription>
                                        Responders are on scene and providing assistance.
                                    </AlertDescription>
                                </Alert>
                            )}
                            {tracking.status === 'RESOLVED' && (
                                <Alert className="border-green-500">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <AlertDescription>
                                        Emergency has been resolved. Stay safe!
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Responder Information */}
                {tracking.responder && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Responder Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <User className="w-5 h-5 text-gray-500" />
                                    <div>
                                        <p className="text-sm text-gray-500">Name</p>
                                        <p className="font-semibold">{tracking.responder.name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Phone className="w-5 h-5 text-gray-500" />
                                    <div>
                                        <p className="text-sm text-gray-500">Contact</p>
                                        <a
                                            href={`tel:${tracking.responder.phone}`}
                                            className="font-semibold text-blue-600 hover:underline"
                                        >
                                            {tracking.responder.phone}
                                        </a>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge variant="outline">{tracking.responder.role}</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Location */}
                <Card>
                    <CardHeader>
                        <CardTitle>Location</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-gray-500 mt-1" />
                                <div className="flex-1">
                                    <p className="font-medium">{tracking.location.address}</p>
                                    <p className="text-sm text-gray-500">
                                        {tracking.location.latitude.toFixed(6)}, {tracking.location.longitude.toFixed(6)}
                                    </p>
                                </div>
                            </div>
                            <Button onClick={openInMaps} className="w-full">
                                <Navigation className="w-4 h-4 mr-2" />
                                Open in Maps
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Description */}
                {tracking.description && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-700">{tracking.description}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Notes */}
                {tracking.notes && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Additional Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-700">{tracking.notes}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Emergency Contacts */}
                <Card className="border-red-500">
                    <CardHeader>
                        <CardTitle className="text-red-600">Emergency Contacts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <a
                                href="tel:911"
                                className="flex items-center justify-between p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                            >
                                <span className="font-semibold">Emergency Services</span>
                                <span className="text-red-600 font-bold">911</span>
                            </a>
                            <p className="text-xs text-gray-500 mt-2">
                                If your situation worsens, call 911 immediately
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
