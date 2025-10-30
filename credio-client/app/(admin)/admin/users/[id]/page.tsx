'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
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
import {
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Shield,
    AlertTriangle,
    Bell,
    ArrowLeft,
    UserCog,
    Ban,
    CheckCircle,
} from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

export default function UserDetailsPage() {
    const router = useRouter()
    const params = useParams()
    const userId = params.id as string
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const [newRole, setNewRole] = useState('')
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        phoneNumber: '',
    })

    const { data: userResponse, isLoading } = useQuery({
        queryKey: ['admin', 'user', userId],
        queryFn: async () => {
            const response = await apiClient.getAdminUserDetails(userId)
            console.log('User details response:', response)
            return response
        },
    })

    const updateRole = useMutation({
        mutationFn: async (role: string) => {
            return apiClient.updateAdminUserRole(userId, role)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'user', userId] })
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
            toast({ description: 'User role updated successfully' })
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
        mutationFn: async (isBanned: boolean) => {
            return apiClient.banAdminUser(userId, isBanned, 'Banned by admin')
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'user', userId] })
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
            toast({ description: 'User status updated' })
        },
    })

    const updateUser = useMutation({
        mutationFn: async (data: { name: string; email: string; phoneNumber: string }) => {
            return apiClient.updateAdminUserInfo(userId, data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'user', userId] })
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
            toast({ description: 'User information updated successfully' })
            setShowEditDialog(false)
        },
        onError: () => {
            toast({
                title: 'Update Failed',
                description: 'Unable to update user information',
                variant: 'destructive',
            })
        },
    })

    const user = userResponse?.data?.user || userResponse?.user

    // Initialize edit form when user data loads
    const handleOpenEditDialog = () => {
        if (user) {
            setEditForm({
                name: user.name || '',
                email: user.email || '',
                phoneNumber: user.phoneNumber || '',
            })
            setShowEditDialog(true)
        }
    }

    const handleUpdateUser = () => {
        updateUser.mutate(editForm)
    }

    if (isLoading) {
        return <UserDetailsSkeleton />
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <AlertTriangle className="h-12 w-12 text-muted-foreground" />
                <h2 className="text-2xl font-bold">User Not Found</h2>
                <Button onClick={() => router.push('/admin/users')}>Back to Users</Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/admin/users')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">{user.name}</h1>
                        <p className="text-muted-foreground">{user.email}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleOpenEditDialog}>
                        <UserCog className="h-4 w-4 mr-2" />
                        Edit Info
                    </Button>
                    <Badge
                        variant={
                            user.role === 'ADMIN'
                                ? 'destructive'
                                : user.role === 'RESPONDER'
                                    ? 'default'
                                    : 'secondary'
                        }
                    >
                        {user.role}
                    </Badge>
                    {user.isVerified && (
                        <Badge variant="outline" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Verified
                        </Badge>
                    )}
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
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="h-4 w-4" />
                                Email
                            </div>
                            <p className="font-medium">{user.email}</p>
                        </div>

                        {user.phoneNumber && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Phone className="h-4 w-4" />
                                    Phone
                                </div>
                                <p className="font-medium">{user.phoneNumber}</p>
                            </div>
                        )}

                        {user.location?.address && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <MapPin className="h-4 w-4" />
                                    Location
                                </div>
                                <p className="font-medium">{user.location.address}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                Joined
                            </div>
                            <p className="font-medium">
                                {new Date(user.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Role Management */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Role & Permissions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Current Role</label>
                            <Select
                                value={newRole || user.role}
                                onValueChange={(value) => {
                                    setNewRole(value)
                                    updateRole.mutate(value)
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="USER">User</SelectItem>
                                    <SelectItem value="RESPONDER">Responder</SelectItem>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Account Status</label>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => banUser.mutate(true)}
                                    disabled={banUser.isPending}
                                >
                                    <Ban className="h-4 w-4 mr-2" />
                                    Ban User
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Activity Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">SOS Requests</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{user._count?.sosRequests || 0}</div>
                        <p className="text-xs text-muted-foreground">Total requests made</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Alerts Received</CardTitle>
                        <Bell className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{user._count?.alerts || 0}</div>
                        <p className="text-xs text-muted-foreground">Total alerts received</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Chat Sessions</CardTitle>
                        <User className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{user._count?.chatSessions || 0}</div>
                        <p className="text-xs text-muted-foreground">AI assistant conversations</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            {user.sosRequests && user.sosRequests.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Recent SOS Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {user.sosRequests.slice(0, 5).map((sos: any) => (
                                <div
                                    key={sos.id}
                                    className="flex items-center justify-between p-3 border rounded-lg"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">{sos.emergencyType}</Badge>
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
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(sos.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={`/admin/sos/${sos.id}`}>View</Link>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Edit User Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User Information</DialogTitle>
                        <DialogDescription>
                            Update the user's basic information
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Name</Label>
                            <Input
                                id="edit-name"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                placeholder="Enter name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-email">Email</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                value={editForm.email}
                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                placeholder="Enter email"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-phone">Phone Number</Label>
                            <Input
                                id="edit-phone"
                                type="tel"
                                value={editForm.phoneNumber}
                                onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                                placeholder="Enter phone number"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpdateUser}
                            disabled={updateUser.isPending}
                        >
                            {updateUser.isPending ? 'Updating...' : 'Update User'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function UserDetailsSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-20" />
            <div className="grid gap-6 md:grid-cols-2">
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
            </div>
        </div>
    )
}
