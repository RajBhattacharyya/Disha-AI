'use client'

import { useAuthStore } from '@/lib/store/auth-store'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { AdminSidebar } from './admin/components/AdminSidebar'
import { Toaster } from '@/components/ui/toaster'
import { Shield, AlertTriangle } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user } = useAuthStore()
    const router = useRouter()

    // Debug logging
    useEffect(() => {
        console.log('Admin Layout - User:', user)
        console.log('Admin Layout - User Role:', user?.role)
        console.log('Admin Layout - Is Admin?:', user?.role === 'ADMIN')
    }, [user])

    useEffect(() => {
        if (!user || user.role !== 'ADMIN') {
            console.log('Access denied - redirecting to dashboard')
            router.push('/dashboard')
        }
    }, [user, router])

    if (!user || user.role !== 'ADMIN') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center space-y-4">
                    <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
                    <h2 className="text-2xl font-bold">Access Denied</h2>
                    <p className="text-muted-foreground">You don't have permission to access this area.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen overflow-hidden">
            <AdminSidebar />
            <main className="flex-1 overflow-y-auto bg-muted/20">
                <div className="p-8">{children}</div>
            </main>
            <Toaster />
        </div>
    )
}
