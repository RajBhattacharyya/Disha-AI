'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, AlertTriangle, AlertCircle, Bell } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AdminDashboardPage() {
    const { data: statsResponse, isLoading } = useQuery({
        queryKey: ['admin', 'stats'],
        queryFn: async () => {
            const response = await apiClient.getAdminStats()
            console.log('Admin stats response:', response)
            return response
        },
        refetchInterval: 30000, // Refresh every 30 seconds
    })

    const { data: sosResponse } = useQuery({
        queryKey: ['admin', 'recent-sos'],
        queryFn: () => apiClient.getAdminSOSRequests({ limit: 5 }),
        refetchInterval: 15000,
    })

    const { data: disasterResponse } = useQuery({
        queryKey: ['admin', 'recent-disasters'],
        queryFn: () => apiClient.getAdminDisasters({ limit: 5 }),
    })

    // Extract data from API responses
    // Axios interceptor already unwraps response.data, so we get { success, data: {...} }
    const stats = statsResponse?.data || statsResponse || {}
    const recentSOS = sosResponse?.data?.sosRequests || sosResponse?.sosRequests || []
    const recentDisasters = disasterResponse?.data?.disasters || disasterResponse?.disasters || []

    // Debug logging
    console.log('Stats response:', statsResponse)
    console.log('Stats data:', stats)
    console.log('Total users:', stats?.totalUsers)

    if (isLoading) {
        return <DashboardSkeleton />
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-muted-foreground">Monitor and manage the Disha AI platform</p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Total Users"
                    value={stats?.totalUsers || 0}
                    icon={<Users className="h-4 w-4" />}
                    description="+12% from last month"
                />
                <StatsCard
                    title="Active Disasters"
                    value={stats?.activeDisasters || 0}
                    icon={<AlertCircle className="h-4 w-4" />}
                    description="Requires attention"
                    variant="destructive"
                />
                <StatsCard
                    title="Pending SOS"
                    value={stats?.pendingSOS || 0}
                    icon={<AlertTriangle className="h-4 w-4" />}
                    description="Awaiting response"
                    variant="warning"
                />
                <StatsCard
                    title="Alerts (24h)"
                    value={stats?.alertsSent24h || 0}
                    icon={<Bell className="h-4 w-4" />}
                    description="Successfully delivered"
                />
            </div>

            {/* Recent SOS Requests */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Recent SOS Requests</CardTitle>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/admin/sos">View All</Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {recentSOS && recentSOS.length > 0 ? (
                        <div className="space-y-3">
                            {recentSOS.map((sos: any) => (
                                <div
                                    key={sos.id}
                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium">{sos.user?.name}</p>
                                            <Badge
                                                variant={
                                                    sos.status === 'PENDING'
                                                        ? 'destructive'
                                                        : sos.status === 'RESOLVED'
                                                            ? 'default'
                                                            : 'secondary'
                                                }
                                            >
                                                {sos.status}
                                            </Badge>
                                            <Badge variant="outline">{sos.severity}</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{sos.emergencyType}</p>
                                        <p className="text-xs text-muted-foreground">{sos.location?.address}</p>
                                    </div>
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={`/admin/sos/${sos.id}`}>View</Link>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">No recent SOS requests</p>
                    )}
                </CardContent>
            </Card>

            {/* Recent Disasters */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Active Disasters</CardTitle>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/admin/disasters">Manage</Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {recentDisasters && recentDisasters.length > 0 ? (
                        <div className="space-y-3">
                            {recentDisasters.map((disaster: any) => (
                                <div
                                    key={disaster.id}
                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium">{disaster.title}</p>
                                            <Badge variant={disaster.severity === 'CRITICAL' ? 'destructive' : 'default'}>
                                                {disaster.severity}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{disaster.type}</p>
                                        <p className="text-xs text-muted-foreground">{disaster.location?.address}</p>
                                    </div>
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={`/admin/disasters/${disaster.id}`}>Edit</Link>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">No active disasters</p>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

function StatsCard({
    title,
    value,
    icon,
    description,
    variant,
}: {
    title: string
    value: number
    icon: React.ReactNode
    description?: string
    variant?: 'default' | 'destructive' | 'warning'
}) {
    const colorClass =
        variant === 'destructive'
            ? 'text-destructive'
            : variant === 'warning'
                ? 'text-orange-500'
                : 'text-muted-foreground'

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className={colorClass}>{icon}</div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value.toLocaleString()}</div>
                {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
            </CardContent>
        </Card>
    )
}

function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-20" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-32" />
                ))}
            </div>
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
        </div>
    )
}
