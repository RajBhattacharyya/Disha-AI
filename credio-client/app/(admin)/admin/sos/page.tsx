'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { socket } from '@/lib/websocket'
import { SOSMap } from '../components/SOSMap'
import { DataTable } from '../components/DataTable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { AlertTriangle, Filter, Map, List, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AdminSOSPage() {
    const router = useRouter()
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const [filters, setFilters] = useState({
        status: '',
        severity: '',
        emergencyType: '',
        search: '',
    })

    const { data: sosData, isLoading } = useQuery({
        queryKey: ['admin', 'sos', filters],
        queryFn: async () => {
            try {
                const params: any = {}
                if (filters.status) params.status = filters.status
                if (filters.severity) params.severity = filters.severity
                if (filters.emergencyType) params.emergencyType = filters.emergencyType

                const response = await apiClient.getAdminSOSRequests(params)
                console.log('Admin SOS response:', response)
                // Return the data array, ensuring it's never undefined
                return response?.data?.sosRequests || response?.sosRequests || []
            } catch (error) {
                console.error('Error fetching SOS requests:', error)
                return [] // Return empty array on error
            }
        },
        refetchInterval: 15000, // Refresh every 15 seconds
    })

    // Real-time WebSocket updates
    useEffect(() => {
        if (!socket) return

        const handleNewSOS = (sos: any) => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'sos'] })

            // Play alert sound for critical SOS
            if (sos.severity === 'CRITICAL') {
                playAlertSound()
                toast({
                    title: '🚨 Critical SOS Request',
                    description: `${sos.emergencyType} at ${sos.location?.address}`,
                    variant: 'destructive',
                    duration: 10000,
                })
            }
        }

        const handleSOSUpdated = (sos: any) => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'sos'] })
        }

        socket.on('admin:new-sos', handleNewSOS)
        socket.on('admin:sos-updated', handleSOSUpdated)

        return () => {
            if (!socket) return
            socket.off('admin:new-sos', handleNewSOS)
            socket.off('admin:sos-updated', handleSOSUpdated)
        }
    }, [queryClient, toast])

    const sosRequests = sosData || []
    console.log('SOS Requests data:', sosRequests)
    console.log('SOS Requests count:', sosRequests.length)

    const filteredSOS = sosRequests.filter((sos: any) =>
        filters.search
            ? sos.user?.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
            sos.location?.address?.toLowerCase().includes(filters.search.toLowerCase())
            : true
    )

    const pendingCount = sosRequests.filter((s: any) => s.status === 'PENDING').length

    const columns = [
        {
            header: 'User',
            accessorKey: 'user.name',
            cell: (row: any) => row.user?.name || 'Unknown',
        },
        {
            header: 'Emergency Type',
            accessorKey: 'emergencyType',
        },
        {
            header: 'Severity',
            accessorKey: 'severity',
            cell: (row: any) => (
                <Badge variant={row.severity === 'CRITICAL' ? 'destructive' : 'default'}>
                    {row.severity}
                </Badge>
            ),
        },
        {
            header: 'Status',
            accessorKey: 'status',
            cell: (row: any) => (
                <Badge
                    variant={
                        row.status === 'PENDING'
                            ? 'destructive'
                            : row.status === 'RESOLVED'
                                ? 'default'
                                : 'secondary'
                    }
                >
                    {row.status}
                </Badge>
            ),
        },
        {
            header: 'Location',
            accessorKey: 'location.address',
            cell: (row: any) => (
                <span className="text-sm text-muted-foreground">{row.location?.address}</span>
            ),
        },
        {
            header: 'Time',
            accessorKey: 'createdAt',
            cell: (row: any) => new Date(row.createdAt).toLocaleString(),
        },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">SOS Monitoring</h1>
                    <p className="text-muted-foreground">
                        Real-time emergency request tracking ({sosRequests.length} total)
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'sos'] })}
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <Badge variant="destructive" className="text-lg px-4 py-2">
                        {pendingCount} Pending
                    </Badge>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid gap-4 md:grid-cols-5">
                        <Input
                            placeholder="Search by name or location..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        />

                        <Select value={filters.status || "all"} onValueChange={(v) => setFilters({ ...filters, status: v === "all" ? "" : v })}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="DISPATCHED">Dispatched</SelectItem>
                                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                <SelectItem value="RESOLVED">Resolved</SelectItem>
                                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={filters.severity || "all"} onValueChange={(v) => setFilters({ ...filters, severity: v === "all" ? "" : v })}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Severity" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Severity</SelectItem>
                                <SelectItem value="LOW">Low</SelectItem>
                                <SelectItem value="MEDIUM">Medium</SelectItem>
                                <SelectItem value="HIGH">High</SelectItem>
                                <SelectItem value="CRITICAL">Critical</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.emergencyType || "all"}
                            onValueChange={(v) => setFilters({ ...filters, emergencyType: v === "all" ? "" : v })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="MEDICAL">Medical</SelectItem>
                                <SelectItem value="FIRE">Fire</SelectItem>
                                <SelectItem value="TRAPPED">Trapped</SelectItem>
                                <SelectItem value="INJURY">Injury</SelectItem>
                                <SelectItem value="NATURAL_DISASTER">Natural Disaster</SelectItem>
                                <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button
                            variant="outline"
                            onClick={() => setFilters({ status: '', severity: '', emergencyType: '', search: '' })}
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Clear
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="map">
                <TabsList>
                    <TabsTrigger value="map">
                        <Map className="h-4 w-4 mr-2" />
                        Map View
                    </TabsTrigger>
                    <TabsTrigger value="list">
                        <List className="h-4 w-4 mr-2" />
                        List View
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="map" className="h-[600px] mt-4">
                    <SOSMap sosRequests={filteredSOS} />
                </TabsContent>

                <TabsContent value="list" className="mt-4">
                    <DataTable
                        data={filteredSOS}
                        columns={columns}
                        onRowClick={(sos) => router.push(`/admin/sos/${sos.id}`)}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}

function playAlertSound() {
    if (typeof Audio !== 'undefined') {
        try {
            const audio = new Audio('/sounds/critical-alert.mp3')
            audio.volume = 0.7
            audio.play().catch((err) => console.log('Could not play alert sound:', err))
        } catch (error) {
            console.error('Error playing alert sound:', error)
        }
    }
}
