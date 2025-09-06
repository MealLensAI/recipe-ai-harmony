import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

const Profile: React.FC = () => {
    const { toast } = useToast();
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [changing, setChanging] = useState<boolean>(false);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.getUserProfile();
                const p: any = (res as any).profile || (res as any).data || (res as any).profile_data;
                if (res.status === 'success' && p) {
                    setEmail(p.email || '');
                }
            } catch { }
        })();
    }, []);

    const handlePasswordChange = async () => {
        if (!password || password.length < 6) {
            toast({ title: 'Error', description: 'Password must be at least 6 characters.', variant: 'destructive' });
            return;
        }
        setChanging(true);
        try {
            const res = await api.updatePassword(password);
            if (res.status === 'success') {
                toast({ title: 'Password Updated', description: 'Your password has been updated successfully.' });
                setPassword('');
            } else {
                toast({ title: 'Error', description: res.message || 'Failed to update password.', variant: 'destructive' });
            }
        } catch (e) {
            toast({ title: 'Error', description: 'Failed to update password.', variant: 'destructive' });
        } finally {
            setChanging(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Profile</h1>
                    <p className="text-muted-foreground mt-2">View your account details and update your password</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Account</CardTitle>
                        <CardDescription>Your email and password settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label className="text-base font-medium">Email</Label>
                            <Input value={email} disabled className="mt-2" />
                        </div>
                        <div>
                            <Label htmlFor="new-password" className="text-base font-medium">New Password</Label>
                            <Input
                                id="new-password"
                                type="password"
                                placeholder="Enter new password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-2"
                            />
                            <Button onClick={handlePasswordChange} disabled={changing || password.length < 6} className="mt-3 w-full">
                                {changing ? 'Updating...' : 'Update Password'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Profile;


