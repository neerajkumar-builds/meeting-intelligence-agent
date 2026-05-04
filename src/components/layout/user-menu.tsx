"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import { useSection } from "@/lib/section-context";
import { SECTIONS } from "@/lib/constants";
import { LogOut, Pencil, Lock } from "lucide-react";
import { toast } from "sonner";

interface UserInfo {
  email: string;
  displayName: string;
}

export function UserMenu() {
  const router = useRouter();
  const { userRole, allowedSections } = useSection();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({
          email: data.user.email ?? "",
          displayName: data.user.user_metadata?.full_name ?? data.user.email?.split("@")[0] ?? "",
        });
      }
    });
  }, []);

  function getInitials(name: string): string {
    return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  }

  function openEdit() {
    setEditName(user?.displayName ?? "");
    setNewPassword("");
    setConfirmPassword("");
    setMenuOpen(false);
    setEditOpen(true);
  }

  async function saveProfile() {
    setIsSaving(true);
    try {
      const updates: Record<string, unknown> = {};

      if (editName && editName !== user?.displayName) {
        updates.data = { full_name: editName };
      }

      if (newPassword) {
        if (newPassword.length < 6) {
          toast.error("Password must be at least 6 characters");
          setIsSaving(false);
          return;
        }
        if (newPassword !== confirmPassword) {
          toast.error("Passwords do not match");
          setIsSaving(false);
          return;
        }
        updates.password = newPassword;
      }

      if (Object.keys(updates).length === 0) {
        toast.error("No changes to save");
        setIsSaving(false);
        return;
      }

      const { error } = await supabase.auth.updateUser(updates);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Profile updated");
        if (editName) {
          setUser(prev => prev ? { ...prev, displayName: editName } : prev);
          await supabase.from("user_roles").update({
            display_name: editName,
            updated_at: new Date().toISOString(),
          }).eq("email", user?.email);
        }
        setEditOpen(false);
      }
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSignOut() {
    setMenuOpen(false);
    if (!window.confirm("Sign out?")) return;
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (!user) return null;

  const initials = getInitials(user.displayName);
  const roleLabel = userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : "User";
  const sectionLabels = allowedSections.map(s => SECTIONS[s]?.shortLabel ?? s).join(", ");

  return (
    <>
      <Popover open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverTrigger className="flex items-center gap-1.5 rounded-full hover:bg-muted transition-colors px-1 py-1">
          <div className="h-7 w-7 rounded-full bg-[#146DFA] flex items-center justify-center text-white text-[10px] font-semibold">
            {initials}
          </div>
        </PopoverTrigger>
        <PopoverContent align="end" side="bottom" sideOffset={8} className="w-64 p-0">
          <div className="p-3 border-b">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full bg-[#146DFA] flex items-center justify-center text-white text-xs font-semibold shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{user.displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded">{roleLabel}</span>
              <span className="text-[10px] text-muted-foreground">{sectionLabels}</span>
            </div>
          </div>
          <div className="p-1">
            <button
              onClick={openEdit}
              className="flex items-center gap-2 w-full rounded-md px-2.5 py-2 text-sm hover:bg-muted transition-colors"
            >
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              Edit Profile
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 w-full rounded-md px-2.5 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="sr-only">Edit Profile</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center pt-2 pb-4">
            <div className="h-16 w-16 rounded-full bg-[#146DFA] flex items-center justify-center text-white text-xl font-semibold mb-3">
              {initials}
            </div>
            <p className="text-sm font-semibold">{user.displayName}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Display Name</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            <div className="rounded-lg bg-muted/50 border p-3 space-y-2">
              <div className="flex items-center gap-1.5 mb-1">
                <Lock className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Managed by admin</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-muted-foreground">Email</p>
                  <p className="text-xs font-medium truncate">{user.email}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Role</p>
                  <p className="text-xs font-medium">{roleLabel}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] text-muted-foreground">Sections</p>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {allowedSections.map(s => (
                      <span key={s} className="text-[10px] bg-background border px-1.5 py-0.5 rounded">
                        {SECTIONS[s]?.shortLabel ?? s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-xs font-medium mb-3">Change Password</p>
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="New password (min 6 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-9 text-sm"
                />
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={saveProfile} disabled={isSaving} className="bg-[#146DFA] hover:bg-[#146DFA]/90">
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
