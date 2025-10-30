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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Users, UserCog, Ban, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function UsersManagementPage() {
    const router = useRouter()
    const { toast } = useToast()
    const queryClient = useQueryClient()

    const [filters, setFilters] = useState({
        role: '',
        search: '',
    })

    const [selectedUser, setSelectedUser] = useState<any>(null)
    const [showRoleDialog, setShowRoleDialog] = useState(false)
    const [newRole, setNewRole] = useState('')

    const { data: usersResponse } = useQuery({
        queryKey: ['admin', 'users', filters],
        queryFn: async () => {
            const params: any = {}
            if (filters.role) params.role = filters.role
            if (filters.search) params.search = filters.search

            const response = await apiClient.getAdminUsers(params)
            console.log('Users API response:', response)
            return response
        },
    })

    const updateRole = useMutation({
        mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
            return apiClient.updateAdminUserRole(userId, role)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
            toast({ description: 'User role updated successfully' })
            setShowRoleDialog(false)
            setSelectedUser(null)
        },
        onError: () => {
            toast({
                title: 'Update Failed',
                description: 'Unable to update user role',
                variant: 'destructive',
            })
        },
    })

    const banUser = useMutation({
        mutationFn: async ({ userId, isBanned }: { userId: string; isBanned: boolean }) => {
            return apiClient.banAdminUser(userId, isBanned, 'Banned by admin')
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
            toast({ description: 'User status updated' })
        },
    })

    // Extract users from API response: { success: true, data: { users: [] } }
    const userData = usersResponse?.data?.users || usersResponse?.users || []
    console.log('Users data:', userData)

    const columns = [
        {
            header: 'Name',
            accessorKey: 'name',
            cell: (row: any) => (
                <div>
                    <p className="font-medium">{row.name}</p>
                    <p className="text-xs text-muted-foreground">{row.email}</p>
                </div>
            ),
        },
        {
            header: 'Phone',
            accessorKey: 'phoneNumber',
            cell: (row: any) => row.phoneNumber || '-',
        },
        {
            header: 'Role',
            accessorKey: 'role',
            cell: (row: any) => (
                <Badge
                    variant={
                        row.role === 'ADMIN'
                            ? 'destructive'
                            : row.role === 'RESPONDER'
                                ? 'default'
                                : 'secondary'
                    }
                >
                    {row.role}
                </Badge>
            ),
        },
        {
            header: 'Verified',
            accessorKey: 'isVerified',
            cell: (row: any) => (
                <Badge variant={row.isVerified ? 'default' : 'secondary'}>
                    {row.isVerified ? 'Yes' : 'No'}
                </Badge>
            ),
        },
        {
            header: 'SOS Requests',
            accessorKey: '_count.sosRequests',
            cell: (row: any) => row._count?.sosRequests || 0,
        },
        {
            header: 'Alerts Received',
            accessorKey: '_count.alerts',
            cell: (row: any) => row._count?.alerts || 0,
        },
        {
            header: 'Joined',
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
                            setSelectedUser(row)
                            setNewRole(row.role)
                            setShowRoleDialog(true)
                        }}
                    >
                        <UserCog className="h-3 w-3 mr-1" />
                        Role
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive"
                        onClick={(e) => {
                            e.stopPropagation()
                            banUser.mutate({ userId: row.id, isBanned: true })
                        }}
                    >
                        <Ban className="h-3 w-3" />
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
                    <h1 className="text-3xl font-bold">User Management</h1>
                    <p className="text-muted-foreground">Manage users and their roles</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-lg px-4 py-2">
                        <Users className="h-4 w-4 mr-2" />
                        {userData.length} Users
                    </Badge>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="relative col-span-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or email..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                className="pl-9"
                            />
                        </div>

                        <Select value={filters.role || "all"} onValueChange={(v) => setFilters({ ...filters, role: v === "all" ? "" : v })}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Roles" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                <SelectItem value="USER">User</SelectItem>
                                <SelectItem value="RESPONDER">Responder</SelectItem>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <DataTable
                data={userData}
                columns={columns}
                onRowClick={(user) => router.push(`/admin/users/${user.id}`)}
                searchPlaceholder="Search users..."
            />

            {/* Change Role Dialog */}
            <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change User Role</DialogTitle>
                        <DialogDescription>
                            Update the role for {selectedUser?.name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Current Role</Label>
                            <Badge variant="secondary">{selectedUser?.role}</Badge>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">New Role</Label>
                            <Select value={newRole} onValueChange={setNewRole}>
                                <SelectTrigger id="role">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="USER">User</SelectItem>
                                    <SelectItem value="RESPONDER">Responder</SelectItem>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() =>
                                selectedUser && updateRole.mutate({ userId: selectedUser.id, role: newRole })
                            }
                            disabled={updateRole.isPending}
                        >
                            Update Role
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
