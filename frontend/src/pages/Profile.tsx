"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Mail, ChevronDown } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/utils'

const Profile: React.FC = () => {
    const { toast } = useToast()
    const { user } = useAuth()

    // Email from API
    const [email, setEmail] = useState('')
    const [showProfileDropdown, setShowProfileDropdown] = useState(false)

    // Form state
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [changing, setChanging] = useState(false)

    // Visibility toggles
    const [showCurrent, setShowCurrent] = useState(false)
    const [showNew, setShowNew] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    // Fetch user profile on mount
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                console.log('[Profile] Fetching user profile...')
                const result: any = await api.getUserProfile()
                console.log('[Profile] Profile result:', result)
                
                if (result.status === 'success' && result.profile) {
                    // Use the email from the API response
                    const profileEmail = result.profile.email || result.profile.user?.email
                    if (profileEmail) {
                        console.log('[Profile] Setting email from API:', profileEmail)
                        setEmail(profileEmail)
                    } else {
                        console.warn('[Profile] No email found in profile response')
                    }
                } else {
                    console.warn('[Profile] Profile fetch unsuccessful:', result)
                }
            } catch (error) {
                console.error('[Profile] Error fetching user profile:', error)
                // Fallback to localStorage for migration
                try {
                    const raw = localStorage.getItem('user_data')
                    if (raw) {
                        const user = JSON.parse(raw)
                        const fallbackEmail = user?.email
                        if (fallbackEmail) {
                            console.log('[Profile] Using fallback email from localStorage:', fallbackEmail)
                            setEmail(fallbackEmail)
                        }
                    }
                } catch (err) {
                    console.error('[Profile] Error reading from localStorage:', err)
                }
            }
        }

        fetchProfile()
    }, [])

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
        <div className="min-h-screen bg-[#f8fafc]">
            {/* Header - Matching other pages */}
            <header 
                className="px-8 h-[105px] flex items-center border-b"
                style={{ 
                    backgroundColor: '#F9FBFE',
                    borderColor: '#F6FAFE',
                    boxShadow: '0px 2px 2px rgba(227, 227, 227, 0.25)'
                }}
            >
                <div className="flex items-center justify-between w-full">
                    <h1 className="text-[32px] font-medium text-[#2A2A2A] tracking-[0.03em] leading-[130%]" style={{ fontFamily: "'Work Sans', sans-serif" }}>
                        Profile
                    </h1>
                    
                    {/* Profile Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                            className="flex items-center h-[56px] gap-3 px-5 rounded-[18px] border border-[#E7E7E7] bg-white hover:bg-gray-50 transition-colors"
                        >
                            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 font-semibold text-sm border border-blue-100">
                                {(user?.displayName || user?.email?.split('@')[0] || 'U').substring(0, 2).toUpperCase()}
                            </div>
                            <span className="text-[16px] font-medium text-gray-600 hidden sm:block">
                                {user?.displayName || user?.email?.split('@')[0] || 'User'}
                            </span>
                            <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {showProfileDropdown && (
                            <>
                                <div 
                                    className="fixed inset-0 z-40" 
                                    onClick={() => setShowProfileDropdown(false)}
                                />
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-[15px] shadow-lg border border-gray-200 py-3 z-50">
                                    <a href="/profile" className="block px-5 py-2.5 text-[15px] text-gray-700 hover:bg-gray-50">Profile</a>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="px-8 py-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Subtitle */}
                    <p className="text-gray-600 text-[16px]" style={{ fontFamily: "'Work Sans', sans-serif" }}>
                        Manage your account details
                    </p>

                    <Card className="bg-white border border-[#E7E7E7] rounded-[15px] shadow-sm">
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
        </div>
    )
}

export default Profile


