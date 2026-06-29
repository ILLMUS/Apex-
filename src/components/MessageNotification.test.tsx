import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MessageNotification from "./MessageNotification";

// ---- Mock supabase client ----
type Row = Record<string, any>;
const state: {
  user_roles: Row[];
  applications: Row[];
  application_messages: Row[];
  contact_messages: Row[];
} = { user_roles: [], applications: [], application_messages: [], contact_messages: [] };

const channel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnThis(),
};

vi.mock("@/integrations/supabase/client", () => {
  const from = (table: keyof typeof state) => {
    const builder: any = {
      _filters: [] as Array<(r: Row) => boolean>,
      _head: false,
      select(_cols: string, opts?: { count?: string; head?: boolean }) {
        builder._head = !!opts?.head;
        return builder;
      },
      eq(col: string, val: any) {
        builder._filters.push((r) => r[col] === val);
        return builder;
      },
      is(col: string, val: any) {
        builder._filters.push((r) => r[col] === val);
        return builder;
      },
      in(col: string, vals: any[]) {
        builder._filters.push((r) => vals.includes(r[col]));
        return builder;
      },
      then(resolve: any) {
        const rows = state[table].filter((r) => builder._filters.every((f) => f(r)));
        resolve({ data: builder._head ? null : rows, count: rows.length, error: null });
      },
    };
    return builder;
  };
  return {
    supabase: {
      from,
      channel: () => channel,
      removeChannel: vi.fn(),
    },
  };
});

const renderNotif = (userId: string) =>
  render(
    <MemoryRouter>
      <MessageNotification userId={userId} />
    </MemoryRouter>,
  );

beforeEach(() => {
  state.user_roles = [];
  state.applications = [];
  state.application_messages = [];
  state.contact_messages = [];
  cleanup();
});

describe("MessageNotification unread badge", () => {
  it("shows admin unread count from contact_messages", async () => {
    const adminId = "admin-1";
    state.user_roles = [{ user_id: adminId, role: "admin" }];
    state.contact_messages = [
      { id: "c1", is_read: false },
      { id: "c2", is_read: false },
      { id: "c3", is_read: true },
    ];
    renderNotif(adminId);
    expect(await screen.findByText("2")).toBeInTheDocument();
    expect(screen.getByLabelText(/2 unread/i)).toHaveAttribute("href", "/admin");
  });

  it("shows parent unread count from application_messages they own", async () => {
    const parentId = "parent-1";
    state.applications = [
      { id: "app-1", parent_user_id: parentId },
      { id: "app-2", parent_user_id: parentId },
    ];
    state.application_messages = [
      { id: "m1", application_id: "app-1", sender_role: "admin", read_at: null },
      { id: "m2", application_id: "app-2", sender_role: "admin", read_at: null },
      { id: "m3", application_id: "app-1", sender_role: "admin", read_at: "2026-01-01" },
      { id: "m4", application_id: "app-1", sender_role: "parent", read_at: null },
    ];
    renderNotif(parentId);
    expect(await screen.findByText("2")).toBeInTheDocument();
    expect(screen.getByLabelText(/2 unread/i)).toHaveAttribute("href", "/parent");
  });

  it("recomputes count on remount (simulated page refresh)", async () => {
    const adminId = "admin-2";
    state.user_roles = [{ user_id: adminId, role: "admin" }];
    state.contact_messages = [{ id: "c1", is_read: false }];
    const first = renderNotif(adminId);
    expect(await screen.findByText("1")).toBeInTheDocument();
    first.unmount();

    state.contact_messages.push({ id: "c2", is_read: false }, { id: "c3", is_read: false });
    renderNotif(adminId);
    expect(await screen.findByText("3")).toBeInTheDocument();
  });

  it("renders no badge when there are zero unread", async () => {
    const parentId = "parent-2";
    state.applications = [{ id: "app-9", parent_user_id: parentId }];
    renderNotif(parentId);
    await waitFor(() => expect(screen.getByLabelText("Messages")).toBeInTheDocument());
    expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument();
  });
});
