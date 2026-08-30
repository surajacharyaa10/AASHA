"use client";

import { Clock3, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TimeRange, TIME_RANGES, EVENT_TYPES, EVENT_TYPE_COLORS } from "@/lib/disaster-config";

interface DisasterFiltersProps {
  timeRange: TimeRange;
  setTimeRange: (value: TimeRange) => void;
  eventTypeFilter: string | null;
  setEventTypeFilter: (value: string | null) => void;
  showFilters: boolean;
  setShowFilters: (value: boolean) => void;
  activeFilterCount: number;
  loading: boolean;
  onRefresh: () => void;
}

export function DisasterFilters({
  timeRange,
  setTimeRange,
  eventTypeFilter,
  setEventTypeFilter,
  showFilters,
  setShowFilters,
  activeFilterCount,
  loading,
  onRefresh,
}: DisasterFiltersProps) {
  const clearFilters = () => {
    setTimeRange(7);
    setEventTypeFilter(null);
  };

  return (
    <>
      <div className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm lg:flex">
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
          <div className="flex items-center gap-1.5 px-2 text-slate-500">
            <Clock3 className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Time
            </span>
          </div>

          {TIME_RANGES.map((range) => {
            const active = timeRange === range.value;
            return (
              <button
                key={String(range.value)}
                onClick={() => setTimeRange(range.value)}
                title={range.description}
                className={`
                  rounded-lg px-3.5 py-2 text-xs font-bold
                  transition-all duration-200
                  ${
                    active
                      ? "bg-white text-slate-900 shadow-md ring-1 ring-slate-200"
                      : "text-slate-500 hover:bg-white/70 hover:text-slate-900"
                  }
                `}
              >
                {range.label}
              </button>
            );
          })}
        </div>

        <div className="h-8 w-px bg-slate-200" />

        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
          <div className="flex items-center gap-1.5 px-2 text-slate-500">
            <SlidersHorizontal className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Type
            </span>
          </div>

          {EVENT_TYPES.map((type) => {
            const active =
              type === "All"
                ? eventTypeFilter === null
                : eventTypeFilter === type;

            const colorClass =
              EVENT_TYPE_COLORS[type] ||
              "bg-slate-100 text-slate-700 border-slate-200";

            return (
              <button
                key={type}
                onClick={() =>
                  setEventTypeFilter(type === "All" ? null : type)
                }
                title={
                  type === "All"
                    ? "Show all event types"
                    : `Show ${type} events`
                }
                className={`
                  rounded-lg border px-3 py-2
                  text-[11px] font-bold uppercase
                  transition-all duration-200
                  ${
                    active
                      ? type === "All"
                        ? "border-slate-300 bg-white text-slate-900 shadow-md"
                        : `${colorClass} shadow-md`
                      : "border-transparent bg-transparent text-slate-500 hover:border-slate-200 hover:bg-white hover:text-slate-900"
                  }
                `}
              >
                {type}
              </button>
            );
          })}
        </div>

        {activeFilterCount > 0 && (
          <>
            <div className="h-8 w-px bg-slate-200" />
            <button
              onClick={clearFilters}
              className="group flex items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <X className="h-3.5 w-3.5 transition-transform group-hover:rotate-90" />
              Clear
            </button>
          </>
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowFilters(!showFilters)}
        className="relative gap-2 border-slate-200 font-semibold text-slate-700 lg:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters
        {activeFilterCount > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white">
            {activeFilterCount}
          </span>
        )}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        className="gap-2 border-slate-200 font-semibold text-slate-700 hover:bg-slate-50"
      >
        {loading ? (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 16h5v5" />
          </svg>
        )}
        <span className="hidden sm:inline">Refresh</span>
      </Button>

      {showFilters && (
        <div className="border-b border-slate-200 bg-white px-6 py-3 shadow-sm lg:hidden">
          <div className="flex flex-col gap-3">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Clock3 className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Time Range
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1">
                {TIME_RANGES.map((range) => {
                  const active = timeRange === range.value;
                  return (
                    <button
                      key={String(range.value)}
                      onClick={() => setTimeRange(range.value)}
                      className={`
                        rounded-lg px-3 py-2 text-xs font-bold
                        ${
                          active
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500"
                        }
                      `}
                    >
                      {range.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2">
                <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Event Type
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {EVENT_TYPES.map((type) => {
                  const active =
                    type === "All"
                      ? eventTypeFilter === null
                      : eventTypeFilter === type;
                  return (
                    <button
                      key={type}
                      onClick={() =>
                        setEventTypeFilter(type === "All" ? null : type)
                      }
                      className={`
                        rounded-lg border px-3 py-1.5 text-[10px]
                        font-bold uppercase transition-all
                        ${
                          active
                            ? type === "All"
                              ? "border-slate-300 bg-slate-900 text-white"
                              : EVENT_TYPE_COLORS[type]
                            : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                        }
                      `}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600"
              >
                <X className="h-3.5 w-3.5" />
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
