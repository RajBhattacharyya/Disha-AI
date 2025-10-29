'use client'

import { useState } from 'react'
import { useDisasters } from '@/lib/hooks/use-disasters'
import { DisasterCard } from '@/components/disasters/DisasterCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Shield, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DisastersPage() {
  const router = useRouter()
  const [filters, setFilters] = useState({
    status: 'ACTIVE',
    severity: '',
    type: '',
    search: '',
  })

  const { data: response, isLoading } = useDisasters({
    status: filters.status as any,
    severity: filters.severity || undefined,
    type: filters.type || undefined,
  })

  const disasters = response?.disasters || []

  // Filter by search
  const filteredDisasters = disasters.filter((d: any) =>
    filters.search
      ? d.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        d.location.address.toLowerCase().includes(filters.search.toLowerCase())
      : true
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Disasters</h1>
        <p className="text-muted-foreground">Track and monitor disaster events</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search disasters..."
                  className="pl-9"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="MONITORING">Monitoring</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Severity</Label>
              <Select value={filters.severity} onValueChange={(v) => setFilters({ ...filters, severity: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={filters.type} onValueChange={(v) => setFilters({ ...filters, type: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="EARTHQUAKE">Earthquake</SelectItem>
                  <SelectItem value="FLOOD">Flood</SelectItem>
                  <SelectItem value="FIRE">Fire</SelectItem>
                  <SelectItem value="HURRICANE">Hurricane</SelectItem>
                  <SelectItem value="TORNADO">Tornado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : filteredDisasters.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDisasters.map((disaster: any) => (
            <DisasterCard
              key={disaster.id}
              disaster={disaster}
              distance={disaster.distance}
              onViewDetails={() => router.push(`/disasters/${disaster.id}`)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No disasters found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
