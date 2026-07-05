"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, DataTable, Input } from "@karali/ui";
import { api } from "../../../lib/api";

type CouponRecord = {
  code: string;
  discountType: "percentage" | "fixed";
  percentage: number;
  fixedAmount: number;
  startDate: string;
  endDate: string;
  usageLimit: number;
  perUserLimit: number;
  minimumAmount: number;
  maximumDiscount: number;
  active: boolean;
  totalUsed: number;
  usedBy: string[];
  createdAt?: string;
  updatedAt?: string;
};

type CouponForm = {
  code: string;
  discountType: "percentage" | "fixed";
  percentage: string;
  fixedAmount: string;
  startDate: string;
  endDate: string;
  usageLimit: string;
  perUserLimit: string;
  minimumAmount: string;
  maximumDiscount: string;
  active: boolean;
};

const emptyForm: CouponForm = {
  code: "",
  discountType: "percentage",
  percentage: "10",
  fixedAmount: "0",
  startDate: "",
  endDate: "",
  usageLimit: "0",
  perUserLimit: "1",
  minimumAmount: "0",
  maximumDiscount: "0",
  active: true,
};

function toForm(coupon: CouponRecord): CouponForm {
  return {
    code: coupon.code,
    discountType: coupon.discountType,
    percentage: String(coupon.percentage || 0),
    fixedAmount: String(coupon.fixedAmount || 0),
    startDate: coupon.startDate ? coupon.startDate.slice(0, 10) : "",
    endDate: coupon.endDate ? coupon.endDate.slice(0, 10) : "",
    usageLimit: String(coupon.usageLimit || 0),
    perUserLimit: String(coupon.perUserLimit || 1),
    minimumAmount: String(coupon.minimumAmount || 0),
    maximumDiscount: String(coupon.maximumDiscount || 0),
    active: Boolean(coupon.active),
  };
}

