import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: NextRequest) {
  try {
    const { email, password, displayName, role, allowedSections } = await request.json();

    if (!email || !password) {
      return Response.json({ error: "Email and password are required" }, { status: 400 });
    }

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: displayName || email.split("@")[0] },
    });

    if (authError) {
      if (authError.message?.includes("already been registered")) {
        return Response.json({ error: "User with this email already exists in auth" }, { status: 409 });
      }
      return Response.json({ error: authError.message }, { status: 400 });
    }

    const { error: roleError } = await supabaseAdmin.from("user_roles").upsert({
      user_id: authUser.user.id,
      email,
      display_name: displayName || null,
      role: role || "viewer",
      allowed_sections: allowedSections || ["sales"],
    }, { onConflict: "email" });

    if (roleError) {
      return Response.json({ error: `Auth created but role failed: ${roleError.message}` }, { status: 500 });
    }

    return Response.json({
      success: true,
      user: { email, displayName, role, id: authUser.user.id },
    });
  } catch (err) {
    console.error("Admin create user error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { email, newPassword } = await request.json();

    if (!email || !newPassword) {
      return Response.json({ error: "Email and new password are required" }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return Response.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const authUser = users?.users?.find(u => u.email === email);

    if (!authUser) {
      return Response.json({ error: "User not found in auth" }, { status: 404 });
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
      password: newPassword,
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("Admin reset password error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
