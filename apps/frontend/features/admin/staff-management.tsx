"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, DataTable, Input, Modal } from "@karali/ui";
import { api } from "../../lib/api";

type StaffRecord = {
  _id: string;
  name: string;
  username: string;
  mobile: string;
  email: string;
  designation: string;
  role: "staff";
  status: "active" | "inactive";
  lastLogin?: string | null;
  createdAt?: string;
};

type StaffForm = {
  name: string;
  username: string;
  password: string;
  confirmPassword: string;
  mobile: string;
  email: string;
  designation: string;
  status: "active" | "inactive";
};

const emptyForm: StaffForm = {
  name: "",
  username: "",
  password: "",
  confirmPassword: "",
  mobile: "",
  email: "",
  designation: "",
  status: "active",
};

export function StaffManagement() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffRecord | null>(null);
  const [form, setForm] = useState<StaffForm>(emptyForm);
  const [resetPassword, setResetPassword] = useState({ newPassword: "", confirmPassword: "" });

  const { data: staff = [] } = useQuery({
    queryKey: ["admin-staff", search],
    queryFn: async () =>
      (await api.get<StaffRecord[]>("/admin/staff", { params: { search } })).data,
  });

  const counts = useMemo(
    () => ({
      total: staff.length,
      active: staff.filter((item) => item.status === "active").length,
      inactive: staff.filter((item) => item.status === "inactive").length,
    }),
    [staff],
  );

  useEffect(() => {
    if (selectedStaff && editOpen) {
      setForm({
        name: selectedStaff.name || "",
        username: selectedStaff.username || "",
        password: "",
        confirmPassword: "",
        mobile: selectedStaff.mobile || "",
        email: selectedStaff.email || "",
        designation: selectedStaff.designation || "",
        status: selectedStaff.status || "active",
      });
    }
  }, [editOpen, selectedStaff]);

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["admin-staff"] });
  }

  async function createStaff() {
    setMessage("");
    try {
      await api.post("/admin/staff", form);
      await refresh();
      setForm(emptyForm);
      setCreateOpen(false);
      setMessage("Staff account created.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create staff.");
    }
  }

  async function updateStaff() {
    if (!selectedStaff) return;
    setMessage("");
    try {
      await api.patch(`/admin/staff/${selectedStaff._id}`, {
        name: form.name,
        username: form.username,
        mobile: form.mobile,
        email: form.email,
        designation: form.designation,
        status: form.status,
      });
      await refresh();
      setEditOpen(false);
      setSelectedStaff(null);
      setMessage("Staff account updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update staff.");
    }
  }

  async function toggleStatus(staffMember: StaffRecord) {
    try {
      await api.patch(`/admin/staff/${staffMember._id}/status`, {
        status: staffMember.status === "active" ? "inactive" : "active",
      });
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update staff status.");
    }
  }

  async function removeStaff(staffMember: StaffRecord) {
    try {
      await api.delete(`/admin/staff/${staffMember._id}`);
      await refresh();
      setMessage("Staff account archived.");
      setDeleteConfirmOpen(false);
      setSelectedStaff(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to remove staff.");
    }
  }

  async function resetStaffPassword() {
    if (!selectedStaff) return;
    try {
      await api.patch(`/admin/staff/${selectedStaff._id}/reset-password`, resetPassword);
      setResetOpen(false);
      setSelectedStaff(null);
      setResetPassword({ newPassword: "", confirmPassword: "" });
      setMessage("Password reset successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to reset password.");
    }
  }

  return (
    <div className="space-y-8">
      <div className="lux-hero lux-reveal flex flex-col gap-4 p-4 sm:p-8 md:flex-row md:items-end md:justify-between md:p-10">
        <div>
          <p className="lux-eyebrow">People Operations</p>
          <h2 className="lux-heading mt-3 text-4xl font-bold text-[#231a13]">
            Staff Management
          </h2>
          <p className="mt-2 text-[#554336]">
            Create and maintain reception staff accounts, reset credentials, and control access.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Input value={search} onChange={(event: { target: { value: string } }) => setSearch(event.target.value)} placeholder="Search staff" />
          <Button type="button" onClick={() => { setForm(emptyForm); setCreateOpen(true); }}>
            Add Staff
          </Button>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <div className="text-xs uppercase tracking-[0.3em] text-[#554336]/60">Total Staff</div>
          <div className="mt-3 text-4xl font-bold text-[#231a13]">{counts.total}</div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-[0.3em] text-[#554336]/60">Active</div>
          <div className="mt-3 text-4xl font-bold text-[#231a13]">{counts.active}</div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-[0.3em] text-[#554336]/60">Inactive</div>
          <div className="mt-3 text-4xl font-bold text-[#231a13]">{counts.inactive}</div>
        </Card>
      </section>

      {message ? <div className="lux-chip">{message}</div> : null}

      <Card className="space-y-4 p-0">
        <DataTable
          columns={[
            { key: "name", label: "Name" },
            { key: "username", label: "Username" },
            { key: "mobile", label: "Mobile" },
            { key: "designation", label: "Designation" },
            { key: "status", label: "Status" },
            { key: "actions", label: "Actions" },
          ]}
          rows={staff.map((staffMember) => ({
            ...staffMember,
            actions: (
              <div className="min-w-[160px]">
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    setSelectedStaff(staffMember);
                    setActionsOpen(true);
                  }}
                >
                  Edit
                </Button>
              </div>
            ),
          }))}
        />
      </Card>

      <Modal open={actionsOpen} title={selectedStaff ? `Staff Actions · ${selectedStaff.name}` : "Staff Actions"} className="max-w-2xl">
        {selectedStaff ? (
          <div className="space-y-6">
            <div className="grid gap-4 rounded-[24px] border border-[#e8d9cd] bg-[#fffaf5] p-4 sm:grid-cols-2">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#554336]/70">Name</p>
                <p className="mt-1 font-medium text-[#231a13]">{selectedStaff.name || "-"}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#554336]/70">Username</p>
                <p className="mt-1 font-medium text-[#231a13]">{selectedStaff.username || "-"}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#554336]/70">Mobile</p>
                <p className="mt-1 font-medium text-[#231a13]">{selectedStaff.mobile || "-"}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#554336]/70">Designation</p>
                <p className="mt-1 font-medium text-[#231a13]">{selectedStaff.designation || "-"}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#554336]/70">Status</p>
                <p className="mt-1 font-medium text-[#231a13]">{selectedStaff.status}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#554336]/70">Last Login</p>
                <p className="mt-1 font-medium text-[#231a13]">{selectedStaff.lastLogin ? new Date(selectedStaff.lastLogin).toLocaleString() : "-"}</p>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 pr-1">
              <Button
                type="button"
                variant="secondary"
                className="shrink-0 whitespace-nowrap"
                onClick={() => {
                  setEditOpen(true);
                  setActionsOpen(false);
                }}
              >
                Edit Details
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="shrink-0 whitespace-nowrap"
                onClick={() => {
                  setResetPassword({ newPassword: "", confirmPassword: "" });
                  setResetOpen(true);
                  setActionsOpen(false);
                }}
              >
                Reset Password
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="shrink-0 whitespace-nowrap"
                onClick={() => void toggleStatus(selectedStaff)}
              >
                {selectedStaff.status === "active" ? "Disable" : "Enable"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="shrink-0 whitespace-nowrap"
                onClick={() => {
                  setActionsOpen(false);
                  setDeleteConfirmOpen(true);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal open={deleteConfirmOpen} title="Confirm Delete" className="max-w-xl">
        <div className="space-y-4">
          <p className="text-sm leading-7 text-[#554336]">
            This will archive the staff account for{" "}
            <span className="font-semibold text-[#231a13]">
              {selectedStaff?.name || "this staff member"}
            </span>
            . The account will be disabled and hidden from active use.
          </p>
          <div className="rounded-[24px] border border-[#f0d0d0] bg-[#fff5f5] p-4 text-sm text-[#8f3d3d]">
            Please confirm before continuing. This action can only be reversed by an administrator.
          </div>
        </div>
        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setDeleteConfirmOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              if (selectedStaff) {
                void removeStaff(selectedStaff);
              }
            }}
          >
            Delete Staff
          </Button>
        </div>
      </Modal>

      <Modal open={createOpen} title="Add Staff" className="max-w-3xl">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input value={form.name} onChange={(event: { target: { value: string } }) => setForm({ ...form, name: event.target.value })} placeholder="Full Name" />
          <Input value={form.username} onChange={(event: { target: { value: string } }) => setForm({ ...form, username: event.target.value })} placeholder="Username" />
          <Input value={form.password} onChange={(event: { target: { value: string } }) => setForm({ ...form, password: event.target.value })} type="password" placeholder="Password" />
          <Input value={form.confirmPassword} onChange={(event: { target: { value: string } }) => setForm({ ...form, confirmPassword: event.target.value })} type="password" placeholder="Confirm Password" />
          <Input value={form.mobile} onChange={(event: { target: { value: string } }) => setForm({ ...form, mobile: event.target.value })} placeholder="Mobile Number" />
          <Input value={form.email} onChange={(event: { target: { value: string } }) => setForm({ ...form, email: event.target.value })} placeholder="Email Address (optional)" />
          <Input value={form.designation} onChange={(event: { target: { value: string } }) => setForm({ ...form, designation: event.target.value })} placeholder="Designation" />
          <select
            className="h-12 rounded-2xl border border-transparent bg-[#f4f0ec] px-4 text-[16px] text-[#231a13] outline-none sm:text-sm"
            value={form.status}
            onChange={(event) => setForm({ ...form, status: event.target.value as StaffForm["status"] })}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button type="button" onClick={() => void createStaff()}>Create Staff</Button>
        </div>
      </Modal>

      <Modal open={editOpen} title="Edit Staff" className="max-w-3xl">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input value={form.name} onChange={(event: { target: { value: string } }) => setForm({ ...form, name: event.target.value })} placeholder="Full Name" />
          <Input value={form.username} onChange={(event: { target: { value: string } }) => setForm({ ...form, username: event.target.value })} placeholder="Username" />
          <Input value={form.mobile} onChange={(event: { target: { value: string } }) => setForm({ ...form, mobile: event.target.value })} placeholder="Mobile Number" />
          <Input value={form.email} onChange={(event: { target: { value: string } }) => setForm({ ...form, email: event.target.value })} placeholder="Email Address (optional)" />
          <Input value={form.designation} onChange={(event: { target: { value: string } }) => setForm({ ...form, designation: event.target.value })} placeholder="Designation" />
          <select
            className="h-12 rounded-2xl border border-transparent bg-[#f4f0ec] px-4 text-[16px] text-[#231a13] outline-none sm:text-sm"
            value={form.status}
            onChange={(event) => setForm({ ...form, status: event.target.value as StaffForm["status"] })}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button type="button" onClick={() => void updateStaff()}>Save Changes</Button>
        </div>
      </Modal>

      <Modal open={resetOpen} title="Reset Password" className="max-w-xl">
        <div className="space-y-4">
          <Input value={resetPassword.newPassword} onChange={(event: { target: { value: string } }) => setResetPassword({ ...resetPassword, newPassword: event.target.value })} type="password" placeholder="New Password" />
          <Input value={resetPassword.confirmPassword} onChange={(event: { target: { value: string } }) => setResetPassword({ ...resetPassword, confirmPassword: event.target.value })} type="password" placeholder="Confirm Password" />
        </div>
        <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => setResetOpen(false)}>Cancel</Button>
          <Button type="button" onClick={() => void resetStaffPassword()}>Reset Password</Button>
        </div>
      </Modal>
    </div>
  );
}
