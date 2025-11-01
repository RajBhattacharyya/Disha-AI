'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { Checkbox } from '@/components/ui/checkbox'
import { useAuthStore } from '@/lib/store/auth-store'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Shield, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function RegisterPage() {
    const router = useRouter()
    const { toast } = useToast()
    const { setUser } = useAuthStore()

    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        agreeToTerms: false,
    })

    const [errors, setErrors] = useState<Record<string, string>>({})

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        if (formData.name.length < 2) {
            newErrors.name = 'Name must be at least 2 characters'
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email address'
        }

        if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters'
        }

        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
            newErrors.password =
                'Password must contain uppercase, lowercase, and number'
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match'
        }

        if (!formData.agreeToTerms) {
            newErrors.terms = 'You must agree to the terms'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        setIsLoading(true)

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: formData.name,
                        email: formData.email,
                        phoneNumber: formData.phoneNumber || undefined,
                        password: formData.password,
                    }),
                }
            )

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error?.message || 'Registration failed')
            }

            // Store user and token
            setUser(data.data.user, data.data.token)

            // Store token in cookie
            document.cookie = `auth-token=${data.data.token}; path=/; max-age=604800`

            toast({
                title: 'Account created!',
                description: "Welcome to Disha AI. Let's get you set up.",
            })

            router.push('/dashboard')
            router.refresh()
        } catch (error: any) {
            toast({
                title: 'Registration failed',
                description: error.message || 'Something went wrong. Please try again.',
                variant: 'destructive',
            })
        } finally {
            setIsLoading(false)
        }
    }

    // Password strength indicator
    const getPasswordStrength = () => {
        const { password } = formData
        if (password.length < 8) return { label: 'Weak', color: 'bg-red-500', width: '33%' }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password))
            return { label: 'Fair', color: 'bg-yellow-500', width: '66%' }
        return { label: 'Strong', color: 'bg-green-500', width: '100%' }
    }

    const passwordStrength = formData.password ? getPasswordStrength() : null

    return (
        <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-gradient-to-br from-background to-muted">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <Shield className="h-12 w-12 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Create your account</CardTitle>
                    <CardDescription>Join Disha AI to stay safe during disasters</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                disabled={isLoading}
                                autoComplete="name"
                            />
                            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                disabled={isLoading}
                                autoComplete="email"
                            />
                            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">
                                Phone Number <span className="text-muted-foreground">(Optional)</span>
                            </Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="+1 (555) 000-0000"
                                value={formData.phoneNumber}
                                onChange={(e) =>
                                    setFormData({ ...formData, phoneNumber: e.target.value })
                                }
                                disabled={isLoading}
                                autoComplete="tel"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                disabled={isLoading}
                                autoComplete="new-password"
                            />
                            {passwordStrength && (
                                <div className="space-y-1">
                                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${passwordStrength.color} transition-all duration-300`}
                                            style={{ width: passwordStrength.width }}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Strength: {passwordStrength.label}
                                    </p>
                                </div>
                            )}
                            {errors.password && (
                                <p className="text-sm text-destructive">{errors.password}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={(e) =>
                                    setFormData({ ...formData, confirmPassword: e.target.value })
                                }
                                disabled={isLoading}
                                autoComplete="new-password"
                            />
                            {errors.confirmPassword && (
                                <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                            )}
                            {formData.confirmPassword &&
                                formData.password === formData.confirmPassword && (
                                    <div className="flex items-center gap-2 text-sm text-green-600">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Passwords match
                                    </div>
                                )}
                        </div>

                        <div className="flex items-start space-x-2">
                            <Checkbox
                                id="terms"
                                checked={formData.agreeToTerms}
                                onCheckedChange={(checked) =>
                                    setFormData({ ...formData, agreeToTerms: checked as boolean })
                                }
                                disabled={isLoading}
                                className="mt-1"
                            />
                            <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed">
                                I agree to the{' '}
                                <Link href="/terms" className="text-primary hover:underline">
                                    Terms of Service
                                </Link>{' '}
                                and{' '}
                                <Link href="/privacy" className="text-primary hover:underline">
                                    Privacy Policy
                                </Link>
                            </label>
                        </div>
                        {errors.terms && <p className="text-sm text-destructive">{errors.terms}</p>}

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <span className="text-muted-foreground">Already have an account? </span>
                        <Link href="/login" className="text-primary hover:underline font-medium">
                            Log in
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
