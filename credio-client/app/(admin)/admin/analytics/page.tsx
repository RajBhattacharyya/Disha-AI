'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts'
import { useState } from 'react'
import { TrendingUp, Users, AlertCircle, Bell } from 'lucide-react'

const COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#8b5cf6', '#ec4899']

export default function AnalyticsPage() {
    const [timeRange, setTimeRange] = useState('30d')

    const { data: analyticsResponse, isLoading } = useQuery({
        queryKey: ['admin', 'analytics', timeRange],
        queryFn: async () => {
            const response = await apiClient.getAdminAnalyticsOverview(timeRange)
            console.log('Analytics overview response:', response)
            return response
        },
    })

    const { data: disasterAnalyticsResponse } = useQuery({
        queryKey: ['admin', 'analytics', 'disasters', timeRange],
        queryFn: async () => {
            const response = await apiClient.getAdminDisasterAnalytics(timeRange)
            console.log('Disaster analytics response:', response)
            return response
        },
    })

    const { data: sosAnalyticsResponse } = useQuery({
        queryKey: ['admin', 'analytics', 'sos', timeRange],
        queryFn: async () => {
            const response = await apiClient.getAdminSOSAnalytics(timeRange)
            console.log('SOS analytics response:', response)
            return response
        },
    })

    // Extract data from API responses
    const analytics = analyticsResponse?.data || analyticsResponse || {}
    const disasterAnalytics = disasterAnalyticsResponse?.data || disasterAnalyticsResponse || {}
    const sosAnalytics = sosAnalyticsResponse?.data || sosAnalyticsResponse || {}

    if (isLoading) {
        return <AnalyticsSkeleton />
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
                    <p className="text-muted-foreground">Platform insights and metrics</p>
                </div>
                <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-40">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7d">Last 7 days</SelectItem>
                        <SelectItem value="30d">Last 30 days</SelectItem>
                        <SelectItem value="90d">Last 90 days</SelectItem>
                        <SelectItem value="1y">Last year</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Summary Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Users"
                    value={analytics?.totalUsers || 0}
                    change="+12.5%"
                    icon={<Users className="h-4 w-4" />}
                />
                <StatCard
                    title="Active Disasters"
                    value={analytics?.activeDisasters || 0}
                    change="-8.2%"
                    icon={<AlertCircle className="h-4 w-4" />}
                    trend="down"
                />
                <StatCard
                    title="SOS Requests"
                    value={analytics?.totalSOS || 0}
                    change="+23.1%"
                    icon={<TrendingUp className="h-4 w-4" />}
                />
                <StatCard
                    title="Alerts Sent"
                    value={analytics?.totalAlerts || 0}
                    change="+15.3%"
                    icon={<Bell className="h-4 w-4" />}
                />
            </div>

            {/* Charts */}
            <Tabs defaultValue="disasters">
                <TabsList>
                    <TabsTrigger value="disasters">Disasters</TabsTrigger>
                    <TabsTrigger value="sos">SOS Requests</TabsTrigger>
                    <TabsTrigger value="users">Users</TabsTrigger>
                    <TabsTrigger value="alerts">Alerts</TabsTrigger>
                </TabsList>

                {/* Disasters Tab */}
                <TabsContent value="disasters" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Disasters Over Time */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Disasters Over Time</CardTitle>
                                <CardDescription>Total disasters by day</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={disasterAnalytics?.overTime || []}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Area
                                            type="monotone"
                                            dataKey="count"
                                            stroke="#ef4444"
                                            fill="#ef4444"
                                            fillOpacity={0.3}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Disasters by Type */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Disasters by Type</CardTitle>
                                <CardDescription>Distribution of disaster types</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={disasterAnalytics?.byType || []}
                                            dataKey="count"
                                            nameKey="type"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={100}
                                            label
                                        >
                                            {(disasterAnalytics?.byType || []).map((_: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Disasters by Severity */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Disasters by Severity</CardTitle>
                                <CardDescription>Severity distribution</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={disasterAnalytics?.bySeverity || []}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="severity" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#ef4444" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Most Affected Regions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Most Affected Regions</CardTitle>
                                <CardDescription>Top 5 regions by disaster count</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart
                                        data={disasterAnalytics?.topRegions || []}
                                        layout="horizontal"
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" />
                                        <YAxis dataKey="region" type="category" width={100} />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#3b82f6" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* SOS Tab */}
                <TabsContent value="sos" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* SOS Over Time */}
                        <Card>
                            <CardHeader>
                                <CardTitle>SOS Requests Over Time</CardTitle>
                                <CardDescription>Daily SOS request count</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={sosAnalytics?.overTime || []}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="pending" stroke="#ef4444" name="Pending" />
                                        <Line type="monotone" dataKey="resolved" stroke="#22c55e" name="Resolved" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* SOS by Emergency Type */}
                        <Card>
                            <CardHeader>
                                <CardTitle>SOS by Emergency Type</CardTitle>
                                <CardDescription>Distribution of emergency types</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={sosAnalytics?.byType || []}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="type" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#f97316" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Average Response Time */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Average Response Time</CardTitle>
                                <CardDescription>Response time trends (minutes)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={sosAnalytics?.responseTime || []}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="avgMinutes" stroke="#8b5cf6" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* SOS Status Distribution */}
                        <Card>
                            <CardHeader>
                                <CardTitle>SOS Status Distribution</CardTitle>
                                <CardDescription>Current status breakdown</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={sosAnalytics?.byStatus || []}
                                            dataKey="count"
                                            nameKey="status"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={100}
                                            label
                                        >
                                            {(sosAnalytics?.byStatus || []).map((_: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Users Tab */}
                <TabsContent value="users" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>User Growth</CardTitle>
                                <CardDescription>New user registrations over time</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={analytics?.userGrowth || []}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Area
                                            type="monotone"
                                            dataKey="total"
                                            stroke="#3b82f6"
                                            fill="#3b82f6"
                                            fillOpacity={0.3}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Active Users</CardTitle>
                                <CardDescription>Daily active users</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={analytics?.activeUsers || []}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Alerts Tab */}
                <TabsContent value="alerts" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Alerts Sent</CardTitle>
                                <CardDescription>Alert delivery over time</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={analytics?.alertsSent || []}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Area
                                            type="monotone"
                                            dataKey="count"
                                            stroke="#eab308"
                                            fill="#eab308"
                                            fillOpacity={0.3}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Alert Delivery Rate</CardTitle>
                                <CardDescription>Success vs failed delivery</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={analytics?.alertDelivery || []}
                                            dataKey="count"
                                            nameKey="status"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={100}
                                            label
                                        >
                                            <Cell fill="#22c55e" />
                                            <Cell fill="#ef4444" />
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}

function StatCard({
    title,
    value,
    change,
    icon,
    trend = 'up',
}: {
    title: string
    value: number
    change: string
    icon: React.ReactNode
    trend?: 'up' | 'down'
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value.toLocaleString()}</div>
                <p className={`text-xs ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {change} from last period
                </p>
            </CardContent>
        </Card>
    )
}

function AnalyticsSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-20" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-32" />
                ))}
            </div>
            <Skeleton className="h-96" />
        </div>
    )
}
