// src/pages/EnterpriseDashboard.tsx
import { useState, useEffect, useMemo, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Building2,
  Users,
  Mail,
  Search,
  Settings,
  ChevronDown,
  RefreshCw,
  Edit,
  Trash2,
  X,
  CheckCircle,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [editingUserSettings, setEditingUserSettings] = useState<{
    userId: string;
    userName: string;
    userEmail: string;
  } | null>(null);
  const [userSettingsData, setUserSettingsData] = useState<any>(null);
  const [loadingUserSettings, setLoadingUserSettings] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);

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

  // Auto-refresh invitations and users every 15 seconds when on overview tab
  useEffect(() => {
    if (activeSidebarItem === "overview" && selectedEnterprise?.id) {
      const interval = setInterval(() => {
        console.log('[EnterpriseDashboard] Auto-refreshing invitations and users...');
        loadEnterpriseDetails(selectedEnterprise.id);
      }, 15000); // Refresh every 15 seconds for faster updates

      return () => clearInterval(interval);
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
        const newUsers = r.success ? r.users || [] : [];
        
        // Check if new users were added (invitation accepted)
        const previousUserIds = new Set(users.map(u => u.user_id));
        const newUserIds = new Set(newUsers.map((u: any) => u.user_id));
        const newlyAccepted = newUsers.filter((u: any) => !previousUserIds.has(u.user_id));
        
        if (newlyAccepted.length > 0 && users.length > 0) {
          toast({
            title: "New User Joined!",
            description: `${newlyAccepted.length} user${newlyAccepted.length > 1 ? 's' : ''} accepted invitation${newlyAccepted.length > 1 ? 's' : ''}`,
          });
        }
        
        setUsers(newUsers);
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
        const newInvitations = r.success ? r.invitations || [] : [];
        
        // Check if any invitations changed from pending to accepted
        const previousInvitationsMap = new Map(invitations.map(inv => [inv.id, inv.status]));
        const newlyAcceptedInvitations = newInvitations.filter((inv: any) => {
          const prevStatus = previousInvitationsMap.get(inv.id);
          return prevStatus === 'pending' && inv.status === 'accepted';
        });
        
        if (newlyAcceptedInvitations.length > 0 && invitations.length > 0) {
          toast({
            title: "Invitation Accepted!",
            description: `${newlyAcceptedInvitations.map((inv: any) => inv.email).join(', ')} accepted the invitation`,
          });
        }
        
        setInvitations(newInvitations);
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
        // Handle error response - check both error and message fields
        const errorMsg = r.error || r.message || "Failed to cancel invitation";
        toast({ 
          title: "Error", 
          description: typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg),
          variant: "destructive" 
        });
      }
    } catch (err: any) {
      // Handle exception - extract error message properly
      let errorMsg = "Failed to cancel invitation";
      if (err?.message) {
        errorMsg = err.message;
      } else if (err?.error) {
        errorMsg = typeof err.error === 'string' ? err.error : JSON.stringify(err.error);
      } else if (err?.data?.error) {
        errorMsg = typeof err.data.error === 'string' ? err.data.error : JSON.stringify(err.data.error);
      } else if (typeof err === 'string') {
        errorMsg = err;
      }
      
      toast({ 
        title: "Error", 
        description: errorMsg,
        variant: "destructive" 
      });
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

  async function handleEditUserSettings(userId: string, userEmail: string, firstName?: string, lastName?: string) {
    if (!selectedEnterprise?.id) return;
    
    setLoadingUserSettings(true);
    setEditingUserSettings({
      userId,
      userName: firstName || lastName ? `${firstName || ''} ${lastName || ''}`.trim() : userEmail,
      userEmail
    });
    
    try {
      const result: any = await api.getEnterpriseUserSettings(selectedEnterprise.id, userId);
      if (result.success) {
        setUserSettingsData(result.settings || {});
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to load user settings",
          variant: "destructive"
        });
        setEditingUserSettings(null);
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to load user settings",
        variant: "destructive"
      });
      setEditingUserSettings(null);
    } finally {
      setLoadingUserSettings(false);
    }
  }

  async function handleSaveUserSettings() {
    if (!selectedEnterprise?.id || !editingUserSettings) return;
    
    setLoadingUserSettings(true);
    try {
      const result: any = await api.updateEnterpriseUserSettings(
        selectedEnterprise.id,
        editingUserSettings.userId,
        userSettingsData
      );
      
      if (result.success) {
        toast({
          title: "Success",
          description: "User settings updated successfully"
        });
        setEditingUserSettings(null);
        setUserSettingsData(null);
        // Refresh settings history
        if (selectedEnterprise.id) {
          loadSettingsHistory(selectedEnterprise.id);
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update settings",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to update settings",
        variant: "destructive"
      });
    } finally {
      setLoadingUserSettings(false);
    }
  }

  async function handleDeleteUser(userRelationId: string, userName: string, userEmail: string) {
    setDeleteUserId(userRelationId);
  }

  async function confirmDeleteUser() {
    if (!deleteUserId || !selectedEnterprise?.id) return;
    
    setDeletingUser(true);
    try {
      const result: any = await api.deleteEnterpriseUser(deleteUserId);
      
      if (result.success) {
        toast({
          title: "User Deleted",
          description: result.message || "User has been removed from the organization",
        });
        
        // Refresh users list
        if (selectedEnterprise.id) {
          await loadEnterpriseDetails(selectedEnterprise.id);
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete user",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      console.error("Error deleting user:", err);
      toast({
        title: "Error",
        description: err?.message || "Failed to delete user. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeletingUser(false);
      setDeleteUserId(null);
    }
  }

  async function handleDeleteUserSettings() {
    if (!selectedEnterprise?.id || !editingUserSettings) return;
    
    if (!window.confirm(`Are you sure you want to delete all settings for ${editingUserSettings.userName}? This action cannot be undone.`)) {
      return;
    }
    
    setLoadingUserSettings(true);
    try {
      const result: any = await api.deleteEnterpriseUserSettings(
        selectedEnterprise.id,
        editingUserSettings.userId
      );
      
      if (result.success) {
        toast({
          title: "Success",
          description: "User settings deleted successfully"
        });
        setEditingUserSettings(null);
        setUserSettingsData(null);
        // Refresh settings history
        if (selectedEnterprise.id) {
          loadSettingsHistory(selectedEnterprise.id);
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete settings",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to delete settings",
        variant: "destructive"
      });
    } finally {
      setLoadingUserSettings(false);
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

          {/* Members View - Accepted Users */}
          {activeSidebarItem === "members" && (
            <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Members</h2>
                  <p className="mt-1 text-sm text-slate-500">Users who have accepted your invitations</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => selectedEnterprise?.id && loadEnterpriseDetails(selectedEnterprise.id)}
                  disabled={isLoading || !selectedEnterprise?.id}
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
                  <p className="mt-2 text-sm text-slate-500">Please select or create an organization to view members</p>
                </div>
              ) : users.length === 0 ? (
                <div className="py-24 text-center">
                  <Users className="mx-auto mb-6 h-12 w-12 text-slate-300" />
                  <h3 className="text-lg font-semibold text-slate-900">No members yet</h3>
                  <p className="mt-2 text-sm text-slate-500">Users who accept your invitations will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Search for members */}
                  <div className="mb-6">
                    <Input
                      placeholder="Search members by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-md"
                    />
                  </div>

                  {/* Members Grid - Card Layout */}
                  <div className="grid gap-4">
                    {users
                      .filter((user) => {
                        if (!searchTerm) return true;
                        const search = searchTerm.toLowerCase();
                        const name = `${user.first_name || ''} ${user.last_name || ''}`.trim().toLowerCase();
                        const email = (user.email || '').toLowerCase();
                        return name.includes(search) || email.includes(search);
                      })
                      .map((user) => {
                        const userName = user.first_name || user.last_name 
                          ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                          : user.email || 'Unknown User';
                        
                        return (
                          <Card key={user.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                              <div className="flex justify-between items-start">
                                <div className="space-y-2 flex-1">
                                  <div className="flex items-center gap-3">
                                    <h4 className="font-semibold text-lg text-slate-900">{userName}</h4>
                                    {user.has_accepted_invitation && (
                                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-xs">
                                        ✓ Accepted Invitation
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-slate-600">{user.email}</p>
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant="outline"
                                      className="capitalize bg-slate-100 text-slate-700 border-slate-300"
                                    >
                                      {user.role || 'member'}
                                    </Badge>
                                    {user.joined_at && (
                                      <span className="text-xs text-slate-500">
                                        Joined {new Date(user.joined_at).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      handleEditUserSettings(user.user_id, user.email, user.first_name, user.last_name);
                                      setActiveSidebarItem("settings");
                                    }}
                                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                                  >
                                    <Settings className="h-4 w-4 mr-1" />
                                    Settings
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteUser(user.id, userName, user.email)}
                                    className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                  </div>
                </div>
              )}
            </section>
          )}

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

          {/* Settings View - Time Restrictions & User Settings */}
          {activeSidebarItem === "settings" && (
            <section className="mt-12 space-y-8">
              {/* Organization Settings */}
              <div>
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
              </div>

              {/* User Settings Management */}
              {selectedEnterprise && (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-900">User Settings</h2>
                    <p className="mt-1 text-sm text-slate-500">Edit health settings for organization members</p>
                  </div>

                  {/* User Selector */}
                  <div className="mb-6">
                    <Label htmlFor="user-select" className="text-sm font-semibold text-slate-700 mb-2 block">
                      Select User to Edit Settings
                    </Label>
                    <Select
                      value={editingUserSettings?.userId || ""}
                      onValueChange={(userId) => {
                        const user = users.find(u => u.user_id === userId);
                        if (user) {
                          handleEditUserSettings(user.user_id, user.email, user.first_name, user.last_name);
                        }
                      }}
                    >
                      <SelectTrigger id="user-select" className="w-full max-w-md">
                        <SelectValue placeholder="Choose a user to edit their settings" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.length === 0 ? (
                          <SelectItem value="no-users" disabled>No members available</SelectItem>
                        ) : (
                          users.map((user) => {
                            const userName = user.first_name || user.last_name 
                              ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                              : user.email || 'Unknown User';
                            return (
                              <SelectItem key={user.user_id} value={user.user_id}>
                                {userName} ({user.email})
                              </SelectItem>
                            );
                          })
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* User Settings Form */}
                  {editingUserSettings && (
                    <Card className="border-slate-200">
                      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200">
                        <CardTitle>Edit Settings for {editingUserSettings.userName}</CardTitle>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setEditingUserSettings(null);
                            setUserSettingsData(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-6">
                        {loadingUserSettings ? (
                          <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                          </div>
                        ) : (
                          <>
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="age">Age</Label>
                                  <Input
                                    id="age"
                                    type="number"
                                    value={userSettingsData?.age || ''}
                                    onChange={(e) => setUserSettingsData({
                                      ...userSettingsData,
                                      age: e.target.value ? parseInt(e.target.value) : undefined
                                    })}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Gender</Label>
                                  <Select
                                    value={userSettingsData?.gender || ''}
                                    onValueChange={(value) => setUserSettingsData({
                                      ...userSettingsData,
                                      gender: value
                                    })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="male">Male</SelectItem>
                                      <SelectItem value="female">Female</SelectItem>
                                      <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label>Height (cm)</Label>
                                  <Input
                                    type="number"
                                    value={userSettingsData?.height || ''}
                                    onChange={(e) => setUserSettingsData({
                                      ...userSettingsData,
                                      height: e.target.value ? parseFloat(e.target.value) : undefined
                                    })}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Weight (kg)</Label>
                                  <Input
                                    type="number"
                                    value={userSettingsData?.weight || ''}
                                    onChange={(e) => setUserSettingsData({
                                      ...userSettingsData,
                                      weight: e.target.value ? parseFloat(e.target.value) : undefined
                                    })}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Waist Circumference (cm)</Label>
                                  <Input
                                    type="number"
                                    value={userSettingsData?.waist || ''}
                                    onChange={(e) => setUserSettingsData({
                                      ...userSettingsData,
                                      waist: e.target.value ? parseFloat(e.target.value) : undefined
                                    })}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Activity Level</Label>
                                  <Select
                                    value={userSettingsData?.activityLevel || ''}
                                    onValueChange={(value) => setUserSettingsData({
                                      ...userSettingsData,
                                      activityLevel: value
                                    })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select activity level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="sedentary">Sedentary</SelectItem>
                                      <SelectItem value="light">Light</SelectItem>
                                      <SelectItem value="moderate">Moderate</SelectItem>
                                      <SelectItem value="active">Active</SelectItem>
                                      <SelectItem value="very_active">Very Active</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label>Health Goal</Label>
                                  <Select
                                    value={userSettingsData?.goal || ''}
                                    onValueChange={(value) => setUserSettingsData({
                                      ...userSettingsData,
                                      goal: value
                                    })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select goal" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="heal">Heal & Manage Condition</SelectItem>
                                      <SelectItem value="maintain">Maintain Health</SelectItem>
                                      <SelectItem value="lose_weight">Lose Weight</SelectItem>
                                      <SelectItem value="gain_weight">Gain Weight</SelectItem>
                                      <SelectItem value="improve_fitness">Improve Fitness</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label>Location</Label>
                                  <Input
                                    value={userSettingsData?.location || ''}
                                    onChange={(e) => setUserSettingsData({
                                      ...userSettingsData,
                                      location: e.target.value
                                    })}
                                  />
                                </div>
                              </div>

                              {/* Health Condition Section - Prominent */}
                              <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="space-y-2">
                                  <Label className="text-base font-semibold text-blue-900">Health Condition Status</Label>
                                  <Select
                                    value={userSettingsData?.hasSickness ? 'yes' : 'no'}
                                    onValueChange={(value) => setUserSettingsData({
                                      ...userSettingsData,
                                      hasSickness: value === 'yes',
                                      ...(value === 'no' ? { sicknessType: '' } : {})
                                    })}
                                  >
                                    <SelectTrigger className="bg-white">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="yes">Yes, has health condition</SelectItem>
                                      <SelectItem value="no">No health condition</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                {userSettingsData?.hasSickness && (
                                  <div className="space-y-2">
                                    <Label className="text-blue-900">Condition Type</Label>
                                    <Input
                                      value={userSettingsData?.sicknessType || ''}
                                      onChange={(e) => setUserSettingsData({
                                        ...userSettingsData,
                                        sicknessType: e.target.value
                                      })}
                                      placeholder="Enter the specific health condition"
                                      className="bg-white"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex justify-between gap-2 pt-4 border-t">
                              <Button
                                variant="destructive"
                                onClick={handleDeleteUserSettings}
                                disabled={loadingUserSettings}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Settings
                              </Button>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setEditingUserSettings(null);
                                    setUserSettingsData(null);
                                  }}
                                  disabled={loadingUserSettings}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={handleSaveUserSettings}
                                  disabled={loadingUserSettings}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  {loadingUserSettings ? 'Saving...' : 'Save Changes'}
                                </Button>
                              </div>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {!editingUserSettings && users.length > 0 && (
                    <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
                      <Settings className="mx-auto mb-3 h-8 w-8 text-slate-400" />
                      <p className="text-sm text-slate-600">Select a user from the dropdown above to edit their settings</p>
                    </div>
                  )}

                  {!editingUserSettings && users.length === 0 && (
                    <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
                      <Users className="mx-auto mb-3 h-8 w-8 text-slate-400" />
                      <p className="text-sm text-slate-600">No members available. Invite users to start managing their settings.</p>
                    </div>
                  )}
                </div>
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
                <div className="mt-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">
                      {filteredInvitations.length} invitation{filteredInvitations.length !== 1 ? 's' : ''} total
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Auto-refreshes every 15 seconds • Click "Refresh Now" for immediate update
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (selectedEnterprise?.id) {
                        loadEnterpriseDetails(selectedEnterprise.id);
                        toast({
                          title: "Refreshing...",
                          description: "Checking for invitation status updates",
                        });
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh Now
                  </Button>
                </div>
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
                              <div className="flex flex-col gap-1">
                                <Badge 
                                  variant={
                                    inv.status === "accepted" ? "default" : 
                                    inv.status === "cancelled" ? "destructive" : 
                                    inv.status === "expired" ? "outline" : 
                                    "secondary"
                                  }
                                  className={
                                    inv.status === "accepted" 
                                      ? "bg-green-600 text-white font-semibold" 
                                      : ""
                                  }
                                >
                                  {inv.status === "accepted" ? "✓ Accepted" : (inv.status ?? "pending")}
                                </Badge>
                                {inv.status === "accepted" && inv.accepted_at && (
                                  <div className="mt-2 flex items-center gap-1 text-xs text-green-600 font-medium">
                                    <CheckCircle className="h-3 w-3" />
                                    <span>
                                      Accepted on {new Date(inv.accepted_at).toLocaleDateString()} at {new Date(inv.accepted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                )}
                              </div>
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
              <>
                <div className="mt-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">
                      {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} who accepted invitation{filteredUsers.length !== 1 ? 's' : ''}
                      {filteredUsers.length > 0 && (
                        <span className="ml-2 text-green-600 font-semibold">
                          ({filteredUsers.length} {filteredUsers.length === 1 ? 'has' : 'have'} joined)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Accepted users are now shown in the <strong>Members</strong> page. Click "Members" in the sidebar to view and manage them.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActiveSidebarItem("members");
                    }}
                    className="flex items-center gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Go to Members
                  </Button>
                </div>
                <div className="mt-10 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-12 text-center text-sm text-slate-500">
                  <Users className="mx-auto mb-4 h-12 w-12 text-slate-300" />
                  <p className="mb-2 font-medium">View members in the Members page</p>
                  <p className="text-xs text-slate-400">Click "Members" in the sidebar to see all users who accepted your invitations.</p>
                </div>
              </>
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

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this user from your organization? This will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Remove them from the organization</li>
                <li>Delete their account completely</li>
                <li>Remove all their data</li>
              </ul>
              <p className="mt-3 font-semibold text-red-600">This action cannot be undone!</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingUser}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUser}
              disabled={deletingUser}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingUser ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                "Delete User"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}