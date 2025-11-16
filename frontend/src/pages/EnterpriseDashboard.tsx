import { useState, useEffect, useMemo, useRef, ChangeEvent, FormEvent } from "react";
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

type CustomTable = {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
};

type ImportedMember = {
  tempId: string;
  full_name?: string;
  email: string;
  role?: string;
  joined_at?: string;
  member_id?: string;
  work_type?: string;
  status?: string;
  department?: string;
  isImported: true;
};

const NAV_SECTIONS = ["Overview", "Activity", "Task", "Member", "Notes", "Companies"] as const;
const PERIOD_OPTIONS = ["December 2023", "November 2023", "October 2023", "Q3 2023", "FY 2023"];

export default function EnterpriseDashboardRedesign() {
  const { toast } = useToast();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [enterprises, setEnterprises] = useState<any[]>([]);
  const [selectedEnterprise, setSelectedEnterprise] = useState<any>(null);

  const [users, setUsers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);

  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [showInviteUserForm, setShowInviteUserForm] = useState(false);
  const [inviteContextTeam, setInviteContextTeam] = useState<string | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; user: any; relationId?: string; teamName?: string }>({
    isOpen: false,
    user: null,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [canCreateOrganizations, setCanCreateOrganizations] = useState(true);
  const [permissionReason, setPermissionReason] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  const [activeNav, setActiveNav] = useState<(typeof NAV_SECTIONS)[number]>("Member");
  const [selectedPeriod, setSelectedPeriod] = useState(PERIOD_OPTIONS[0]);
  const [isPeriodMenuOpen, setIsPeriodMenuOpen] = useState(false);
  const periodMenuRef = useRef<HTMLDivElement | null>(null);

  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showCustomTableForm, setShowCustomTableForm] = useState(false);
  const [customTableForm, setCustomTableForm] = useState({ title: "", description: "" });
  const [customTablesByOrg, setCustomTablesByOrg] = useState<Record<string, CustomTable[]>>({});

  const [importedMembers, setImportedMembers] = useState<Record<string, Record<string, ImportedMember[]>>>({});
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [importingTeam, setImportingTeam] = useState<string | null>(null);

  const currentCustomTables = useMemo(() => {
    if (!selectedEnterprise) return [];
    return customTablesByOrg[selectedEnterprise.id] ?? [];
  }, [customTablesByOrg, selectedEnterprise]);

  const currentImports = useMemo(() => {
    if (!selectedEnterprise) return {};
    return importedMembers[selectedEnterprise.id] ?? {};
  }, [importedMembers, selectedEnterprise]);

  

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

  useEffect(() => {
    if (!isPeriodMenuOpen) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (!periodMenuRef.current) return;
      if (periodMenuRef.current.contains(event.target as Node)) return;
      setIsPeriodMenuOpen(false);
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [isPeriodMenuOpen]);

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
    if (!userRelationId) {
      toast({ title: "Error", description: "Unable to identify member record.", variant: "destructive" });
      return;
    }
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

  const groupedUsers = useMemo(() => {
    return filteredUsers.reduce<Record<string, any[]>>((acc, current) => {
      const key = current?.department || current?.team || current?.role || "General Team";
      if (!acc[key]) acc[key] = [];
      acc[key].push(current);
      return acc;
    }, {});
  }, [filteredUsers]);

  const generateTempId = () => {
    try {
      if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
      }
    } catch {
      // ignore
    }
    return `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  };

  const getMemberRelationId = (member: any) =>
    member?.relation_id ?? member?.membership_id ?? member?.enterprise_user_id ?? member?.id ?? member?.user_id;

  const handleNavChange = (section: (typeof NAV_SECTIONS)[number]) => {
    setActiveNav(section);
    if (section !== "Member") {
      toast({
        title: `${section} view`,
        description: "This view is informational for now. Member management lives in the Member tab.",
      });
    }
  };

  const handlePeriodSelect = (period: string) => {
    setSelectedPeriod(period);
    setIsPeriodMenuOpen(false);
    toast({
      title: "Period updated",
      description: `Showing metrics for ${period}`,
    });
  };

  const handleViewSettings = () => {
    if (!selectedEnterprise) {
      toast({ title: "Select an organization", description: "Choose an organization to review its settings.", variant: "destructive" });
      return;
    }
    setShowSettingsPanel(true);
  };

  const handleCopyOrgId = async () => {
    if (!selectedEnterprise?.id) return;
    if (typeof navigator === "undefined" || !navigator?.clipboard) {
      toast({ title: "Clipboard unavailable", description: "Your browser blocked clipboard access.", variant: "destructive" });
      return;
    }
    try {
      await navigator.clipboard.writeText(selectedEnterprise.id);
      toast({ title: "Copied", description: "Organization ID copied to clipboard." });
    } catch {
      toast({ title: "Unable to copy", description: "Clipboard access was blocked.", variant: "destructive" });
    }
  };

  const handleCustomTableSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedEnterprise) {
      toast({ title: "Select an organization", description: "Choose an organization before adding a custom table.", variant: "destructive" });
      return;
    }
    if (!customTableForm.title.trim()) {
      toast({ title: "Missing title", description: "Give the table a name so your team can identify it.", variant: "destructive" });
      return;
    }
    const newTable: CustomTable = {
      id: generateTempId(),
      title: customTableForm.title.trim(),
      description: customTableForm.description.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    setCustomTablesByOrg((prev) => ({
      ...prev,
      [selectedEnterprise.id]: [...(prev[selectedEnterprise.id] ?? []), newTable],
    }));
    toast({ title: "Table added", description: `${newTable.title} is now pinned to this workspace.` });
    setCustomTableForm({ title: "", description: "" });
    setShowCustomTableForm(false);
  };

  const openCustomTableForm = () => {
    if (!selectedEnterprise) {
      toast({ title: "Select an organization", description: "Create or pick an organization before adding custom tables.", variant: "destructive" });
      return;
    }
    setShowCustomTableForm(true);
  };

  const handleRemoveCustomTable = (tableId: string) => {
    if (!selectedEnterprise) return;
    setCustomTablesByOrg((prev) => {
      const tables = prev[selectedEnterprise.id] ?? [];
      return {
        ...prev,
        [selectedEnterprise.id]: tables.filter((table) => table.id !== tableId),
      };
    });
    toast({ title: "Table removed", description: "Custom table removed from this workspace." });
  };

  const handleImportClick = (teamName: string) => {
    if (!selectedEnterprise) {
      toast({ title: "Select an organization", description: "Select an organization before importing members.", variant: "destructive" });
      return;
    }
    setImportingTeam(teamName);
    if (importInputRef.current) {
      importInputRef.current.value = "";
      importInputRef.current.click();
    }
  };

  const handleImportFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setImportingTeam(null);
      return;
    }
    if (!importingTeam || !selectedEnterprise) {
      toast({ title: "Import cancelled", description: "Select a team before importing.", variant: "destructive" });
      setImportingTeam(null);
      return;
    }
    if (file.size > 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload a CSV under 1MB.", variant: "destructive" });
      setImportingTeam(null);
      return;
    }
    try {
      const text = await file.text();
      const parsed = parseImportedMembers(text, importingTeam);
      if (!parsed.length) {
        toast({ title: "No members detected", description: "We could not find valid email addresses in this file.", variant: "destructive" });
        return;
      }
      setImportedMembers((prev) => {
        const existing = prev[selectedEnterprise.id] ?? {};
        const teamMembers = existing[importingTeam] ?? [];
        return {
          ...prev,
          [selectedEnterprise.id]: {
            ...existing,
            [importingTeam]: [...teamMembers, ...parsed],
          },
        };
      });
      toast({
        title: "Import ready",
        description: `${parsed.length} draft member${parsed.length > 1 ? "s" : ""} added to ${importingTeam}.`,
      });
    } catch (error: any) {
      toast({ title: "Import failed", description: error?.message || "Unable to read the selected file.", variant: "destructive" });
    } finally {
      setImportingTeam(null);
    }
  };

  const parseImportedMembers = (contents: string, teamName: string): ImportedMember[] => {
    const lines = contents.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const members: ImportedMember[] = [];

    lines.forEach((line, index) => {
      const cells = line.split(",").map((cell) => cell.trim()).filter(Boolean);
      const explicitEmail = cells.find((cell) => cell.includes("@"));
      const fallbackEmail = line.match(/[^\s,;<>]+@[^\s,;<>]+/i)?.[0];
      const email = explicitEmail || fallbackEmail;
      if (!email) return;
      const possibleName = cells.find((cell) => !cell.includes("@"));
      const possibleRole = cells.length > 1 ? cells[cells.length - 1] : undefined;
      const newMember: ImportedMember = {
        tempId: generateTempId(),
        full_name: possibleName && possibleName !== email ? possibleName : undefined,
        email,
        role: possibleRole && possibleRole !== email ? possibleRole : "Member",
        joined_at: new Date().toISOString(),
        member_id: `IMP-${(index + 1).toString().padStart(3, "0")}`,
        work_type: "Imported",
        status: "draft",
        department: teamName,
        isImported: true as const,
      };
      members.push(newMember);
    });

    return members;
  };

  const handleRemoveImportedMember = (teamName: string, tempId: string) => {
    if (!selectedEnterprise) return;
    setImportedMembers((prev) => {
      const orgImports = prev[selectedEnterprise.id] ?? {};
      const teamImports = orgImports[teamName] ?? [];
      const updatedTeam = teamImports.filter((member) => member.tempId !== tempId);
      return {
        ...prev,
        [selectedEnterprise.id]: {
          ...orgImports,
          [teamName]: updatedTeam,
        },
      };
    });
    toast({ title: "Draft removed", description: "Imported draft removed from the table." });
  };

  const handleMemberRemovalRequest = (member: any, teamName: string) => {
    if (member?.isImported) {
      handleRemoveImportedMember(teamName, member.tempId);
      return;
    }
    const relationId = getMemberRelationId(member);
    if (!relationId) {
      toast({ title: "Cannot remove member", description: "Missing relation identifier from server response.", variant: "destructive" });
      return;
    }
    setDeleteConfirm({ isOpen: true, user: member, relationId, teamName });
  };

  const handleInviteMemberClick = (teamName?: string) => {
    if (!selectedEnterprise) {
      toast({
        title: "Select an organization",
        description: "Pick an organization before inviting members.",
        variant: "destructive",
      });
      return;
    }
    setInviteContextTeam(teamName ?? null);
    setShowInviteUserForm(true);
  };

  const handleCloseInviteForm = () => {
    setShowInviteUserForm(false);
    setInviteContextTeam(null);
  };

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
      <input
        ref={importInputRef}
        type="file"
        accept=".csv,.txt"
        style={{ display: "none" }}
        onChange={handleImportFileChange}
      />
      <EntrepriseSidebar />

      <main className="dashboard-main">
        <div className="dashboard-content">
          <nav className="dashboard-nav">
            {NAV_SECTIONS.map((item) => (
              <button
                key={item}
                className={`nav-pill ${item === activeNav ? "active" : ""}`}
                type="button"
                onClick={() => handleNavChange(item)}
              >
                {item}
              </button>
            ))}
          </nav>

          {activeNav !== "Member" && (
            <div className="section-banner">
              <div>
                <p className="muted">You are previewing the {activeNav} workspace.</p>
                <p>Member actions stay live so you can continue managing invites.</p>
              </div>
              <Button variant="outline" className="flat-button subtle" onClick={() => setActiveNav("Member")}>
                Return to Members
              </Button>
            </div>
          )}

          <header className="dashboard-toolbar">
            <div>
              <h1>Organization Workspace</h1>
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
            <Button variant="outline" className="flat-button subtle" onClick={handleViewSettings}>
              <Settings className="icon" /> View Setting
            </Button>
            
            <div className="selector period-selector" ref={periodMenuRef}>
              {/* <span>Period</span> */}
              <button type="button" onClick={() => setIsPeriodMenuOpen((prev) => !prev)}>
                {selectedPeriod} <ChevronDown className={`icon ${isPeriodMenuOpen ? "rotated" : ""}`} />
              </button>
              {isPeriodMenuOpen && (
                <div className="selector-menu">
                  {PERIOD_OPTIONS.map((period) => (
                    <button
                      type="button"
                      key={period}
                      className={period === selectedPeriod ? "active" : ""}
                      onClick={() => handlePeriodSelect(period)}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              )}
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
                <p className="muted">Total Members </p>
                <h2>{userActivityRate || 0}</h2>
                <span className="trend positive">
                  Total Members {Math.min(userActivityRate, 18)}
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
                <Button className="flat-button subtle" onClick={() => handleInviteMemberClick()}>
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
                        <span>
                          {teamMembers.length} members
                          {(currentImports[teamName]?.length || 0) > 0 && (
                            <em className="draft-count"> + {currentImports[teamName]!.length} draft{currentImports[teamName]!.length > 1 ? "s" : ""}</em>
                          )}
                        </span>
                        <div className="team-panel__actions">
                          <button type="button" onClick={() => handleInviteMemberClick(teamName)}>
                            Invite
                          </button>
                          <button type="button" onClick={() => handleImportClick(teamName)}>
                            Import
                          </button>
                        </div>
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
                          {[...(teamMembers ?? []), ...(currentImports[teamName] ?? [])].map((member: any, index) => (
                            <tr key={member.id || member.tempId || index}>
                              <td>{index + 1}</td>
                              <td>
                                <div className="member-cell">
                                  <span className="member-name">{member.full_name || member.email || "Unspecified"}</span>
                                  <span className="muted">{member.email || "—"}</span>
                                  {member.isImported && <span className="draft-pill">Imported draft</span>}
                                </div>
                              </td>
                              <td>{member.role ?? "—"}</td>
                              <td>{member.joined_at ? new Date(member.joined_at).toLocaleDateString() : "—"}</td>
                              <td>{member.member_id ?? "#" + (index + 1).toString().padStart(3, "0")}</td>
                              <td>{member.work_type ?? "Full Time"}</td>
                              <td>
                                <Badge variant={member.isImported ? "secondary" : member.status === "active" ? "default" : "secondary"}>
                                  {member.isImported ? "Draft" : member.status ?? "N/A"}
                                </Badge>
                              </td>
                              <td className="table-actions">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="flat-button subtle"
                                  onClick={() => handleMemberRemovalRequest(member, teamName)}
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
              <div className="">
                {/* You currently have no organization selected. Create one to start managing members. */}
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
              teamName={inviteContextTeam ?? undefined}
              onClose={handleCloseInviteForm}
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
                  <Button
                    variant="destructive"
                    className="flat-button"
                    disabled={!deleteConfirm.relationId}
                    onClick={() => deleteConfirm.relationId && deleteUser(deleteConfirm.relationId)}
                  >
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