export default function CouponsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [editingCode, setEditingCode] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState<CouponForm>(emptyForm);

  const { data: coupons = [] } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => (await api.get<CouponRecord[]>("/admin/coupons")).data,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      if (editingCode) {
        return api.patch(
          `/admin/coupons/${encodeURIComponent(editingCode)}`,
          payload,
        );
      }
      return api.post("/admin/coupons", payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      setEditingCode("");
      setForm(emptyForm);
      setMessage("Coupon saved successfully.");
    },
    onError: (error) => {
      setMessage(
        error instanceof Error ? error.message : "Unable to save coupon.",
      );
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (code: string) =>
      api.patch(`/admin/coupons/${encodeURIComponent(code)}/toggle`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
    onError: (error) => {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update coupon status.",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (code: string) =>
      api.delete(`/admin/coupons/${encodeURIComponent(code)}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      if (editingCode) {
        setEditingCode("");
        setForm(emptyForm);
      }
    },
    onError: (error) => {
      setMessage(
        error instanceof Error ? error.message : "Unable to delete coupon.",
      );
    },
  });

  useEffect(() => {
    if (!editingCode) return;
    const coupon = coupons.find((item) => item.code === editingCode);
    if (coupon) {
      setForm(toForm(coupon));
    }
  }, [coupons, editingCode]);

  const filteredCoupons = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return coupons.filter((coupon) => {
      const matchesSearch =
        !needle ||
        coupon.code.toLowerCase().includes(needle) ||
        coupon.discountType.toLowerCase().includes(needle);
      const matchesStatus =
        status === "all" ||
        (status === "active" ? coupon.active : !coupon.active);
      return matchesSearch && matchesStatus;
    });
  }, [coupons, search, status]);

  const stats = useMemo(
    () => ({
      total: coupons.length,
      active: coupons.filter((item) => item.active).length,
      inactive: coupons.filter((item) => !item.active).length,
      used: coupons.reduce((sum, item) => sum + Number(item.totalUsed || 0), 0),
    }),
    [coupons],
  );

  async function saveCoupon() {
    setMessage("");
    const payload = {
      code: form.code.trim().toUpperCase(),
      discountType: form.discountType,
      percentage: Number(form.percentage || 0),
      fixedAmount: Number(form.fixedAmount || 0),
      startDate: form.startDate || "",
      endDate: form.endDate || "",
      usageLimit: Number(form.usageLimit || 0),
      perUserLimit: Number(form.perUserLimit || 1),
      minimumAmount: Number(form.minimumAmount || 0),
      maximumDiscount: Number(form.maximumDiscount || 0),
      active: form.active,
    };
    await createMutation.mutateAsync(payload);
  }

  function editCoupon(coupon: CouponRecord) {
    setEditingCode(coupon.code);
    setForm(toForm(coupon));
  }

  function resetForm() {
    setEditingCode("");
    setForm(emptyForm);
    setMessage("");
  }

  return (
    <div className="space-y-8">
      <div className="lux-hero lux-reveal flex flex-col gap-4 p-8 md:flex-row md:items-end md:justify-between md:p-10">
        <div>
          <p className="lux-eyebrow">Revenue Levers</p>
          <h2 className="lux-heading mt-3 text-4xl font-bold text-[#231a13]">
            Coupons
          </h2>
          <p className="mt-2 text-[#554336]">
            Create, edit, deactivate, and monitor booking incentives without
            breaking the premium visual system.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Input
            value={search}
            onChange={(event: { target: { value: string } }) =>
              setSearch(event.target.value)
            }
            placeholder="Search coupons"
          />
          <select
            className="h-12 rounded-2xl border border-[#efd9c8] bg-white px-4 text-sm text-[#231a13] outline-none"
            value={status}
            onChange={(event) => setStatus(event.target.value as typeof status)}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Total", String(stats.total)],
          ["Active", String(stats.active)],
          ["Inactive", String(stats.inactive)],
          ["Redemptions", String(stats.used)],
        ].map(([label, value]) => (
          <Card key={label} className="space-y-2 p-7">
            <div className="text-xs uppercase tracking-[0.3em] text-[#8f4a00]">
              {label}
            </div>
            <div className="lux-heading text-3xl font-bold text-[#231a13]">
              {value}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="space-y-5 p-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="lux-heading text-2xl font-semibold text-[#231a13]">
                {editingCode ? `Edit ${editingCode}` : "Create Coupon"}
              </h3>
              <p className="text-sm text-[#554336]">
                Validation, usage limits, and active state are enforced in the
                backend.
              </p>
            </div>
            {editingCode ? (
              <Button variant="secondary" type="button" onClick={resetForm}>
                Cancel Edit
              </Button>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              value={form.code}
              onChange={(event: { target: { value: string } }) =>
                setForm({ ...form, code: event.target.value })
              }
              placeholder="CODE"
            />
            <select
              className="h-12 rounded-2xl border border-[#efd9c8] bg-white px-4 text-sm text-[#231a13] outline-none"
              value={form.discountType}
              onChange={(event) =>
                setForm({
                  ...form,
                  discountType: event.target
                    .value as CouponForm["discountType"],
                })
              }
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed amount</option>
            </select>
            <Input
              value={form.percentage}
              onChange={(event: { target: { value: string } }) =>
                setForm({ ...form, percentage: event.target.value })
              }
              placeholder="Percentage"
            />
            <Input
              value={form.fixedAmount}
              onChange={(event: { target: { value: string } }) =>
                setForm({ ...form, fixedAmount: event.target.value })
              }
              placeholder="Fixed amount"
            />
            <Input
              value={form.startDate}
              onChange={(event: { target: { value: string } }) =>
                setForm({ ...form, startDate: event.target.value })
              }
              type="date"
              placeholder="Start date"
            />
            <Input
              value={form.endDate}
              onChange={(event: { target: { value: string } }) =>
                setForm({ ...form, endDate: event.target.value })
              }
              type="date"
              placeholder="End date"
            />
            <Input
              value={form.usageLimit}
              onChange={(event: { target: { value: string } }) =>
                setForm({ ...form, usageLimit: event.target.value })
              }
              placeholder="Usage limit"
            />
            <Input
              value={form.perUserLimit}
              onChange={(event: { target: { value: string } }) =>
                setForm({ ...form, perUserLimit: event.target.value })
              }
              placeholder="Per user limit"
            />
            <Input
              value={form.minimumAmount}
              onChange={(event: { target: { value: string } }) =>
                setForm({ ...form, minimumAmount: event.target.value })
              }
              placeholder="Minimum order amount"
            />
            <Input
              value={form.maximumDiscount}
              onChange={(event: { target: { value: string } }) =>
                setForm({ ...form, maximumDiscount: event.target.value })
              }
              placeholder="Maximum discount"
            />
            <label className="flex items-center gap-3 rounded-2xl border border-[#efd9c8] bg-white px-4 py-3 text-sm text-[#231a13] md:col-span-2">
              <input
                checked={form.active}
                className="h-4 w-4 accent-[#8f4a00]"
                type="checkbox"
                onChange={(event) =>
                  setForm({ ...form, active: event.target.checked })
                }
              />
              Active coupon
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={saveCoupon}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending
                ? "Saving..."
                : editingCode
                  ? "Update Coupon"
                  : "Create Coupon"}
            </Button>
            <Button variant="secondary" type="button" onClick={resetForm}>
              Reset
            </Button>
          </div>
          {message ? (
            <p className="text-sm font-medium text-[#2d7a44]">{message}</p>
          ) : null}
        </Card>

        <Card className="space-y-4 p-8">
          <div>
            <h3 className="lux-heading text-2xl font-semibold text-[#231a13]">
              Coupon rules
            </h3>
            <p className="text-sm text-[#554336]">
              Production controls for discounts and redemption limits.
            </p>
          </div>
          <ul className="space-y-3 text-sm text-[#554336]">
            <li>• Percentage and fixed coupons are both supported.</li>
            <li>• Start and end dates prevent invalid redemption windows.</li>
            <li>
              • Usage limits and per-user limits are enforced by the backend.
            </li>
            <li>
              • Minimum spend and maximum discount keep promo math bounded.
            </li>
            <li>
              • Active toggles instantly disable a coupon without deleting
              history.
            </li>
          </ul>
        </Card>
      </div>

      <DataTable
        columns={[
          { key: "code", label: "Code" },
          { key: "discountType", label: "Type" },
          { key: "value", label: "Value" },
          { key: "active", label: "Status" },
          { key: "usage", label: "Usage" },
          { key: "limits", label: "Limits" },
          { key: "actions", label: "Actions" },
        ]}
        rows={filteredCoupons.map((coupon) => ({
          code: coupon.code,
          discountType: coupon.discountType,
          value:
            coupon.discountType === "percentage"
              ? `${coupon.percentage}%`
              : `₹${coupon.fixedAmount}`,
          active: coupon.active ? "Active" : "Inactive",
          usage: `${coupon.totalUsed || 0}`,
          limits: `${coupon.usageLimit || "∞"} / ${coupon.perUserLimit || "∞"}`,
          actions: (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                type="button"
                onClick={() => editCoupon(coupon)}
              >
                Edit
              </Button>
              <Button
                variant="secondary"
                type="button"
                onClick={() => toggleMutation.mutate(coupon.code)}
                disabled={toggleMutation.isPending}
              >
                {coupon.active ? "Disable" : "Enable"}
              </Button>
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      `Delete coupon ${coupon.code}? This cannot be undone.`,
                    )
                  ) {
                    deleteMutation.mutate(coupon.code);
                  }
                }}
                disabled={deleteMutation.isPending}
              >
                Delete
              </Button>
            </div>
          ),
        }))}
      />
    </div>
  );
}
