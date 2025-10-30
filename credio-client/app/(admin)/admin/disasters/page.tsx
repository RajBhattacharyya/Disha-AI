'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { DataTable } from '../components/DataTable'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { Plus, Trash2, Edit } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DisastersManagementPage() {
    const router = useRouter()
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const [filters, setFilters] = useState({
        status: '',
        type: '',
        severity: '',
        search: '',
    })
    const [deleteId, setDeleteId] = useState<string | null>(null)

    const { data: disastersResponse } = useQuery({
        queryKey: ['admin', 'disasters', filters],
        queryFn: async () => {
            const params: any = {}
            if (filters.status) params.status = filters.status
            if (filters.type) params.type = filters.type
            if (filters.severity) params.severity = filters.severity

            const response = await apiClient.getAdminDisasters(params)
            console.log('Disasters API response:', response)
            return response
        },
    })

    const deleteDisaster = useMutation({
        mutationFn: async (id: string) => {
            return apiClient.deleteAdminDisaster(id)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'disasters'] })
            toast({ description: 'Disaster deleted successfully' })
            setDeleteId(null)
        },
        onError: () => {
            toast({
                title: 'Delete Failed',
                description: 'Unable to delete disaster',
                variant: 'destructive',
            })
        },
    })

    // Extract disasters from API response: { success: true, data: { disasters: [] } }
    const disasterData = disastersResponse?.data?.disasters || disastersResponse?.disasters || []
    console.log('Disasters data:', disasterData)

    const filteredDisasters = disasterData.filter((disaster: any) =>
        filters.search
            ? disaster.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
            disaster.location?.address?.toLowerCase().includes(filters.search.toLowerCase())
            : true
    )

    const columns = [
        {
            header: 'Title',
            accessorKey: 'title',
            cell: (row: any) => (
                <div>
                    <p className="font-medium">{row.title}</p>
                    <p className="text-xs text-muted-foreground">{row.type}</p>
                </div>
            ),
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
                        row.status === 'ACTIVE' ? 'destructive' : row.status === 'RESOLVED' ? 'default' : 'secondary'
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
            header: 'Affected Users',
            accessorKey: 'affectedUsersCount',
            cell: (row: any) => row.affectedUsersCount || 0,
        },
        {
            header: 'Created',
            accessorKey: 'createdAt',
            cell: (row: any) => new Date(row.createdAt).toLocaleDateString(),
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
                            router.push(`/admin/disasters/${row.id}`)
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
                            setDeleteId(row.id)
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
                    <h1 className="text-3xl font-bold">Disaster Management</h1>
                    <p className="text-muted-foreground">Create and manage disaster events</p>
                </div>
                <Button onClick={() => router.push('/admin/disasters/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Disaster
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid gap-4 md:grid-cols-4">
                        <Input
                            placeholder="Search disasters..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        />

                        <Select value={filters.status || "all"} onValueChange={(v) => setFilters({ ...filters, status: v === "all" ? "" : v })}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="ACTIVE">Active</SelectItem>
                                <SelectItem value="MONITORING">Monitoring</SelectItem>
                                <SelectItem value="RESOLVED">Resolved</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={filters.type || "all"} onValueChange={(v) => setFilters({ ...filters, type: v === "all" ? "" : v })}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="EARTHQUAKE">Earthquake</SelectItem>
                                <SelectItem value="FLOOD">Flood</SelectItem>
                                <SelectItem value="FIRE">Fire</SelectItem>
                                <SelectItem value="HURRICANE">Hurricane</SelectItem>
                                <SelectItem value="TORNADO">Tornado</SelectItem>
                                <SelectItem value="TSUNAMI">Tsunami</SelectItem>
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
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <DataTable
                data={filteredDisasters}
                columns={columns}
                onRowClick={(disaster) => router.push(`/admin/disasters/${disaster.id}`)}
                searchPlaceholder="Search by title or location..."
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Disaster?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the disaster event and all
                            associated alerts.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteId && deleteDisaster.mutate(deleteId)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
