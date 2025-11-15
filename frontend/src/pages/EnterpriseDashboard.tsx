import { useState, useEffect } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Building2,
  Users,
  Mail,
  Plus,
  Trash2,
  Search,
  Settings,
  Activity,
  FileText,
  LayoutDashboard,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EnterpriseRegistrationForm } from "@/components/enterprise/EnterpriseRegistrationForm";
import { InviteUserForm } from "@/components/enterprise/InviteUserForm";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/utils";
import EntrepriseSidebar from "@/components/enterprise/sidebar/EntrepriseSidebar";
import "./EnterpriseDashboard.css";

export default function EnterpriseDashboardRedesign() {
  const { toast } = useToast();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [enterprises, setEnterprises] = useState<any[]>([]);
  const [selectedEnterprise, setSelectedEnterprise] = useState<any>(null);

  const [users, setUsers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);

  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [showInviteUserForm, setShowInviteUserForm] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; user: any }>({
    isOpen: false,
    user: null,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [canCreateOrganizations, setCanCreateOrganizations] = useState(true);
  const [permissionReason, setPermissionReason] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadEnterprises();
      checkUserPermissions();
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (selectedEnterprise) loadEnterpriseDetails(selectedEnterprise.id);
    else {
      // clear lists if no enterprise
      setUsers([]);
      setInvitations([]);
    }
  }, [selectedEnterprise]);

  const checkUserPermissions = async () => {
    try {
      const result: any = await api.canCreateOrganization();
      if (result.success) {
        setCanCreateOrganizations(result.can_create);
        setPermissionReason(result.reason || "");
      }
    } catch (error: any) {
      setCanCreateOrganizations(true);
    }
  };

  const loadEnterprises = async () => {
    try {
      const result: any = await api.getMyEnterprises();
      if (result.success) {
        const loaded = result.enterprises || [];
        setEnterprises(loaded);
        setSelectedEnterprise((prev: any) => prev ?? loaded[0] ?? null);
      } else {
        toast({ title: "Error", description: result.message || "Unable to fetch organizations", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: (error?.message) || "Failed to load enterprises", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const loadEnterpriseDetails = async (enterpriseId?: string) => {
    if (!enterpriseId) return;
    try {
      // use parallel requests
      const [usersResult, invitesResult] = await Promise.allSettled([
        api.getEnterpriseUsers(enterpriseId),
        api.getEnterpriseInvitations(enterpriseId),
      ]);

      // users
      if (usersResult.status === "fulfilled") {
        const res: any = usersResult.value;
        if (res.success) setUsers(res.users || []);
        else {
          setUsers([]);
          toast({ title: "Error", description: res.message || "Failed to fetch users", variant: "destructive" });
        }
      } else {
        setUsers([]);
        toast({ title: "Error", description: "Failed to fetch users (network)", variant: "destructive" });
      }

      // invitations
      if (invitesResult.status === "fulfilled") {
        const res: any = invitesResult.value;
        if (res.success) setInvitations(res.invitations || []);
        else {
          setInvitations([]);
          toast({ title: "Error", description: res.message || "Failed to fetch invitations", variant: "destructive" });
        }
      } else {
        setInvitations([]);
        toast({ title: "Error", description: "Failed to fetch invitations (network)", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to load enterprise details", variant: "destructive" });
    }
  };

  const handleInviteUserOrMember = async (email: string, role: string, message: string) => {
    try{
      console.log("Inviting user:", email, role);

    }catch(error:any){
      toast({ title: "Error", description: "Failed to invite user", variant: "destructive" });
    }
  }

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const res: any = await api.cancelInvitation(invitationId);
      if (res.success) {
        toast({ title: "Success", description: "Invitation cancelled" });
        if (selectedEnterprise) await loadEnterpriseDetails(selectedEnterprise.id);
      } else {
        toast({ title: "Error", description: res.message || "Failed to cancel", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error?.message || "Failed to cancel invitation", variant: "destructive" });
    }
  };

  const deleteUser = async (userRelationId: string) => {
    try {
      const r: any = await api.deleteEnterpriseUser(userRelationId);
      if (r.success) {
        toast({ title: "Success", description: "User removed" });
        if (selectedEnterprise) await loadEnterpriseDetails(selectedEnterprise.id);
        setDeleteConfirm({ isOpen: false, user: null });
      } else {
        toast({ title: "Error", description: r.message || "Failed to remove user", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error?.message || "Failed to remove user", variant: "destructive" });
    }
  };

  const filteredUsers = users.filter((u) =>
    (((u?.email ?? "") + " " + (u?.role ?? "") + " " + (u?.department ?? "")).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredInvitations = invitations.filter((inv) =>
    (inv?.email ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingInvites = filteredInvitations.filter((inv) => (inv.status ?? "").toLowerCase() === "pending");
  const activeUsers = filteredUsers.filter((u) => (u.status ?? "").toLowerCase() === "active").length;
  const totalUsers = filteredUsers.length;
  const inviteAcceptanceRate =
    filteredInvitations.length === 0
      ? 0
      : Math.round(((filteredInvitations.length - pendingInvites.length) / filteredInvitations.length) * 100);
  const userActivityRate = totalUsers === 0 ? 0 : Math.round((activeUsers / totalUsers) * 100);
  const capacityRate =
    selectedEnterprise?.seat_limit && selectedEnterprise.seat_limit > 0
      ? Math.min(100, Math.round((totalUsers / selectedEnterprise.seat_limit) * 100))
      : totalUsers ? 72 : 0;

  const groupedUsers = filteredUsers.reduce<Record<string, any[]>>((acc, current) => {
    const key = current?.department || current?.team || current?.role || "General Team";
    if (!acc[key]) acc[key] = [];
    acc[key].push(current);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="enterprise-dashboard">
      <EntrepriseSidebar />

      <main className="dashboard-main">
        <div className="dashboard-content">
        
          <header className="dashboard-toolbar">
            <div>
              <h1>Organization Workspace</h1>
              {/* <div className="muted">Manage your organization's members, teams, and invitations all in one place.</div> */}
            </div>
            <div className="toolbar-actions">
              <Button
                variant="ghost"
                className="flat-button"
                onClick={() => selectedEnterprise && loadEnterpriseDetails(selectedEnterprise.id)}
              >
                <RefreshCw className="icon" /> Refresh
              </Button>
              {/* {canCreateOrganizations && (
                <Button className="flat-button primary" onClick={() => setShowRegistrationForm(true)}>
                  <Plus className="icon" /> New Organization
                </Button>
              )} */}
            </div>
          </header>
          {!canCreateOrganizations && (
            <div className="notice warning">
              {permissionReason || "You currently cannot create additional organizations."}
            </div>
          )}

          <div className="toolbar-controls">
            <div className="search-box">
              <Search className="icon" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search members, teams, invitations"
                className="control"
              />
            </div>
            <Button variant="outline" className="flat-button subtle">
              <Settings className="icon" /> View Setting
            </Button>
            <div className="selector">

              <button type="button">
                December 2023 <ChevronDown className="icon" />
              </button>
            </div>
            {enterprises.length > 1 && (
              <div className="selector">
                <span>Organization</span>
                <select
                  value={selectedEnterprise?.id || ""}
                  onChange={(e) =>
                    setSelectedEnterprise(enterprises.find((x) => x.id === e.target.value) || null)
                  }
                >
                  {enterprises.map((ent) => (
                    <option key={ent.id} value={ent.id}>
                      {ent.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <section className="kpi-grid">
            <article className="kpi-card">
              <div>
                <p className="muted">Active Member Rate</p>
                <h2>{userActivityRate || 0}%</h2>
                <span className="trend positive">
                  <Activity className="icon" /> +{Math.min(userActivityRate, 18)}%
                </span>
              </div>
              <Users className="metric-icon" />
            </article>
            <article className="kpi-card">
              <div>
                <p className="muted">Pending Invites</p>
                <h2>{pendingInvites.length}</h2>
                <span className="trend neutral">{filteredInvitations.length} total</span>
              </div>
              <Mail className="metric-icon" />
            </article>
            <article className="kpi-card">
              <div>
                <p className="muted">Capacity Rate</p>
                <h2>{capacityRate || 0}%</h2>
                <span className="trend negative">
                  <LayoutDashboard className="icon" /> Seats {selectedEnterprise?.seat_limit ?? "∞"}
                </span>
              </div>
              <Building2 className="metric-icon" />
            </article>
            <article className="kpi-card">
              <div>
                <p className="muted">Invite Acceptance</p>
                <h2>{inviteAcceptanceRate}%</h2>
                <span className="trend neutral">{filteredInvitations.length || 0} invites</span>
              </div>
              <FileText className="metric-icon" />
            </article>
          </section>

          <section className="">
            <header className="data-board__header">
              <div>
              </div>
              <div className="data-board__actions">
                <Button className="flat-button subtle" onClick={() => selectedEnterprise && setShowInviteUserForm(true)}>
                  <Plus className="icon" /> Invite member
                </Button>
                <Button
                  className="flat-button subtle"
                  variant="outline"
                  onClick={() => selectedEnterprise && loadEnterpriseDetails(selectedEnterprise.id)}
                >
                  <RefreshCw className="icon" /> Sync
                </Button>
              </div>
            </header>

            {selectedEnterprise ? (
              Object.keys(groupedUsers).length === 0 ? (
                <div className="empty-state">No members match your filters.</div>
              ) : (
                Object.entries(groupedUsers).map(([teamName, teamMembers]) => (
                  <article className="team-panel" key={teamName}>
                    <div className="team-panel__header">
                      <div>
                        <p className="muted">Team from {selectedEnterprise.name}</p>
                        <h4>{teamName}</h4>
                      </div>
                      <div className="team-panel__meta">
                        <span>{teamMembers.length} members</span>
                        <button type="button">Import</button>
                      </div>
                    </div>

                    <div className="table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th>No</th>
                            <th>Full Name / Email</th>
                            <th>Role</th>
                            <th>Date Added</th>
                            <th>Member ID</th>
                            <th>Work Type</th>
                            <th>Status</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {teamMembers.map((member, index) => (
                            <tr key={member.id || index}>
                              <td>{index + 1}</td>
                              <td>
                                <div className="member-cell">
                                  <span className="member-name">{member.full_name || member.email || "Unspecified"}</span>
                                  <span className="muted">{member.email || "—"}</span>
                                </div>
                              </td>
                              <td>{member.role ?? "—"}</td>
                              <td>{member.joined_at ? new Date(member.joined_at).toLocaleDateString() : "—"}</td>
                              <td>{member.member_id ?? "#" + (index + 1).toString().padStart(3, "0")}</td>
                              <td>{member.work_type ?? "Full Time"}</td>
                              <td>
                                <Badge variant={member.status === "active" ? "default" : "secondary"}>{member.status ?? "N/A"}</Badge>
                              </td>
                              <td className="table-actions">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="flat-button subtle"
                                  onClick={() => setDeleteConfirm({ isOpen: true, user: member })}
                                >
                                  <Trash2 className="icon" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </article>
                ))
              )
            ) : (
              <div className="empty-state">
                You currently have no organization selected. Create one to start managing members.
              </div>
            )}
          </section>

          <section className="data-board invitations">
            <header className="data-board__header">
              <div>
                <h3>Pending Invitations</h3>
                <p className="muted">Keep track of outstanding invites and follow-ups</p>
              </div>
            </header>
            {filteredInvitations.length === 0 ? (
              <div className="empty-state">No invitations yet.</div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Sent</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvitations.map((inv, idx) => (
                      <tr key={inv.id}>
                        <td>{idx + 1}</td>
                        <td>{inv.email}</td>
                        <td>{inv.role ?? "—"}</td>
                        <td>{inv.sent_at ? new Date(inv.sent_at).toLocaleDateString() : "—"}</td>
                        <td>
                          <Badge variant={inv.status === "accepted" ? "default" : "secondary"}>{inv.status}</Badge>
                        </td>
                        <td className="table-actions">
                          {inv.status === "pending" && (
                            <Button
                              variant="outline"
                              className="flat-button subtle"
                              onClick={() => handleCancelInvitation(inv.id)}
                            >
                              Cancel
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {showRegistrationForm && (
            <EnterpriseRegistrationForm onClose={() => setShowRegistrationForm(false)} onSuccess={loadEnterprises} />
          )}

          {showInviteUserForm && selectedEnterprise && (
            <InviteUserForm
              enterpriseId={selectedEnterprise.id}
              onClose={() => setShowInviteUserForm(false)}
              onSuccess={() => loadEnterpriseDetails(selectedEnterprise.id)}
            />
          )}

          {deleteConfirm.isOpen && deleteConfirm.user && (
            <div className="modal-overlay">
              <Card className="modal-card">
                <CardTitle className="modal-title">
                  <Trash2 className="icon" /> Remove Member
                </CardTitle>
                <p>
                  Are you sure you want to remove <strong>{deleteConfirm.user.email}</strong> from{" "}
                  {selectedEnterprise?.name || "this organization"}?
                </p>
                <div className="modal-actions">
                  <Button variant="outline" className="flat-button subtle" onClick={() => setDeleteConfirm({ isOpen: false, user: null })}>
                    Cancel
                  </Button>
                  <Button variant="destructive" className="flat-button" onClick={() => deleteUser(deleteConfirm.user.id)}>
                    Remove
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
