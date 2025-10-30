'use client'

import { useAuthStore } from '@/lib/store/auth-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function TestAuthPage() {
    const { user, token, isAuthenticated } = useAuthStore()
    const router = useRouter()

    return (
        <div className="container mx-auto p-8">
            <Card>
                <CardHeader>
                    <CardTitle>Auth Store Debug</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h3 className="font-semibold">Is Authenticated:</h3>
                        <p>{isAuthenticated ? 'Yes' : 'No'}</p>
                    </div>

                    <div>
                        <h3 className="font-semibold">Token:</h3>
                        <p className="text-xs break-all">{token || 'None'}</p>
                    </div>

                    <div>
                        <h3 className="font-semibold">User Data:</h3>
                        <pre className="bg-muted p-4 rounded text-xs overflow-auto">
                            {JSON.stringify(user, null, 2)}
                        </pre>
                    </div>

                    <div>
                        <h3 className="font-semibold">User Role:</h3>
                        <p className="text-lg font-bold">{user?.role || 'None'}</p>
                    </div>

                    <div>
                        <h3 className="font-semibold">Is Admin Check:</h3>
                        <p className="text-lg font-bold">
                            {user?.role === 'ADMIN' ? '✅ YES' : '❌ NO'}
                        </p>
                    </div>

                    <div>
                        <h3 className="font-semibold">LocalStorage:</h3>
                        <pre className="bg-muted p-4 rounded text-xs overflow-auto">
                            {typeof window !== 'undefined'
                                ? localStorage.getItem('auth-storage')
                                : 'N/A'}
                        </pre>
                    </div>

                    <div className="flex gap-4">
                        <Button onClick={() => router.push('/admin')}>
                            Try Admin Access
                        </Button>
                        <Button onClick={() => router.push('/dashboard')}>
                            Go to Dashboard
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
