export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createResumeClient } from "@/lib/supabase/resume";
import type { ContactLead, ResumeUser } from "@/lib/types";
import { DeleteLeadButton, DeleteUserButton } from "./DeleteButtons";

function formatDate(ts: string | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function RoleBadge({ role }: { role: string }) {
  const isAdmin = role === "admin";
  return (
    <span
      className="badge font-label"
      style={{
        fontSize: "0.52rem",
        letterSpacing: "0.1em",
        background: isAdmin ? "rgba(209,188,255,0.08)" : "rgba(139,145,160,0.08)",
        border: `1px solid ${isAdmin ? "rgba(209,188,255,0.3)" : "rgba(139,145,160,0.2)"}`,
        color: isAdmin ? "#d1bcff" : "var(--text-muted)",
        padding: "2px 8px",
      }}
    >
      {role.toUpperCase()}
    </span>
  );
}

export default async function LeadsPage() {
  const user = await getCurrentUser();
  if (!user?.isOwner) redirect("/dashboard");

  const supabase = createResumeClient();

  const [leadsRes, usersRes] = await Promise.all([
    supabase
      .from("contact_leads")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  const leads = (leadsRes.data || []) as ContactLead[];
  const users = (usersRes.data || []) as ResumeUser[];

  const totalLeads = leads.length;
  const totalUsers = users.length;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const recentLeads = leads.filter(
    (l) => l.created_at && new Date(l.created_at) >= weekAgo
  ).length;

  return (
    <div className="p-4 sm:p-6 md:p-10 animate-fade-in">
      {/* Header */}
      <div className="mb-10">
        <div
          className="font-label text-outline mb-2"
          style={{ fontSize: "0.6rem", letterSpacing: "0.25em" }}
        >
          RESUME PROJECT
        </div>
        <h1
          className="font-display text-3xl"
          style={{ letterSpacing: "-0.02em", color: "var(--text-primary)" }}
        >
          Lead Tracker
        </h1>
        <div
          className="mt-3"
          style={{
            width: "60px",
            height: "1px",
            background: "linear-gradient(90deg, rgba(209,188,255,0.5), transparent)",
          }}
        />
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-6 mb-8 md:mb-10">
        <div>
          <div
            className="font-label text-outline mb-1"
            style={{ fontSize: "0.55rem", letterSpacing: "0.15em" }}
          >
            TOTAL LEADS
          </div>
          <div
            className="font-display"
            style={{ fontSize: "1.8rem", letterSpacing: "-0.02em", color: "var(--text-primary)" }}
          >
            {totalLeads}
          </div>
        </div>
        <div className="hidden sm:block" style={{ width: "1px", background: "var(--border-subtle)" }} />
        <div>
          <div
            className="font-label mb-1"
            style={{ fontSize: "0.55rem", letterSpacing: "0.15em", color: "#d1bcff" }}
          >
            LAST 7 DAYS
          </div>
          <div
            className="font-display"
            style={{ fontSize: "1.8rem", letterSpacing: "-0.02em", color: "#d1bcff" }}
          >
            {recentLeads}
          </div>
        </div>
        <div className="hidden sm:block" style={{ width: "1px", background: "var(--border-subtle)" }} />
        <div>
          <div
            className="font-label mb-1"
            style={{ fontSize: "0.55rem", letterSpacing: "0.15em", color: "#3b82f6" }}
          >
            REGISTERED USERS
          </div>
          <div
            className="font-display"
            style={{ fontSize: "1.8rem", letterSpacing: "-0.02em", color: "#3b82f6" }}
          >
            {totalUsers}
          </div>
        </div>
      </div>

      {/* Errors */}
      {(leadsRes.error || usersRes.error) && (
        <div
          className="font-label text-ruby-red mb-6"
          style={{ fontSize: "0.65rem", letterSpacing: "0.1em" }}
        >
          ERROR: {leadsRes.error?.message || usersRes.error?.message}
        </div>
      )}

      {/* ── Contact Leads ─────────────────────────────────────── */}
      <div className="mb-12">
        <div className="flex items-center gap-4 mb-4">
          <h2
            className="font-label"
            style={{ fontSize: "0.65rem", letterSpacing: "0.2em", color: "var(--text-primary)" }}
          >
            CONTACT LEADS
          </h2>
          <div style={{ flex: 1, height: "1px", background: "var(--border-subtle)" }} />
          <span
            className="font-label text-outline"
            style={{ fontSize: "0.52rem", letterSpacing: "0.1em" }}
          >
            {totalLeads} TOTAL
          </span>
        </div>

        {leads.length === 0 ? (
          <div
            className="p-10 text-center"
            style={{ border: "1px solid var(--border-subtle)" }}
          >
            <span
              className="font-label text-outline"
              style={{ fontSize: "0.65rem", letterSpacing: "0.2em" }}
            >
              NO LEADS YET
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            {leads.map((lead) => (
              <div
                key={lead.id}
                className="p-5"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                  borderLeft: "2px solid rgba(59,130,246,0.4)",
                }}
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="font-label"
                      style={{ fontSize: "0.65rem", letterSpacing: "0.08em", color: "var(--text-primary)" }}
                    >
                      {lead.name}
                    </span>
                    <span
                      className="font-label text-outline"
                      style={{ fontSize: "0.58rem", letterSpacing: "0.04em" }}
                    >
                      {lead.email}
                    </span>
                    {lead.phone && (
                      <span
                        className="font-label text-outline"
                        style={{ fontSize: "0.55rem", letterSpacing: "0.04em" }}
                      >
                        {lead.phone}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span
                      className="font-label text-outline"
                      style={{ fontSize: "0.52rem", letterSpacing: "0.08em" }}
                    >
                      {formatDate(lead.created_at)}
                    </span>
                    <DeleteLeadButton id={lead.id} />
                  </div>
                </div>
                {lead.subject && (
                  <div
                    className="font-label mb-2"
                    style={{ fontSize: "0.58rem", letterSpacing: "0.06em", color: "#d1bcff" }}
                  >
                    {lead.subject}
                  </div>
                )}
                <p
                  className="text-outline font-light text-sm leading-relaxed"
                  style={{ fontSize: "0.8rem" }}
                >
                  {lead.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Users ─────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-4 mb-4">
          <h2
            className="font-label"
            style={{ fontSize: "0.65rem", letterSpacing: "0.2em", color: "var(--text-primary)" }}
          >
            REGISTERED USERS
          </h2>
          <div style={{ flex: 1, height: "1px", background: "var(--border-subtle)" }} />
          <span
            className="font-label text-outline"
            style={{ fontSize: "0.52rem", letterSpacing: "0.1em" }}
          >
            {totalUsers} TOTAL
          </span>
        </div>

        {users.length === 0 ? (
          <div
            className="p-10 text-center"
            style={{ border: "1px solid var(--border-subtle)" }}
          >
            <span
              className="font-label text-outline"
              style={{ fontSize: "0.65rem", letterSpacing: "0.2em" }}
            >
              NO USERS YET
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((user) => (
              <div
                key={user.id}
                className="p-4"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                  borderLeft: user.role === "admin"
                    ? "2px solid rgba(209,188,255,0.4)"
                    : "2px solid var(--border-subtle)",
                }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="font-label"
                      style={{ fontSize: "0.65rem", letterSpacing: "0.08em", color: "var(--text-primary)" }}
                    >
                      {user.name || "—"}
                    </span>
                    <span
                      className="font-label text-outline"
                      style={{ fontSize: "0.58rem", letterSpacing: "0.04em" }}
                    >
                      {user.email}
                    </span>
                    <RoleBadge role={user.role} />
                    {user.is_first_user && (
                      <span
                        className="font-label"
                        style={{
                          fontSize: "0.5rem",
                          letterSpacing: "0.1em",
                          color: "#3b82f6",
                          border: "1px solid rgba(59,130,246,0.3)",
                          padding: "2px 6px",
                        }}
                      >
                        FIRST USER
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span
                      className="font-label text-outline"
                      style={{ fontSize: "0.52rem", letterSpacing: "0.08em" }}
                    >
                      {formatDate(user.created_at)}
                    </span>
                    <DeleteUserButton id={user.id} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
