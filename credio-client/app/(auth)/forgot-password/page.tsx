'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Shield, Mail, ArrowLeft } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function ForgotPasswordPage() {
    const { toast } = useToast()
    const [isLoading, setIsLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [isSubmitted, setIsSubmitted] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/auth/forgot-password`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                }
            )

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error?.message || 'Failed to send reset email')
            }

            setIsSubmitted(true)
            toast({
                title: 'Reset link sent!',
                description: 'Check your email for password reset instructions.',
            })
        } catch (error: any) {
            toast({
                title: 'Request failed',
                description: error.message || 'Something went wrong. Please try again.',
                variant: 'destructive',
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center px-4 bg-gradient-to-br from-background to-muted">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <Shield className="h-12 w-12 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Forgot your password?</CardTitle>
                    <CardDescription>
                        {isSubmitted
                            ? 'Check your email for reset instructions'
                            : "Enter your email and we'll send you a reset link"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isSubmitted ? (
                        <div className="space-y-4">
                            <Alert>
                                <Mail className="h-4 w-4" />
                                <AlertDescription>
                                    We've sent password reset instructions to <strong>{email}</strong>.
                                    Please check your inbox and spam folder.
                                </AlertDescription>
                            </Alert>

                            <Button variant="outline" className="w-full" asChild>
                                <Link href="/login">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Login
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    autoComplete="email"
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    'Send Reset Link'
                                )}
                            </Button>

                            <Button variant="ghost" className="w-full" asChild>
                                <Link href="/login">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Login
                                </Link>
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
