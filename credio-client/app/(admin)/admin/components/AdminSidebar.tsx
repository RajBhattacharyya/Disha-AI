'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/auth-store'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  LayoutDashboard,
  AlertTriangle,
  AlertCircle,
  Users,
  Bell,
  MapPin,
  BarChart3,
  Settings,
  LogOut,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const menuItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/sos', label: 'SOS Requests', icon: AlertTriangle },
  { href: '/admin/disasters', label: 'Disasters', icon: AlertCircle },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/alerts', label: 'Alerts', icon: Bell },
  { href: '/admin/resources', label: 'Resources', icon: MapPin },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <aside className="w-64 border-r bg-card flex flex-col">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-xl font-bold">Credio</h2>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  'flex items-center justify-between gap-3 px-3 py-2 rounded-md transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </div>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-3 mb-3">
          <Avatar>
            <AvatarFallback>{user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <Badge variant="secondary" className="text-xs">
              Admin
            </Badge>
          </div>
        </div>
        <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </aside>
  )
}
