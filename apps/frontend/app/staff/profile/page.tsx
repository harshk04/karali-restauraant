"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Card, PasswordInput } from "@karali/ui";
import { staffApi } from "../../../lib/staff-api";

type StaffProfile = {
  name: string;
  username: string;
  mobile: string;
  email: string;
  designation: string;
  role: string;
};

export default function StaffProfilePage() {
  const { data } = useQuery({
    queryKey: ["staff-profile"],
    queryFn: async () => (await staffApi.get<StaffProfile>("/staff/profile")).data,
  });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setMessage("");
  }, [newPassword, confirmPassword, currentPassword]);

  async function changePassword() {
    setMessage("");
    try {
      await staffApi.patch("/staff/profile/password", {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Password changed successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to change password.");
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-12">
      <Card className="space-y-4 xl:col-span-6">
        <h2 className="lux-heading text-2xl font-semibold text-[#231a13]">Profile</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-[#554336]/70">Name</div>
            <div className="mt-1 font-medium text-[#231a13]">{data?.name}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-[#554336]/70">Username</div>
            <div className="mt-1 font-medium text-[#231a13]">{data?.username}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-[#554336]/70">Contact</div>
            <div className="mt-1 font-medium text-[#231a13]">{data?.mobile || "-"}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-[#554336]/70">Email</div>
            <div className="mt-1 font-medium text-[#231a13]">{data?.email || "-"}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-[#554336]/70">Designation</div>
            <div className="mt-1 font-medium text-[#231a13]">{data?.designation || "-"}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-[#554336]/70">Role</div>
            <div className="mt-1 font-medium text-[#231a13]">{data?.role}</div>
          </div>
        </div>
      </Card>

      <Card className="space-y-4 xl:col-span-6">
        <h2 className="lux-heading text-2xl font-semibold text-[#231a13]">Change Password</h2>
        <div className="space-y-4">
          <PasswordInput value={currentPassword} onChange={(event: { target: { value: string } }) => setCurrentPassword(event.target.value)} placeholder="Current password" />
          <PasswordInput value={newPassword} onChange={(event: { target: { value: string } }) => setNewPassword(event.target.value)} placeholder="New password" />
          <PasswordInput value={confirmPassword} onChange={(event: { target: { value: string } }) => setConfirmPassword(event.target.value)} placeholder="Confirm new password" />
          {message ? <div className="text-sm text-[#1b6a36]">{message}</div> : null}
          <Button type="button" onClick={() => void changePassword()} className="w-full">
            Update Password
          </Button>
        </div>
      </Card>
    </div>
  );
}
