import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Building2, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { APP_CONFIG } from '@/lib/config'

interface OrganizationAccessGuardProps {
    children: React.ReactNode
}

export default function OrganizationAccessGuard({ children }: OrganizationAccessGuardProps) {
    const [canAccess, setCanAccess] = useState<boolean | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const navigate = useNavigate()
    const { toast } = useToast()

    useEffect(() => {
        checkAccess()
    }, [])

    const checkAccess = async () => {
        try {
            const token = localStorage.getItem('access_token') || localStorage.getItem('token')
            if (!token) {
                navigate('/login')
                return
            }

            const response = await fetch(`${APP_CONFIG.api.base_url}/api/enterprise/can-create`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.ok) {
                const data = await response.json()
                setCanAccess(data.can_create)
            } else {
                setCanAccess(false)
            }
        } catch (error: any) {
            console.error('Failed to check organization access:', error)
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
        return (
            <div className="container mx-auto p-6">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Card className="w-full max-w-lg text-center">
                        <CardContent className="p-8">
                            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold mb-2 text-red-600">Access Denied</h2>
                            <p className="text-gray-600 mb-6">
                                You don't have permission to access organization features.
                            </p>
                            <p className="text-sm text-gray-500">
                                As an invited user, you can only access organizations you've been invited to.
                                Contact your organization administrator if you need access to additional features.
                            </p>
                            <div className="mt-6">
                                <button
                                    onClick={() => navigate('/ai-kitchen')}
                                    className="px-4 py-2 bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                                >
                                    Go to AI Kitchen
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return <>{children}</>
}
