"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useSection } from "@/lib/section-context";
import { supabase } from "@/lib/supabase/client";
import { SECTIONS, type SectionKey } from "@/lib/constants";
import { Shield, UserPlus, Pencil, UserX, Check, X, Users, UserCheck } from "lucide-react";
import { toast } from "sonner";

interface UserRoleRow {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  role: string;
  allowed_sections: string[];
  is_active: boolean;
  created_at: string;
}

const ROLES = [
  { value: "viewer", label: "Viewer" },
  { value: "sales", label: "Sales Rep" },
  { value: "cs", label: "CS Manager" },
  { value: "pm", label: "Project Manager" },
  { value: "manager", label: "Manager" },
  { value: "leadership", label: "Leadership" },
  { value: "admin", label: "Admin" },
];

const ROLE_SECTION_DEFAULTS: Record<string, string[]> = {
  viewer: ["sales"],
  sales: ["sales"],
  cs: ["cs"],
  pm: ["internal"],
  manager: ["all", "sales", "cs"],
  leadership: ["all", "sales", "cs", "internal"],
  admin: ["all", "sales", "cs", "internal"],
};

export default function AdminPage() {
  const { isAdmin } = useSection();
  const [users, setUsers] = useState<UserRoleRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editSections, setEditSections] = useState<string[]>([]);
  const [editName, setEditName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("viewer");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
    loadUsers();
  }, []);

  async function loadUsers() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("user_roles")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Failed to load users");
    } else {
      setUsers((data ?? []) as UserRoleRow[]);
    }
    setIsLoading(false);
  }

  function startEdit(user: UserRoleRow) {
    setEditingId(user.id);
    setEditRole(user.role);
    setEditSections(user.allowed_sections);
    setEditName(user.display_name ?? "");
  }

  async function saveEdit(userId: string) {
    const { error } = await supabase
      .from("user_roles")
      .update({
        role: editRole,
        allowed_sections: editSections,
        display_name: editName || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      toast.error("Failed to update user");
    } else {
      toast.success("User updated");
      setEditingId(null);
      loadUsers();
    }
  }

  async function toggleActive(user: UserRoleRow) {
    const { error } = await supabase
      .from("user_roles")
      .update({ is_active: !user.is_active, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (error) {
      toast.error("Failed to update user status");
    } else {
      toast.success(user.is_active ? "User deactivated" : "User activated");
      loadUsers();
    }
  }

  async function addUser() {
    if (!newEmail) { toast.error("Email is required"); return; }

    const sections = ROLE_SECTION_DEFAULTS[newRole] ?? ["sales"];

    const { data: { user: currentUser } } = await supabase.auth.getUser();

    const { error } = await supabase.from("user_roles").insert({
      user_id: crypto.randomUUID(),
      email: newEmail,
      display_name: newName || null,
      role: newRole,
      allowed_sections: sections,
      created_by: currentUser?.id,
    });

    if (error) {
      toast.error(`Failed to add user: ${error.message}`);
    } else {
      toast.success(`User ${newEmail} added with role ${newRole}`);
      setNewEmail("");
      setNewName("");
      setNewRole("viewer");
      setShowAddForm(false);
      loadUsers();
    }
  }

  function toggleSection(section: string) {
    setEditSections((prev) => {
      if (prev.includes(section) && prev.length <= 1) {
        toast.error("At least one section is required");
        return prev;
      }
      return prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section];
    });
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold">Access Restricted</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Only leadership and admin users can access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="User Management"
          description={`${users.length} users configured`}
        />
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="gap-2 bg-[#146DFA] hover:bg-[#146DFA]/90"
        >
          <UserPlus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3">Add New User</h3>
            <div className="grid gap-3 sm:grid-cols-4">
              <div>
                <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Email</label>
                <Input
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="user@fullfunnel.co"
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Name</label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Full name"
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Role</label>
                <Select value={newRole} onValueChange={(v) => setNewRole(v ?? "viewer")}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={addUser} size="sm" className="bg-[#146DFA] hover:bg-[#146DFA]/90">
                  Add
                </Button>
                <Button onClick={() => setShowAddForm(false)} size="sm" variant="ghost">
                  Cancel
                </Button>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              Note: User must also exist in Supabase Auth. This sets their dashboard role and section access.
            </p>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">User</th>
                <th className="text-left px-3 py-2.5 font-medium text-xs text-muted-foreground">Role</th>
                <th className="text-left px-3 py-2.5 font-medium text-xs text-muted-foreground">Sections</th>
                <th className="text-center px-3 py-2.5 font-medium text-xs text-muted-foreground">Status</th>
                <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    {editingId === user.id ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-7 text-xs w-40"
                        placeholder="Display name"
                      />
                    ) : (
                      <div>
                        <p className="font-medium text-sm">{user.display_name || user.email.split("@")[0]}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {editingId === user.id ? (
                      <Select value={editRole} onValueChange={(v) => setEditRole(v ?? "viewer")}>
                        <SelectTrigger className="h-7 text-xs w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map((r) => (
                            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded">
                        {ROLES.find((r) => r.value === user.role)?.label ?? user.role}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {editingId === user.id ? (
                      <div className="flex flex-wrap gap-1">
                        {(Object.keys(SECTIONS) as SectionKey[]).map((key) => (
                          <button
                            key={key}
                            onClick={() => toggleSection(key)}
                            className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                              editSections.includes(key)
                                ? "bg-[#146DFA] text-white border-[#146DFA]"
                                : "border-border text-muted-foreground hover:border-[#146DFA]/50"
                            }`}
                          >
                            {SECTIONS[key].shortLabel}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {user.allowed_sections.map((s) => (
                          <span key={s} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                            {(SECTIONS as Record<string, { shortLabel: string }>)[s]?.shortLabel ?? s}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`inline-block h-2 w-2 rounded-full ${user.is_active ? "bg-emerald-500" : "bg-red-400"}`} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editingId === user.id ? (
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => saveEdit(user.id)} className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded" title="Save">
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1 text-muted-foreground hover:bg-muted rounded" title="Cancel">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => startEdit(user)} className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded" title="Edit">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        {user.user_id !== currentUserId && (
                          <button
                            onClick={() => toggleActive(user)}
                            className={`p-1 rounded ${user.is_active ? "text-red-400 hover:bg-red-400/10" : "text-emerald-500 hover:bg-emerald-500/10"}`}
                            title={user.is_active ? "Deactivate user" : "Activate user"}
                          >
                            {user.is_active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-xs font-semibold">Role Reference</h3>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-xs">
            {ROLES.map((r) => (
              <div key={r.value} className="flex items-center gap-2">
                <span className="font-medium w-24">{r.label}</span>
                <span className="text-muted-foreground">
                  {(ROLE_SECTION_DEFAULTS[r.value] ?? []).join(", ")}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
