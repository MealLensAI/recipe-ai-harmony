// src/pages/EnterpriseDashboard.tsx
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

const PERIOD_OPTIONS = ["December 2023", "November 2023", "October 2023", "Q3 2023", "FY 2023"];

export default function EnterpriseDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Core state
  const [enterprises, setEnterprises] = useState<any[]>([]);
  const [selectedEnterprise, setSelectedEnterprise] = useState<any | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [settingsHistory, setSettingsHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [showInviteUserForm, setShowInviteUserForm] = useState(false);
  const [inviteContextTeam, setInviteContextTeam] = useState<string | undefined>(undefined);
  const [permissionReason, setPermissionReason] = useState("");
  const [canCreateOrganizations, setCanCreateOrganizations] = useState(true);

  // misc
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSidebarItem, setActiveSidebarItem] = useState<"overview" | "activity" | "members" | "settings" | "notes">("overview");
  const [activeTab, setActiveTab] = useState<"users" | "invitations">("invitations");
  const [selectedPeriod, setSelectedPeriod] = useState(PERIOD_OPTIONS[0]);
  const [isPeriodMenuOpen, setIsPeriodMenuOpen] = useState(false);
  const periodMenuRef = useRef<HTMLDivElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  // Derived state
  const filteredUsers = useMemo(
    () =>
      users.filter((u) =>
        (((u?.email ?? "") + " " + (u?.role ?? "") + " " + (u?.department ?? "")).toLowerCase().includes(searchTerm.toLowerCase()))
      ),
    [users, searchTerm]
  );

  const filteredInvitations = useMemo(
    () => invitations.filter((i) => (i?.email ?? "").toLowerCase().includes(searchTerm.toLowerCase())),
    [invitations, searchTerm]
  );

  const pendingInvites = useMemo(() => filteredInvitations.filter((i) => (i.status ?? "").toLowerCase() === "pending"), [filteredInvitations]);
  const totalUsers = filteredUsers.length;
  const activeUsers = filteredUsers.filter((u) => (u.status ?? "").toLowerCase() === "active").length;
  const userActivityRate = totalUsers === 0 ? 0 : Math.round((activeUsers / totalUsers) * 100);
  const inviteAcceptanceRate = filteredInvitations.length === 0 ? 0 : Math.round(((filteredInvitations.length - pendingInvites.length) / filteredInvitations.length) * 100);
  const capacityRate =
    selectedEnterprise?.seat_limit && selectedEnterprise.seat_limit > 0
      ? Math.min(100, Math.round((totalUsers / selectedEnterprise.seat_limit) * 100))
      : totalUsers
      ? 72
      : 0;

  // Fetch enterprises and permissions on auth ready
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadEnterprises();
      checkUserPermissions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated]);

  // load enterprise details when selectedEnterprise changes
  useEffect(() => {
    if (selectedEnterprise?.id) {
      loadEnterpriseDetails(selectedEnterprise.id);
    } else {
      setUsers([]);
      setInvitations([]);
      setSettingsHistory([]);
    }
  }, [selectedEnterprise]);

  // Load settings history when activity tab is selected
  useEffect(() => {
    if (activeSidebarItem === "activity" && selectedEnterprise?.id) {
      loadSettingsHistory(selectedEnterprise.id);
    }
  }, [activeSidebarItem, selectedEnterprise]);

  // click outside to close period menu
  useEffect(() => {
    if (!isPeriodMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (!periodMenuRef.current) return;
      if (periodMenuRef.current.contains(e.target as Node)) return;
      setIsPeriodMenuOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [isPeriodMenuOpen]);

  // --- API helpers ---
  async function checkUserPermissions() {
    try {
      const res: any = await api.canCreateOrganization();
      if (res.success) {
        setCanCreateOrganizations(Boolean(res.can_create));
        setPermissionReason(res.reason || "");
      }
    } catch {
      setCanCreateOrganizations(true);
    }
  }

  async function loadEnterprises() {
    setIsLoading(true);
    try {
      const res: any = await api.getMyEnterprises();
      if (res.success) {
        const loaded = res.enterprises || [];
        setEnterprises(loaded);
        // auto-select first if nothing selected
        setSelectedEnterprise((prev) => {
          if (prev && loaded.find((e: any) => e.id === prev.id)) return prev;
          return loaded[0] ?? null;
        });
      } else {
        toast({ title: "Error", description: res.message || "Unable to fetch organizations", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to load organizations", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  async function loadEnterpriseDetails(enterpriseId: string) {
    if (!enterpriseId) return;
    try {
      const [uRes, iRes] = await Promise.allSettled([api.getEnterpriseUsers(enterpriseId), api.getEnterpriseInvitations(enterpriseId)]);
      if (uRes.status === "fulfilled") {
        const r: any = uRes.value;
        setUsers(r.success ? r.users || [] : []);
        if (!r.success) toast({ title: "Error", description: r.message || "Failed to fetch users", variant: "destructive" });
      } else {
        setUsers([]);
        toast({ title: "Error", description: "Failed to fetch users (network)", variant: "destructive" });
      }

      if (iRes.status === "fulfilled") {
        const r: any = iRes.value;
        setInvitations(r.success ? r.invitations || [] : []);
        if (!r.success) toast({ title: "Error", description: r.message || "Failed to fetch invitations", variant: "destructive" });
      } else {
        setInvitations([]);
        toast({ title: "Error", description: "Failed to fetch invitations (network)", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to load enterprise details", variant: "destructive" });
    }
  }

  async function cancelInvitation(invitationId: string) {
    try {
      const r: any = await api.cancelInvitation(invitationId);
      if (r.success) {
        toast({ title: "Success", description: "Invitation cancelled" });
        if (selectedEnterprise?.id) await loadEnterpriseDetails(selectedEnterprise.id);
      } else {
        toast({ title: "Error", description: r.message || "Failed to cancel invitation", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to cancel invitation", variant: "destructive" });
    }
  }

  async function removeUser(relationId: string) {
    try {
      const r: any = await api.deleteEnterpriseUser(relationId);
      if (r.success) {
        toast({ title: "Success", description: "User removed" });
        if (selectedEnterprise?.id) await loadEnterpriseDetails(selectedEnterprise.id);
      } else {
        toast({ title: "Error", description: r.message || "Failed to remove user", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to remove user", variant: "destructive" });
    }
  }

  async function loadSettingsHistory(enterpriseId: string) {
    if (!enterpriseId) return;
    setLoadingHistory(true);
    try {
      const res: any = await api.getEnterpriseSettingsHistory(enterpriseId);
      if (res.success) {
        setSettingsHistory(res.history || []);
      } else {
        toast({ title: "Error", description: res.message || "Failed to load settings history", variant: "destructive" });
        setSettingsHistory([]);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to load settings history", variant: "destructive" });
      setSettingsHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }

  // helpers
  const generateTempId = () => {
    try {
      if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
    } catch {}
    return `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  };

  const getMemberRelationId = (m: any) => m?.relation_id ?? m?.membership_id ?? m?.enterprise_user_id ?? m?.id ?? m?.user_id;

  // Import parsing helper (kept minimal)
  const parseImportedMembers = (contents: string, teamName: string) => {
    const lines = contents.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    return lines.map((line, i) => {
      const cells = line.split(",").map(c => c.trim()).filter(Boolean);
      const explicit = cells.find(c => c.includes("@"));
      const fallback = line.match(/[^\s,;<>]+@[^\s,;<>]+/i)?.[0];
      const email = explicit || fallback;
      if (!email) return null;
      const name = cells.find(c => !c.includes("@"));
      return {
        tempId: generateTempId(),
        full_name: name && name !== email ? name : undefined,
        email,
        role: "Member",
        joined_at: new Date().toISOString(),
        member_id: `IMP-${(i+1).toString().padStart(3,"0")}`,
        work_type: "Imported",
        status: "draft",
        department: teamName,
        isImported: true as const,
      } as ImportedMember;
    }).filter(Boolean) as ImportedMember[];
  };

  // Invite: always open the modal (no org selection guard)
  const handleInviteMemberClick = (teamName?: string) => {
    setInviteContextTeam(teamName);
    setShowInviteUserForm(true);
  };

  const handleImportClick = (teamName: string) => {
    // still prefer an org to import into, but we only warn rather than block
    if (!selectedEnterprise && enterprises.length === 0) {
      toast({ title: "No organization", description: "Create an organization to import members into.", variant: "destructive" });
      return;
    }
    setImportingTeam(teamName);
    importInputRef.current && (importInputRef.current.value = "");
    importInputRef.current?.click();
  };

  // file change
  const handleImportFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return setImportingTeam(null);
    if (!importingTeam) {
      toast({ title: "Pick a team", description: "Select the team to attach imported users to.", variant: "destructive" });
      return setImportingTeam(null);
    }
    if (!selectedEnterprise && enterprises.length === 0) {
      toast({ title: "No organization", description: "Create an organization first.", variant: "destructive" });
      return setImportingTeam(null);
    }
    if (file.size > 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload under 1MB.", variant: "destructive" });
      return setImportingTeam(null);
    }
    try {
      const txt = await file.text();
      const parsed = parseImportedMembers(txt, importingTeam);
      if (!parsed.length) {
        toast({ title: "No members detected", description: "Couldn't find valid emails.", variant: "destructive" });
        return;
      }
      const orgId = (selectedEnterprise?.id ?? enterprises[0]?.id);
      setImportedMembers(prev => {
        const orgMap = prev[orgId] ?? {};
        const teamList = orgMap[importingTeam] ?? [];
        return { ...prev, [orgId]: { ...orgMap, [importingTeam]: [...teamList, ...parsed] } };
      });
      toast({ title: "Import ready", description: `${parsed.length} draft members added.` });
    } catch (err: any) {
      toast({ title: "Import failed", description: err?.message || "Unable to read the file.", variant: "destructive" });
    } finally {
      setImportingTeam(null);
    }
  };

  // small loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-slate-400" />
          <p className="text-slate-600">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  const inviteEnterpriseId = selectedEnterprise?.id ?? enterprises[0]?.id ?? null;

  return (
    <div className="flex min-h-screen bg-[#f6f7fb] text-slate-900">
      <input
        ref={importInputRef}
        type="file"
        accept=".csv,.txt"
        onChange={handleImportFileChange}
        style={{ display: "none" }}
      />

      <aside className="w-64 border-r border-slate-200 bg-white">
        <EntrepriseSidebar 
          activeItem={activeSidebarItem}
          onItemChange={setActiveSidebarItem}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="px-6 py-8 lg:px-12">
          <header className="mb-10">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-500">MealLens</p>
            <h1 className="mt-2 text-4xl font-semibold text-slate-900">Enterprise Dashboard</h1>
            <p className="mt-2 text-sm text-slate-500">Manage organizations, users, and invitations</p>
          </header>

          <section className="grid gap-6 lg:grid-cols-3">
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Users</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{totalUsers}</p>
              </div>
              <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                <Users className="h-8 w-8" />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div>
                <p className="text-sm font-medium text-slate-500">Organizations</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{enterprises.length}</p>
              </div>
              <div className="rounded-xl bg-purple-100 p-3 text-purple-600">
                <Building2 className="h-8 w-8" />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div>
                <p className="text-sm font-medium text-slate-500">Pending Invites</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{pendingInvites.length}</p>
              </div>
              <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600">
                <Mail className="h-8 w-8" />
              </div>
            </div>
          </section>

          <div className="mt-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search members, teams, invitations"
                  className="h-11 rounded-xl border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700"
                />
              </div>

              <div className="relative" ref={periodMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsPeriodMenuOpen((prev) => !prev)}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600"
                >
                  {selectedPeriod}
                  <ChevronDown className={`h-4 w-4 transition ${isPeriodMenuOpen ? "rotate-180" : ""}`} />
                </button>
                {isPeriodMenuOpen && (
                  <div className="absolute z-20 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                    {PERIOD_OPTIONS.map((option) => (
                      <button
                        key={option}
                        className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
                        onClick={() => {
                          setSelectedPeriod(option);
                          setIsPeriodMenuOpen(false);
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowRegistrationForm(true)}
                className="h-11 rounded-xl border-slate-200 px-6 text-sm font-semibold text-slate-700"
              >
                New Organization
              </Button>
              <Button
                onClick={() => handleInviteMemberClick()}
                className="h-11 rounded-xl bg-[#0f172a] px-6 text-sm font-semibold text-white hover:bg-[#0b1120]"
              >
                <span className="inline-flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Send Invitation
                </span>
              </Button>
            </div>
          </div>

          {/* Activity View - Settings History */}
          {activeSidebarItem === "activity" && (
            <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Settings Activity</h2>
                  <p className="mt-1 text-sm text-slate-500">Track when users change their health settings</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => selectedEnterprise?.id && loadSettingsHistory(selectedEnterprise.id)}
                  disabled={loadingHistory || !selectedEnterprise?.id}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingHistory ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>

              {loadingHistory ? (
                <div className="py-12 text-center">
                  <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin text-slate-400" />
                  <p className="text-sm text-slate-500">Loading settings history...</p>
                </div>
              ) : settingsHistory.length === 0 ? (
                <div className="py-24 text-center">
                  <Settings className="mx-auto mb-6 h-12 w-12 text-slate-300" />
                  <h3 className="text-lg font-semibold text-slate-900">No settings changes yet</h3>
                  <p className="mt-2 text-sm text-slate-500">Settings changes will appear here when users update their profiles</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {settingsHistory.map((change: any, idx: number) => {
                    const changedFields = change.changed_fields || [];
                    const previousData = change.previous_settings_data || {};
                    const currentData = change.settings_data || {};
                    const changeDate = change.created_at ? new Date(change.created_at) : new Date();

                    return (
                      <div key={change.id || idx} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                                <Settings className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-slate-900">{change.user_name || change.user_email || "Unknown User"}</h3>
                                <p className="text-sm text-slate-500">{change.user_email}</p>
                              </div>
                            </div>

                            <div className="mt-4 space-y-2">
                              <p className="text-sm font-medium text-slate-700">
                                Changed {changedFields.length} field{changedFields.length !== 1 ? "s" : ""}:
                              </p>
                              <div className="space-y-2">
                                {changedFields.map((field: string, fieldIdx: number) => {
                                  const oldValue = previousData[field];
                                  const newValue = currentData[field];
                                  const formatValue = (val: any) => {
                                    if (val === null || val === undefined || val === "") return "Not set";
                                    if (typeof val === "boolean") return val ? "Yes" : "No";
                                    return String(val);
                                  };

                                  return (
                                    <div key={fieldIdx} className="rounded-md bg-slate-50 p-3">
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-700 capitalize">
                                          {field.replace(/([A-Z])/g, " $1").trim()}
                                        </span>
                                        <Badge variant="outline" className="ml-2 text-xs">
                                          Updated
                                        </Badge>
                                      </div>
                                      <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
                                        <div>
                                          <p className="text-slate-500">Previous</p>
                                          <p className="mt-1 font-medium text-slate-700">{formatValue(oldValue)}</p>
                                        </div>
                                        <div>
                                          <p className="text-slate-500">New</p>
                                          <p className="mt-1 font-medium text-emerald-700">{formatValue(newValue)}</p>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          <div className="ml-4 text-right">
                            <p className="text-xs text-slate-500">
                              {changeDate.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              {changeDate.toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* Overview View - Users and Invitations */}
          {activeSidebarItem === "overview" && (
          <section className="mt-12 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Section</p>
                <h2 className="text-2xl font-semibold text-slate-900">Invitations</h2>
              </div>
              <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
                {["users", "invitations"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as "users" | "invitations")}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      activeTab === tab
                        ? "bg-white text-slate-900 shadow"
                        : "text-slate-500"
                    }`}
                  >
                    {tab === "users" ? "Users" : "Invitations"}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === "invitations" ? (
              <>
                {filteredInvitations.length === 0 ? (
                  <div className="mt-10 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-12 text-center text-sm text-slate-500">
                    No invitations yet.
                  </div>
                ) : (
                  <div className="mt-8 overflow-hidden rounded-2xl border border-slate-100">
                    <table className="w-full table-auto text-left text-sm text-slate-700">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-6 py-3 font-semibold">#</th>
                          <th className="px-6 py-3 font-semibold">Email</th>
                          <th className="px-6 py-3 font-semibold">Role</th>
                          <th className="px-6 py-3 font-semibold">Sent</th>
                          <th className="px-6 py-3 font-semibold">Status</th>
                          <th className="px-6 py-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredInvitations.map((inv, idx) => (
                          <tr key={inv.id || idx} className="border-t border-slate-100">
                            <td className="px-6 py-4 text-slate-500">{idx + 1}</td>
                            <td className="px-6 py-4 font-medium text-slate-900">{inv.email}</td>
                            <td className="px-6 py-4 text-slate-600">{inv.role ?? "—"}</td>
                            <td className="px-6 py-4 text-slate-600">
                              {inv.sent_at ? new Date(inv.sent_at).toLocaleDateString() : "—"}
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant={inv.status === "accepted" ? "default" : "secondary"}>
                                {inv.status ?? "pending"}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {inv.status === "pending" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-full border-slate-200 px-4 text-xs font-semibold"
                                  onClick={() => cancelInvitation(inv.id)}
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
              </>
            ) : (
              <div className="mt-10 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-12 text-center text-sm text-slate-500">
                No users yet.
              </div>
            )}
          </section>
          )}
        </div>
      </main>

      {showRegistrationForm && (
        <EnterpriseRegistrationForm onClose={() => setShowRegistrationForm(false)} onSuccess={loadEnterprises} />
      )}

      {showInviteUserForm && (
        <InviteUserForm
          enterpriseId={inviteEnterpriseId || undefined}
          teamName={inviteContextTeam}
          onClose={() => {
            setShowInviteUserForm(false);
            setInviteContextTeam(undefined);
          }}
          onSuccess={() => {
            if (inviteEnterpriseId) {
              loadEnterpriseDetails(inviteEnterpriseId);
            }
          }}
        />
      )}
    </div>
  );
}