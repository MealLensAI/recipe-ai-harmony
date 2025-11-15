import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Building2, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/utils'
import { api } from '@/lib/api'

interface OrganizationAccessGuardProps {
    children: React.ReactNode
}

export default function OrganizationAccessGuard({ children }: OrganizationAccessGuardProps) {
    const { isAuthenticated, loading: authLoading } = useAuth()
    const [canAccess, setCanAccess] = useState<boolean | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const navigate = useNavigate()
    const { toast } = useToast()

    useEffect(() => {
        // Don't check until auth is ready
        if (authLoading) {
            console.log('⏸️ OrganizationAccessGuard: Waiting for auth to load')
            return
        }

        if (!isAuthenticated) {
            console.log(' OrganizationAccessGuard: Not authenticated, redirecting to login')
            navigate('/login')
            return
        }

        console.log(' OrganizationAccessGuard: Checking access')
        checkAccess()
    }, [authLoading, isAuthenticated])

    const checkAccess = async () => {
        try {
            setIsLoading(true)
            
            // Use centralized API service instead of direct fetch
            const result = await api.canCreateOrganization()

            if ((result as any).success) {
                const canCreate = (result as any).can_create
                console.log(' OrganizationAccessGuard: Access check result:', canCreate)
                setCanAccess(canCreate)
            } else {
                console.warn('⚠️ OrganizationAccessGuard: Access check failed')
                setCanAccess(false)
            }
        } catch (error: any) {
            console.error('Failed to check organization access:', error)
            // On error, default to no access (safe default)
            setCanAccess(false)
        } finally {
            setIsLoading(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Checking access...</p>
                </div>
            </div>
        )
    }

    if (canAccess === false) {
        return <>{children}</>
    }

    return <>{children}</>
}
