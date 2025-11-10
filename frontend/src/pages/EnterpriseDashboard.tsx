import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Users, Mail, Plus, MailOpen, XCircle, Trash2, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EnterpriseRegistrationForm } from '@/components/enterprise/EnterpriseRegistrationForm';
import { InviteUserForm } from '@/components/enterprise/InviteUserForm';
import MainLayout from '@/components/MainLayout';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/utils';

interface Enterprise {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    organization_type: string;
    created_at: string;
    max_users: number;
    stats?: {
        total_users: number;
        active_users: number;
        pending_invitations: number;
        accepted_invitations: number;
    };
}

interface OrganizationUser {
    id: string;
    user_id: string;
    email: string;
    role: string;
    status: string;
    joined_at: string;
    notes?: string;
}

interface Invitation {
    id: string;
    email: string;
    status: string;
    sent_at: string;
    expires_at: string;
    accepted_at?: string;
    role: string;
    message?: string;
}

export default function EnterpriseDashboard() {
    const { toast } = useToast();
    const { isAuthenticated, loading: authLoading } = useAuth();
    const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
    const [selectedEnterprise, setSelectedEnterprise] = useState<Enterprise | null>(null);
    const [users, setUsers] = useState<OrganizationUser[]>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [showRegistrationForm, setShowRegistrationForm] = useState(false);
    const [showInviteUserForm, setShowInviteUserForm] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean, user: any }>({ isOpen: false, user: null });
    const [isLoading, setIsLoading] = useState(true);
    const [canCreateOrganizations, setCanCreateOrganizations] = useState(true);
    const [permissionReason, setPermissionReason] = useState('');

    // Wait for auth to be ready before loading data
    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            console.log('🔍 EnterpriseDashboard: Auth ready, loading data');
            loadEnterprises();
            checkUserPermissions();
        } else {
            console.log('⏸️ EnterpriseDashboard: Waiting for auth', { authLoading, isAuthenticated });
        }
    }, [authLoading, isAuthenticated]);

    useEffect(() => {
        if (selectedEnterprise) {
            loadEnterpriseDetails(selectedEnterprise.id);
        }
    }, [selectedEnterprise]);

    const checkUserPermissions = async () => {
        try {
            const result = await api.canCreateOrganization();
            if (result.success) {
                setCanCreateOrganizations(result.can_create);
                setPermissionReason(result.reason);
            }
        } catch (error: any) {
            console.error('Failed to check user permissions:', error);
            // Default to allowing creation if check fails
            setCanCreateOrganizations(true);
        }
    };

    const loadEnterprises = async () => {
        try {
            const result = await api.getMyEnterprises();
            
            if (result.success) {
                const loadedEnterprises = result.enterprises || [];
                setEnterprises(loadedEnterprises);

                // Auto-select first enterprise if available
                if (loadedEnterprises.length > 0) {
                    setSelectedEnterprise(loadedEnterprises[0]);
                } else {
                    // No enterprises - clear selection
                    setSelectedEnterprise(null);
                }
            } else {
                throw new Error(result.message || 'Failed to load enterprises');
            }
        } catch (error: any) {
            console.error('Load enterprises error:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to load enterprises',
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const loadEnterpriseDetails = async (enterpriseId: string) => {
        try {
            // Load users
            const usersResult = await api.getEnterpriseUsers(enterpriseId);
            if (usersResult.success) {
                setUsers(usersResult.users || []);
            }

            // Load invitations
            const invitationsResult = await api.getEnterpriseInvitations(enterpriseId);
            if (invitationsResult.success) {
                setInvitations(invitationsResult.invitations || []);
            }
        } catch (error: any) {
            console.error('Failed to load enterprise details:', error);
        }
    };

    const handleCancelInvitation = async (invitationId: string) => {
        try {
            const result = await api.cancelInvitation(invitationId);

            if (result.success) {
                toast({
                    title: 'Success',
                    description: 'Invitation cancelled'
                });
                if (selectedEnterprise) {
                    loadEnterpriseDetails(selectedEnterprise.id);
                }
            } else {
                throw new Error(result.message || result.error || 'Failed to cancel invitation');
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to cancel invitation',
                variant: 'destructive'
            });
        }
    };

    const deleteUser = async (userRelationId: string) => {
        try {
            const result = await api.deleteEnterpriseUser(userRelationId);

            if (result.success) {
                toast({
                    title: 'Success',
                    description: result.message || 'User account deleted successfully. They can now be re-invited or register again.'
                });

                // Reload users to update the list
                if (selectedEnterprise) {
                    loadEnterpriseDetails(selectedEnterprise.id);
                }

                // Close confirmation modal
                setDeleteConfirm({ isOpen: false, user: null });
            } else {
                toast({
                    title: 'Error',
                    description: data.error || 'Failed to remove user from organization',
                    variant: 'destructive'
                });
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to remove user from organization',
                variant: 'destructive'
            });
        }
    };

    if (isLoading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading...</p>
                    </div>
                </div>
            </MainLayout>
        );
    }

    if (enterprises.length === 0) {
        return (
            <MainLayout>
                <div className="container mx-auto p-6">
                    <div className="flex items-center justify-center min-h-[60vh]">
                        <Card className="w-full max-w-lg text-center">
                            <CardContent className="p-8">
                                <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                <h2 className="text-2xl font-bold mb-2">No Organizations Yet</h2>
                                {canCreateOrganizations ? (
                                    <>
                                        <p className="text-gray-600 mb-6">
                                            Register your clinic, hospital, or practice to start inviting patients and managing their nutrition plans.
                                        </p>
                                        <Button onClick={() => setShowRegistrationForm(true)}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Register Organization
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-gray-600 mb-6">
                                            {permissionReason || "You don't have permission to create organizations."}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            As an invited user, you can only access organizations you've been invited to.
                                            Contact your organization administrator if you need access to additional features.
                                        </p>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {showRegistrationForm && canCreateOrganizations && (
                        <EnterpriseRegistrationForm
                            onClose={() => setShowRegistrationForm(false)}
                            onSuccess={loadEnterprises}
                        />
                    )}
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="container mx-auto p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Enterprise Dashboard</h1>
                        <p className="text-gray-600 mt-1">Manage your organization and invite users</p>
                    </div>
                    {canCreateOrganizations && (
                        <Button onClick={() => setShowRegistrationForm(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Register New Organization
                        </Button>
                    )}
                </div>

                {/* Enterprise Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                                <Users className="h-8 w-8 text-blue-500" />
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                                    <p className="text-2xl font-bold">{users.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                                <Building2 className="h-8 w-8 text-purple-500" />
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Organizations</p>
                                    <p className="text-2xl font-bold">{enterprises.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Organization Selector */}
                {enterprises.length > 1 && (
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-4">
                                <span className="font-medium">Select Organization:</span>
                                <select
                                    value={selectedEnterprise?.id || ''}
                                    onChange={(e) => {
                                        const enterprise = enterprises.find(ent => ent.id === e.target.value);
                                        setSelectedEnterprise(enterprise || null);
                                    }}
                                    className="border p-2"
                                >
                                    {enterprises.map(ent => (
                                        <option key={ent.id} value={ent.id}>{ent.name}</option>
                                    ))}
                                </select>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Tabs for Users and Invitations */}
                <Tabs defaultValue="users" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
                        <TabsTrigger value="invitations">
                            Invitations ({invitations.filter(i => i.status === 'pending').length} pending, {invitations.filter(i => i.status === 'accepted').length} accepted)
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="users" className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-medium">Enrolled Users</h3>
                                <p className="text-sm text-gray-600">{users.length} user{users.length !== 1 ? 's' : ''} registered</p>
                            </div>
                            <Button onClick={() => setShowInviteUserForm(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Invite User
                            </Button>
                        </div>

                        <div className="grid gap-4">
                            {users.length === 0 ? (
                                <Card>
                                    <CardContent className="p-8 text-center text-gray-500">
                                        <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                        <p>No users yet. Start by inviting your first user!</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                users.map((user) => (
                                    <Card key={user.id}>
                                        <CardContent className="p-4">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-2">
                                                    <div>
                                                        <p className="font-medium text-lg">
                                                            {user.email.split('@')[0]}
                                                        </p>
                                                        <p className="text-sm text-gray-600">{user.email}</p>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                                                            {user.status}
                                                        </Badge>
                                                        <Badge variant="outline" className="capitalize">
                                                            {user.role}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-gray-600">
                                                        Joined: {new Date(user.joined_at).toLocaleDateString()}
                                                    </p>
                                                    {user.notes && (
                                                        <p className="text-sm text-gray-600 mt-2">
                                                            <strong>Notes:</strong> {user.notes}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-right space-y-2">
                                                    <p className="text-xs text-gray-500">ID: {user.id.slice(0, 8)}...</p>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setDeleteConfirm({ isOpen: true, user })}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-1" />
                                                        Remove
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="invitations" className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-medium">Sent Invitations</h3>
                            <Button onClick={() => setShowInviteUserForm(true)}>
                                <Mail className="h-4 w-4 mr-2" />
                                Send New Invitation
                            </Button>
                        </div>

                        <div className="grid gap-4">
                            {invitations.length === 0 ? (
                                <Card>
                                    <CardContent className="p-8 text-center text-gray-500">
                                        <MailOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                        <p>No invitations sent yet.</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                invitations.map((invitation) => (
                                    <Card 
                                        key={invitation.id}
                                        className={invitation.status === 'accepted' ? 'border-green-500 bg-green-50/50' : ''}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-1">
                                                    <p className="font-medium">{invitation.email}</p>
                                                    <div className="flex items-center space-x-2">
                                                        <Badge
                                                            variant={
                                                                invitation.status === 'accepted' ? 'default' :
                                                                    invitation.status === 'pending' ? 'secondary' :
                                                                        'destructive'
                                                            }
                                                        >
                                                            {invitation.status === 'accepted' && <CheckCircle className="h-3 w-3 mr-1" />}
                                                            {invitation.status === 'expired' && <Clock className="h-3 w-3 mr-1" />}
                                                            {invitation.status === 'cancelled' && <XCircle className="h-3 w-3 mr-1" />}
                                                            {invitation.status}
                                                        </Badge>
                                                        <Badge variant="outline" className="capitalize">
                                                            {invitation.role}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-gray-600">
                                                        Sent: {new Date(invitation.sent_at).toLocaleDateString()}
                                                    </p>
                                                    {invitation.status === 'accepted' && invitation.accepted_at ? (
                                                        <p className="text-sm text-green-600 font-medium">
                                                            ✓ Accepted: {new Date(invitation.accepted_at).toLocaleDateString()}
                                                        </p>
                                                    ) : (
                                                    <p className="text-sm text-gray-600">
                                                        Expires: {new Date(invitation.expires_at).toLocaleDateString()}
                                                    </p>
                                                    )}
                                                    {invitation.message && (
                                                        <p className="text-sm text-gray-600 mt-2 italic">
                                                            "{invitation.message}"
                                                        </p>
                                                    )}
                                                </div>
                                                {invitation.status === 'pending' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleCancelInvitation(invitation.id)}
                                                    >
                                                        Cancel
                                                    </Button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </TabsContent>
                </Tabs>

                {showRegistrationForm && canCreateOrganizations && (
                    <EnterpriseRegistrationForm
                        onClose={() => setShowRegistrationForm(false)}
                        onSuccess={loadEnterprises}
                    />
                )}

                {showInviteUserForm && selectedEnterprise && (
                    <InviteUserForm
                        enterpriseId={selectedEnterprise.id}
                        onClose={() => setShowInviteUserForm(false)}
                        onSuccess={() => selectedEnterprise && loadEnterpriseDetails(selectedEnterprise.id)}
                    />
                )}

                {/* Delete Confirmation Modal */}
                {deleteConfirm.isOpen && deleteConfirm.user && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-md">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-red-600">
                                    <Trash2 className="h-5 w-5" />
                                    Remove User
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-gray-600">
                                    Are you sure you want to remove <strong>{deleteConfirm.user.first_name} {deleteConfirm.user.last_name}</strong> ({deleteConfirm.user.email}) from the organization?
                                </p>
                                <p className="text-sm text-gray-500">
                                    This action cannot be undone. The user's account will be completely deleted and they can be re-invited or register again with the same email.
                                </p>
                                <div className="flex justify-end space-x-2 pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setDeleteConfirm({ isOpen: false, user: null })}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => deleteUser(deleteConfirm.user.id)}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Remove User
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}

