import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Copy, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

interface InviteUserFormProps {
  enterpriseId: string;
  onClose: () => void;
  onSuccess: () => void;
  teamName?: string;
}

export const InviteUserForm = ({ enterpriseId, onClose, onSuccess, teamName }: InviteUserFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: "",
    role: "member",
    message: "",
  });
  const [formErrors, setFormErrors] = useState<{ email?: string; role?: string }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [invitationLink, setInvitationLink] = useState<string | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (teamName && !formData.message) {
      setFormData((prev) => ({
        ...prev,
        message: `You've been invited to join the ${teamName} workspace on MealLens.`,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamName]);

  const resetForm = () => {
    setFormData({ email: "", role: "member", message: "" });
    setFormErrors({});
    setGeneralError(null);
  };

  const validateForm = () => {
    const nextErrors: { email?: string; role?: string } = {};
    const trimmedEmail = formData.email.trim();

    if (!trimmedEmail) {
      nextErrors.email = "Please enter an email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = "Please provide a valid email address.";
    }

    if (!formData.role) {
      nextErrors.role = "Please select a role.";
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const payload = {
        email: formData.email.trim(),
        role: formData.role,
        message: formData.message.trim() || undefined,
      };

      const result = await api.inviteUserToEnterprise(enterpriseId, payload);

      if (result.success) {
        resetForm();
        onSuccess();

        if (!result.email_sent && result.invitation_link) {
          setInvitationLink(result.invitation_link);
          setShowLinkModal(true);
          toast({
            title: "Invitation created",
            description: "Email service unavailable. Share the link manually.",
          });
        } else {
          toast({
            title: "Success",
            description: "Invitation email sent successfully.",
          });
          onClose();
        }
        return;
      }

      let errorMessage = result.message || result.error || "Failed to send invitation.";
      if (errorMessage.includes("not a member")) {
        errorMessage =
          "You do not have permission to invite users to this organization. Only organization owners and admins can send invitations.";
      } else if (errorMessage.includes("already invited")) {
        errorMessage = "This user already has a pending invitation.";
      } else if (errorMessage.includes("Maximum user limit")) {
        errorMessage =
          "Organization has reached its maximum user limit. Please contact support to increase capacity.";
      }
      throw new Error(errorMessage);
    } catch (error: any) {
      const description = error?.message || "Failed to send invitation.";
      setGeneralError(description);
      toast({
        title: "Invitation failed",
        description,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!invitationLink) return;

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(invitationLink);
      } else {
        const temp = document.createElement("textarea");
        temp.value = invitationLink;
        temp.style.position = "absolute";
        temp.style.left = "-9999px";
        document.body.appendChild(temp);
        temp.select();
        document.execCommand("copy");
        document.body.removeChild(temp);
      }

      setLinkCopied(true);
      toast({
        title: "Copied",
        description: "Invitation link copied to clipboard.",
      });
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy link. Please copy it manually.",
        variant: "destructive",
      });
    }
  };

  const handleCloseWithSuccess = () => {
    setShowLinkModal(false);
    setInvitationLink(null);
    setLinkCopied(false);
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
            <div className="bg-yellow-50 border border-yellow-400 p-4 text-sm text-yellow-800">
              <strong>Email service not configured.</strong> Share this invitation link manually with the user.
            </div>

            <div className="space-y-2">
              <Label>Invitation Link</Label>
              <div className="flex gap-2">
                <Input value={invitationLink} readOnly className="font-mono text-sm" />
                <Button type="button" onClick={copyToClipboard} variant={linkCopied ? "default" : "outline"}>
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
                Send this link to {formData.email || "the invitee"} via email, text, or any other method.
              </p>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleCloseWithSuccess}>Done</Button>
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
          <CardTitle>Invite User {teamName ? `to ${teamName}` : ""}</CardTitle>
          <Button variant="ghost" size="sm" onClick={isLoading ? undefined : onClose} disabled={isLoading}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {generalError && (
              <div className="flex items-start gap-2 border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                <span>{generalError}</span>
              </div>
            )}

            {teamName && (
              <div className="border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                Invitation will grant access to the <strong>{teamName}</strong> workspace.
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="user@example.com"
                required
              />
              {formErrors.email && <p className="text-xs text-red-600">{formErrors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData((prev) => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.role && <p className="text-xs text-red-600">{formErrors.role}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Personal Message (Optional)</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                placeholder="Add a personal message to the invitation..."
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Invitation"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

