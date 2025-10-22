import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Copy, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { APP_CONFIG } from '@/lib/config';

interface InviteUserFormProps {
    enterpriseId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export const InviteUserForm = ({ enterpriseId, onClose, onSuccess }: InviteUserFormProps) => {
    const { toast } = useToast();
    const [formData, setFormData] = useState({
        email: '',
        role: 'patient',
        message: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [invitationLink, setInvitationLink] = useState<string | null>(null);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.email) {
            toast({
                title: 'Validation Error',
                description: 'Please enter an email address',
                variant: 'destructive'
            });
            return;
        }

        setIsLoading(true);

        try {
            const token = localStorage.getItem('access_token') || localStorage.getItem('token');
            if (!token) {
                toast({
                    title: 'Authentication Required',
                    description: 'You must be logged in to invite users',
                    variant: 'destructive'
                });
                return;
            }

            const response = await fetch(`${APP_CONFIG.api.base_url}/api/enterprise/${enterpriseId}/invite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send invitation');
            }

            // If email service is not configured, show the invitation link
            if (!data.email_sent && data.invitation_link) {
                setInvitationLink(data.invitation_link);
                setShowLinkModal(true);
                toast({
                    title: 'Invitation Created',
                    description: 'Email service not configured. Copy the invitation link to share manually.'
                });
            } else {
                toast({
                    title: 'Success',
                    description: 'Invitation email sent successfully!'
                });
                onSuccess();
                onClose();
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to send invitation',
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (invitationLink) {
            navigator.clipboard.writeText(invitationLink);
            setLinkCopied(true);
            toast({
                title: 'Copied!',
                description: 'Invitation link copied to clipboard'
            });
            setTimeout(() => setLinkCopied(false), 2000);
        }
    };

    const handleCloseWithSuccess = () => {
        setShowLinkModal(false);
        setInvitationLink(null);
        setLinkCopied(false);
        onSuccess();
        onClose();
    };

    if (showLinkModal && invitationLink) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <Card className="w-full max-w-lg">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Invitation Link Created</CardTitle>
                        <Button variant="ghost" size="sm" onClick={handleCloseWithSuccess}>
                            <X className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                            <p className="text-sm text-yellow-800">
                                <strong>Email service not configured.</strong> Share this invitation link manually with the user.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Invitation Link</Label>
                            <div className="flex space-x-2">
                                <Input
                                    value={invitationLink}
                                    readOnly
                                    className="font-mono text-sm"
                                />
                                <Button
                                    type="button"
                                    onClick={copyToClipboard}
                                    variant={linkCopied ? "default" : "outline"}
                                >
                                    {linkCopied ? (
                                        <>
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Copied
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="h-4 w-4 mr-2" />
                                            Copy
                                        </>
                                    )}
                                </Button>
                            </div>
                            <p className="text-xs text-gray-500">
                                Send this link to {formData.email} via email, text, or any other method.
                            </p>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button onClick={handleCloseWithSuccess}>
                                Done
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Invite User</CardTitle>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address *</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="user@example.com"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="patient">Patient</SelectItem>
                                    <SelectItem value="member">Member</SelectItem>
                                    <SelectItem value="client">Client</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message">Personal Message (Optional)</Label>
                            <Textarea
                                id="message"
                                value={formData.message}
                                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                                placeholder="Add a personal message to the invitation..."
                                rows={4}
                            />
                        </div>

                        <div className="flex justify-end space-x-2 pt-4">
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Sending...' : 'Send Invitation'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

