// src/pages/EnterpriseDashboard.tsx
import { useState, useEffect, useMemo, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Building2,
  Users,
  Mail,
  Search,
  Settings,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EnterpriseRegistrationForm } from "@/components/enterprise/EnterpriseRegistrationForm";
import { InviteUserForm } from "@/components/enterprise/InviteUserForm";
import { TimeRestrictionsSettings } from "@/components/enterprise/TimeRestrictionsSettings";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/utils";
import EntrepriseSidebar from "@/components/enterprise/sidebar/EntrepriseSidebar";
import "./EnterpriseDashboard.css";

const PERIOD_OPTIONS = ["December 2023", "November 2023", "October 2023", "Q3 2023", "FY 2023"];

// Type for imported members
interface ImportedMember {
  tempId: string;
  full_name?: string;
  email: string;
  role: string;
  joined_at: string;
  member_id: string;
  work_type: string;
  status: string;
  department: string;
  isImported: true;
}

export default function EnterpriseDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, loading: authLoading, user, signOut } = useAuth();

  const handleSidebarSettings = () => {
    setActiveSidebarItem("settings");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error: any) {
      toast({
        title: "Sign out failed",
        description: error?.message || "Unable to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Core state
  const [enterprises, setEnterprises] = useState<any[]>([]);
  const [selectedEnterprise, setSelectedEnterprise] = useState<any | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [settingsHistory, setSettingsHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [statistics, setStatistics] = useState<any>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [showInviteUserForm, setShowInviteUserForm] = useState(false);
  const [inviteContextTeam, setInviteContextTeam] = useState<string | undefined>(undefined);

  // misc
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSidebarItem, setActiveSidebarItem] = useState<"overview" | "activity" | "members" | "settings">("overview");
  const [activeTab, setActiveTab] = useState<"users" | "invitations">("invitations");
  const [selectedPeriod, setSelectedPeriod] = useState(PERIOD_OPTIONS[0]);
  const [isPeriodMenuOpen, setIsPeriodMenuOpen] = useState(false);
  const periodMenuRef = useRef<HTMLDivElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [importingTeam, setImportingTeam] = useState<string | null>(null);
  const [, setImportedMembers] = useState<Record<string, Record<string, ImportedMember[]>>>({});

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
  
  // Use statistics from API if available, otherwise calculate from local data
  const totalUsers = statistics?.total_users ?? filteredUsers.length;
  const pendingInvitationsCount = statistics?.pending_invitations ?? pendingInvites.length;

  // Fetch enterprises and permissions on auth ready
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadEnterprises();
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
  async function loadEnterprises() {
    console.log('[DASHBOARD] Loading enterprises...');
    setIsLoading(true);
    try {
      const res: any = await api.getMyEnterprises();
      console.log('[DASHBOARD] getMyEnterprises response:', res);
      if (res.success) {
        const loaded = res.enterprises || [];
        console.log('[DASHBOARD] Loaded enterprises:', loaded);
        setEnterprises(loaded);
        // auto-select first if nothing selected
        setSelectedEnterprise((prev: any) => {
          const selected = (prev && loaded.find((e: any) => e.id === prev.id)) ? prev : (loaded[0] ?? null);
          console.log('[DASHBOARD] Selected enterprise:', selected);
          return selected;
        });
      } else {
        console.error('[DASHBOARD] Failed to load enterprises:', res.message);
        toast({ title: "Error", description: res.message || "Unable to fetch organizations", variant: "destructive" });
      }
    } catch (err: any) {
      console.error('[DASHBOARD] Error loading enterprises:', err);
      toast({ title: "Error", description: err?.message || "Failed to load organizations", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Load enterprise details including users, invitations, and statistics
   * 
   * Note: Users list excludes the enterprise owner (they're not in organization_users table)
   * Only invited/added users are included in the users list
   */
  async function loadEnterpriseDetails(enterpriseId: string) {
    if (!enterpriseId) return;
    try {
      const [uRes, iRes, sRes] = await Promise.allSettled([
        api.getEnterpriseUsers(enterpriseId), 
        api.getEnterpriseInvitations(enterpriseId),
        api.getEnterpriseStatistics(enterpriseId)
      ]);
      
      // Handle users response
      if (uRes.status === "fulfilled") {
        const r: any = uRes.value;
        setUsers(r.success ? r.users || [] : []);
        if (!r.success && r.error) {
          console.error("Failed to fetch users:", r.error);
        }
      } else {
        setUsers([]);
        console.error("Failed to fetch users (network):", uRes.reason);
      }

      // Handle invitations response
      if (iRes.status === "fulfilled") {
        const r: any = iRes.value;
        setInvitations(r.success ? r.invitations || [] : []);
        if (!r.success && r.error) {
          console.error("Failed to fetch invitations:", r.error);
        }
      } else {
        setInvitations([]);
        console.error("Failed to fetch invitations (network):", iRes.reason);
      }

      // Handle statistics response
      if (sRes.status === "fulfilled") {
        const r: any = sRes.value;
        setStatistics(r.success ? r.statistics : null);
        if (!r.success && r.error) {
          console.error("Failed to fetch statistics:", r.error);
        }
      } else {
        setStatistics(null);
        console.error("Failed to fetch statistics (network):", sRes.reason);
      }
    } catch (err: any) {
      console.error("Failed to load enterprise details:", err);
      toast({ 
        title: "Unable to load organization details", 
        description: "Please refresh the page or try again later.", 
        variant: "destructive" 
      });
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

  async function loadSettingsHistory(enterpriseId: string) {
    if (!enterpriseId) {
      setSettingsHistory([]);
      return;
    }
    setLoadingHistory(true);
    try {
      const res: any = await api.getEnterpriseSettingsHistory(enterpriseId);
      if (res.success) {
        setSettingsHistory(res.history || []);
      } else {
        // Don't show error toast for empty history - just show empty state
        setSettingsHistory([]);
      }
    } catch (err: any) {
      // Only show error for actual errors, not 404s (which just mean no history yet)
      if (err?.status !== 404) {
        toast({ 
          title: "Unable to load activity", 
          description: "Please try again later or contact support if the issue persists.", 
          variant: "destructive" 
        });
      }
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
  const handleInviteMemberClick = async (teamName?: string) => {
    console.log('[INVITE] handleInviteMemberClick called');
    console.log('[INVITE] selectedEnterprise:', selectedEnterprise);
    console.log('[INVITE] enterprises:', enterprises);
    console.log('[INVITE] enterprises.length:', enterprises?.length);
    console.log('[INVITE] isLoading:', isLoading);
    
    // If enterprises haven't loaded yet, try loading them first
    if (isLoading || (!enterprises || enterprises.length === 0)) {
      console.log('[INVITE] Enterprises not loaded yet, loading now...');
      await loadEnterprises();
    }
    
    // Get enterprise ID - prioritize selected, then first in list
    let enterpriseId = selectedEnterprise?.id;
    
    if (!enterpriseId && enterprises && enterprises.length > 0) {
      enterpriseId = enterprises[0]?.id;
      // Also update selectedEnterprise if it's null
      if (!selectedEnterprise) {
        setSelectedEnterprise(enterprises[0]);
      }
      console.log('[INVITE] Using first enterprise from list:', enterpriseId);
    }
    
    console.log('[INVITE] Final enterpriseId:', enterpriseId);
    
    // Check if we have a valid enterprise ID
    if (!enterpriseId) {
      console.error('[INVITE] No enterprise ID available after loading!');
      toast({
        title: "No Organization Found",
        description: "You need to create an organization first before inviting users. Please use the 'Create Organization' button to set up your organization.",
        variant: "destructive",
        duration: 6000,
      });
      // Optionally open the registration form
      setShowRegistrationForm(true);
      return;
    }
    
    console.log('[INVITE] Opening invite form for enterprise:', enterpriseId);
    setInviteContextTeam(teamName);
    setShowInviteUserForm(true);
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
      setImportedMembers((prev: Record<string, Record<string, ImportedMember[]>>) => {
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

  // Don't block - show content immediately, load data in background

  // Get enterprise ID for invite form - ensure we have a valid ID
  // This is computed at render time, but handleInviteMemberClick ensures it's set before opening the form
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
          userName={user?.displayName}
          userEmail={user?.email}
          onSettingsClick={handleSidebarSettings}
          onSignOut={handleSignOut}
        />
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="px-6 py-8 lg:px-12">
          <header className="mb-10">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-500">MealLens</p>
            <h1 className="mt-2 text-4xl font-semibold text-slate-900">Enterprise Dashboard</h1>
            <p className="mt-2 text-sm text-slate-500">Manage your organization and invite users</p>
            {selectedEnterprise && statistics?.owner_info && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-700">
                <Building2 className="h-4 w-4" />
                <span>
                  <strong>{statistics.owner_info.name}</strong> ({statistics.owner_info.email}) • Organization Owner
                </span>
              </div>
            )}
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
                <p className="text-sm font-medium text-slate-500">Invited Users</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{enterprises.length}</p>
              </div>
              <div className="rounded-xl bg-purple-100 p-3 text-purple-600">
                <Building2 className="h-8 w-8" />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div>
                <p className="text-sm font-medium text-slate-500">Pending Invites</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{pendingInvitationsCount}</p>
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
                onClick={() => handleInviteMemberClick()}
                disabled={isLoading}
                className="h-11 rounded-xl bg-[#0f172a] px-6 text-sm font-semibold text-white hover:bg-[#0b1120] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="inline-flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {isLoading ? 'Loading...' : 'Send Invitation'}
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
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>

              {!selectedEnterprise ? (
                <div className="py-24 text-center">
                  <Building2 className="mx-auto mb-6 h-12 w-12 text-slate-300" />
                  <h3 className="text-lg font-semibold text-slate-900">No organization selected</h3>
                  <p className="mt-2 text-sm text-slate-500">Please select or create an organization to view activity</p>
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

          {/* Settings View - Time Restrictions */}
          {activeSidebarItem === "settings" && (
            <section className="mt-12">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Organization Settings</h2>
                <p className="mt-1 text-sm text-slate-500">Manage your organization preferences</p>
              </div>
              {!selectedEnterprise ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-24 text-center shadow-sm">
                  <Settings className="mx-auto mb-6 h-12 w-12 text-slate-300" />
                  <h3 className="text-lg font-semibold text-slate-900">No organization selected</h3>
                  <p className="mt-2 text-sm text-slate-500">Please select or create an organization to manage settings</p>
                </div>
              ) : (
                <TimeRestrictionsSettings enterpriseId={selectedEnterprise.id} />
              )}
            </section>
          )}

          {/* Overview View - Users and Invitations */}
          {activeSidebarItem === "overview" && (
          <section className="mt-12 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            {/* Info Box */}
            {selectedEnterprise && (
              <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-blue-900">User Management</h3>
                    <p className="mt-1 text-sm text-blue-700">
                      <strong>Total Users:</strong> {totalUsers} invited user{totalUsers !== 1 ? 's' : ''} 
                      {statistics?.max_users && ` (${statistics.max_users - totalUsers} slots remaining)`}
                    </p>
                    <p className="mt-1 text-xs text-blue-600">
                      Note: The organization owner is not included in the user count. Only invited users are listed below.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Section</p>
                <h2 className="text-2xl font-semibold text-slate-900">Users & Invitations</h2>
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

      {showInviteUserForm && (() => {
        // Compute enterprise ID at render time to ensure we have the latest value
        const currentEnterpriseId = selectedEnterprise?.id ?? (enterprises && enterprises.length > 0 ? enterprises[0]?.id : null);
        
        if (!currentEnterpriseId) {
          // If no enterprise ID, close the form and show error
          console.error('[INVITE] No enterprise ID when rendering form!');
          // Use setTimeout to avoid state update during render
          setTimeout(() => {
            setShowInviteUserForm(false);
            toast({
              title: "No Organization Found",
              description: "You need to create an organization first before inviting users. Please create one and try again.",
              variant: "destructive",
              duration: 5000,
            });
          }, 0);
          return null;
        }
        
        return (
        <InviteUserForm
            enterpriseId={currentEnterpriseId}
          teamName={inviteContextTeam}
          onClose={() => {
            setShowInviteUserForm(false);
            setInviteContextTeam(undefined);
          }}
          onSuccess={() => {
              loadEnterpriseDetails(currentEnterpriseId);
            setShowInviteUserForm(false);
            setInviteContextTeam(undefined);
          }}
        />
        );
      })()}
    </div>
  );
}