'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { DataTable } from '../components/DataTable'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AlertsManagementPage() {
    const router = useRouter()

    const { data: alertsResponse } = useQuery({
        queryKey: ['admin', 'alerts'],
        queryFn: async () => {
            return await apiClient.getAdminAlerts()
        },
    })

    // Extract alerts array from API response: { success: true, data: { alerts: [] } }
    const alertData = alertsResponse?.data?.alerts || []

    const columns = [
        {
            header: 'User',
            accessorKey: 'user.name',
            cell: (row: any) => (
                <div>
                    <p className="font-medium">{row.user?.name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">{row.user?.email}</p>
                </div>
            ),
        },
        {
            header: 'Type',
            accessorKey: 'alertType',
            cell: (row: any) => <Badge variant="outline">{row.alertType}</Badge>,
        },
        {
            header: 'Message',
            accessorKey: 'message',
            cell: (row: any) => (
                <p className="text-sm text-muted-foreground line-clamp-2">{row.message}</p>
            ),
        },
        {
            header: 'Disaster',
            accessorKey: 'disaster.title',
            cell: (row: any) => row.disaster?.title || '-',
        },
        {
            header: 'Status',
            accessorKey: 'isRead',
            cell: (row: any) => (
                <Badge variant={row.isRead ? 'default' : 'destructive'}>
                    {row.isRead ? 'Read' : 'Unread'}
                </Badge>
            ),
        },
        {
            header: 'Sent',
            accessorKey: 'createdAt',
            cell: (row: any) => new Date(row.createdAt).toLocaleString(),
        },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Alert Management</h1>
                    <p className="text-muted-foreground">View and manage all alerts</p>
                </div>
                <Button onClick={() => router.push('/admin/alerts/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Broadcast Alert
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-2xl font-bold">{alertData.length}</p>
                                <p className="text-xs text-muted-foreground">Total Alerts</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div>
                            <p className="text-2xl font-bold">
                                {alertData.filter((a: any) => !a.isRead).length}
                            </p>
                            <p className="text-xs text-muted-foreground">Unread</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div>
                            <p className="text-2xl font-bold">
                                {alertData.filter((a: any) => a.isRead).length}
                            </p>
                            <p className="text-xs text-muted-foreground">Read</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div>
                            <p className="text-2xl font-bold">
                                {((alertData.filter((a: any) => a.isRead).length / alertData.length) * 100 || 0).toFixed(1)}%
                            </p>
                            <p className="text-xs text-muted-foreground">Read Rate</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Table */}
            <DataTable data={alertData} columns={columns} searchPlaceholder="Search alerts..." />
        </div>
    )
}
