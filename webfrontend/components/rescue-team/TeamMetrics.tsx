"use client";

import { Users, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface TeamMetricsProps {
  totalCount: number;
  availableCount: number;
  deployedCount: number;
  offDutyCount: number;
}

export function TeamMetrics({
  totalCount,
  availableCount,
  deployedCount,
  offDutyCount,
}: TeamMetricsProps) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
      <Card className="border-slate-200 bg-white p-5 shadow-xs">
        <CardContent className="p-0">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Total Teams</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {String(totalCount).padStart(2, "0")}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Approved & deployed units
          </p>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white p-5 shadow-xs">
        <CardContent className="p-0">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Available Now</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {String(availableCount).padStart(2, "0")}
          </p>
          <p className="mt-1 text-xs font-semibold text-emerald-600">
            Ready for immediate dispatch
          </p>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white p-5 shadow-xs">
        <CardContent className="p-0">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Currently Deployed</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {String(deployedCount).padStart(2, "0")}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Active in field operations
          </p>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white p-5 shadow-xs">
        <CardContent className="p-0">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Off Duty / Rest</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {String(offDutyCount).padStart(2, "0")}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Next shift rotation at 17:00 NPT
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
