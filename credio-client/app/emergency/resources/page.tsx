'use client'

import { useState, useEffect } from 'react'
import { useLocationStore } from '@/lib/store/location-store'
import { useEmergencyResources } from '@/lib/hooks/use-emergency'
import { ResourceList } from '@/components/resources/ResourceList'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { MapPin, Navigation } from 'lucide-react'

export default function ResourcesPage() {
    const { currentLocation, startTracking } = useLocationStore()
    const [filters, setFilters] = useState({
        type: 'all',
        radius: 50,
    })

    const { data: resources, isLoading } = useEmergencyResources({
        latitude: currentLocation?.latitude,
        longitude: currentLocation?.longitude,
        radius: filters.radius,
        type: filters.type !== 'all' ? filters.type : undefined,
    })

    useEffect(() => {
        startTracking()
    }, [startTracking])

    const handleSelectResource = (resource: any) => {
        window.open(
            `https://www.google.com/maps/dir/?api=1&destination=${resource.location.latitude},${resource.location.longitude}`,
            '_blank'
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Emergency Resources</h1>
                <p className="text-muted-foreground">Find shelters, hospitals, and supplies near you</p>
            </div>

            {/* Location Status */}
            {currentLocation ? (
                <Card className="border-green-500">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-green-600">
                            <MapPin className="h-5 w-5" />
                            <div>
                                <p className="font-medium">Location Active</p>
                                <p className="text-sm text-muted-foreground">{currentLocation.address}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-yellow-500">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-yellow-600">
                                <Navigation className="h-5 w-5" />
                                <p className="font-medium">Enable location to find nearby resources</p>
                            </div>
                            <Button onClick={startTracking}>Enable Location</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Resource Type</Label>
                            <Select value={filters.type} onValueChange={(v) => setFilters({ ...filters, type: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="SHELTER">Shelter</SelectItem>
                                    <SelectItem value="HOSPITAL">Hospital</SelectItem>
                                    <SelectItem value="FOOD">Food</SelectItem>
                                    <SelectItem value="WATER">Water</SelectItem>
                                    <SelectItem value="MEDICAL">Medical</SelectItem>
                                    <SelectItem value="POLICE">Police</SelectItem>
                                    <SelectItem value="FIRE_STATION">Fire Station</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Search Radius</Label>
                            <Select
                                value={filters.radius.toString()}
                                onValueChange={(v) => setFilters({ ...filters, radius: parseInt(v) })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10 km</SelectItem>
                                    <SelectItem value="25">25 km</SelectItem>
                                    <SelectItem value="50">50 km</SelectItem>
                                    <SelectItem value="100">100 km</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Resources List */}
            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="h-48" />
                    ))}
                </div>
            ) : resources && resources.length > 0 ? (
                <ResourceList resources={resources} onSelectResource={handleSelectResource} />
            ) : (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-medium">No resources found</p>
                        <p className="text-sm text-muted-foreground">Try increasing the search radius</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
