"use client"

import React, { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Mail } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api'

const Profile: React.FC = () => {
    const { toast } = useToast()

    // Email from stored user_data
    const email = useMemo(() => {
        try {
            const raw = localStorage.getItem('user_data')
            if (!raw) return ''
            const user = JSON.parse(raw)
            return user?.email || ''
        } catch {
            return ''
        }
    }, [])

    // Form state
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [changing, setChanging] = useState(false)

    // Visibility toggles
    const [showCurrent, setShowCurrent] = useState(false)
    const [showNew, setShowNew] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast({ title: 'Error', description: 'Fill all password fields.', variant: 'destructive' })
            return
        }
        if (newPassword.length < 6) {
            toast({ title: 'Error', description: 'New password must be at least 6 characters.', variant: 'destructive' })
            return
        }
        if (newPassword !== confirmPassword) {
            toast({ title: 'Error', description: 'New passwords do not match.', variant: 'destructive' })
            return
        }
        try {
            setChanging(true)
            const res: any = await api.post('/change-password', {
                current_password: currentPassword,
                new_password: newPassword
            })
            if (res.status === 'success') {
                toast({ title: 'Password Updated', description: 'Please sign in again.' })
                // Clear session & caches then redirect to login
                localStorage.removeItem('access_token')
                localStorage.removeItem('user_data')
                localStorage.removeItem('supabase_refresh_token')
                localStorage.removeItem('supabase_session_id')
                localStorage.removeItem('supabase_user_id')
                localStorage.removeItem('meallensai_user_access_status')
                localStorage.removeItem('meallensai_trial_start')
                localStorage.removeItem('meallensai_subscription_status')
                localStorage.removeItem('meallensai_subscription_expires_at')
                window.location.href = '/login'
            } else {
                toast({ title: 'Error', description: res.message || 'Failed to update password.', variant: 'destructive' })
            }
        } catch (e: any) {
            toast({ title: 'Error', description: e?.message || 'Failed to update password.', variant: 'destructive' })
        } finally {
            setChanging(false)
        }
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Profile</h1>
                    <p className="text-muted-foreground mt-2">Manage your account details
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Account</CardTitle>
                        <CardDescription>View your email and update your password.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input id="email" value={email} disabled className="pl-9" />
                            </div>
                        </div>

                        {/* Passwords stacked vertically */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="current-password">Current Password</Label>
                                <div className="relative">
                                    <Input
                                        id="current-password"
                                        type={showCurrent ? 'text' : 'password'}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrent((v) => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                        aria-label={showCurrent ? 'Hide password' : 'Show password'}
                                    >
                                        {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <div className="relative">
                                    <Input
                                        id="new-password"
                                        type={showNew ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNew((v) => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                        aria-label={showNew ? 'Hide password' : 'Show password'}
                                    >
                                        {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm New Password</Label>
                                <div className="relative">
                                    <Input
                                        id="confirm-password"
                                        type={showConfirm ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm((v) => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                        aria-label={showConfirm ? 'Hide password' : 'Show password'}
                                    >
                                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <Button className="w-full" onClick={handleChangePassword} disabled={changing}>
                            {changing ? 'Updating...' : 'Update Password'}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default Profile


