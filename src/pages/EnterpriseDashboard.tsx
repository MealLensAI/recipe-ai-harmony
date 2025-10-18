import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Users, Mail, Plus, MailOpen, Clock, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EnterpriseRegistrationForm } from '@/components/enterprise/EnterpriseRegistrationForm';
import { CreateUserForm } from '@/components/enterprise/CreateUserForm';
import MainLayout from '@/components/MainLayout';

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
    role: string;
    message?: string;
}

export default function EnterpriseDashboard() {
    const { toast } = useToast();
    const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
    const [selectedEnterprise, setSelectedEnterprise] = useState<Enterprise | null>(null);
    const [users, setUsers] = useState<OrganizationUser[]>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [showRegistrationForm, setShowRegistrationForm] = useState(false);
    const [showCreateUserForm, setShowCreateUserForm] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean, user: any }>({ isOpen: false, user: null });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadEnterprises();
    }, []);

    useEffect(() => {
        if (selectedEnterprise) {
            loadEnterpriseDetails(selectedEnterprise.id);
        }
    }, [selectedEnterprise]);

    const loadEnterprises = async () => {
        try {
            const token = localStorage.getItem('access_token') || localStorage.getItem('token');
            if (!token) {
                toast({
                    title: 'Authentication Required',
                    description: 'Please log in to access this page',
                    variant: 'destructive'
                });
                return;
            }

            const response = await fetch('http://localhost:5001/api/enterprise/my-enterprises', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load enterprises');
            }

            const data = await response.json();
            setEnterprises(data.enterprises || []);

            if (data.enterprises && data.enterprises.length > 0) {
                setSelectedEnterprise(data.enterprises[0]);
            }
        } catch (error: any) {
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
            const token = localStorage.getItem('access_token') || localStorage.getItem('token');
            if (!token) return;

            // Load users
            const usersResponse = await fetch(`http://localhost:5001/api/enterprise/${enterpriseId}/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (usersResponse.ok) {
                const usersData = await usersResponse.json();
                setUsers(usersData.users || []);
            }

            // Load invitations
            const invitationsResponse = await fetch(`http://localhost:5001/api/enterprise/${enterpriseId}/invitations`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (invitationsResponse.ok) {
                const invitationsData = await invitationsResponse.json();
                setInvitations(invitationsData.invitations || []);
            }
        } catch (error: any) {
            console.error('Failed to load enterprise details:', error);
        }
    };

    const handleCancelInvitation = async (invitationId: string) => {
        try {
            const token = localStorage.getItem('access_token') || localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`http://localhost:5001/api/enterprise/invitation/${invitationId}/cancel`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to cancel invitation');
            }

            toast({
                title: 'Success',
                description: 'Invitation cancelled'
            });
            if (selectedEnterprise) {
                loadEnterpriseDetails(selectedEnterprise.id);
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
            const authToken = localStorage.getItem('access_token') || localStorage.getItem('token');
            if (!authToken) {
                toast({
                    title: 'Error',
                    description: 'Authentication token not found. Please log in.',
                    variant: 'destructive'
                });
                return;
            }

            const response = await fetch(`http://localhost:5001/api/enterprise/user/${userRelationId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                toast({
                    title: 'Success',
                    description: data.message || 'User account deleted successfully. They can now be re-invited or register again.'
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
                                <p className="text-gray-600 mb-6">
                                    Register your clinic, hospital, or practice to start inviting patients and managing their nutrition plans.
                                </p>
                                <Button onClick={() => setShowRegistrationForm(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Register Organization
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {showRegistrationForm && (
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
                    <Button onClick={() => setShowRegistrationForm(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Register New Organization
                    </Button>
                </div>

                {/* Enterprise Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                                <CheckCircle className="h-8 w-8 text-green-500" />
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Active Users</p>
                                    <p className="text-2xl font-bold">{selectedEnterprise?.stats?.active_users || 0}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                                <Clock className="h-8 w-8 text-orange-500" />
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Pending Invites</p>
                                    <p className="text-2xl font-bold">{selectedEnterprise?.stats?.pending_invitations || 0}</p>
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
                        <TabsTrigger value="invitations">Invitations ({invitations.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="users" className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-medium">Enrolled Users</h3>
                                <p className="text-sm text-gray-600">{users.length} user{users.length !== 1 ? 's' : ''} registered</p>
                            </div>
                            <Button onClick={() => setShowCreateUserForm(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Create User
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
                                                            {user.first_name} {user.last_name}
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
                            <Button onClick={() => setShowCreateUserForm(true)}>
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
                                    <Card key={invitation.id}>
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
                                                    <p className="text-sm text-gray-600">
                                                        Expires: {new Date(invitation.expires_at).toLocaleDateString()}
                                                    </p>
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

                {showRegistrationForm && (
                    <EnterpriseRegistrationForm
                        onClose={() => setShowRegistrationForm(false)}
                        onSuccess={loadEnterprises}
                    />
                )}

                {showCreateUserForm && selectedEnterprise && (
                    <CreateUserForm
                        enterpriseId={selectedEnterprise.id}
                        onClose={() => setShowCreateUserForm(false)}
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

