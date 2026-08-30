"use client";

import { useState, useEffect, useMemo } from "react";
import { Map, Overlay } from "pigeon-maps";
import { Plus, Minus, LocateFixed, RefreshCw, Hospital, Stethoscope, Home, Users, Flag, TreePine, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const NEPAL_CENTER = { lat: 28.3949, lng: 84.1240 };
const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

interface OsmElement {
  id: number;
  type: string;
  lat: number;
  lng: number;
  category: string;
  name: string;
  tags?: Record<string, string | undefined>;
}

interface ResourceItem {
  id: string | number;
  type: string;
  lat: number;
  lng: number;
  category: string;
  name: string;
  tags: OsmElement["tags"];
}

interface ClusterItem {
  id: string;
  lat: number;
  lng: number;
  count: number;
  category: string;
  items: ResourceItem[];
}

const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  hospital: { icon: <Hospital className="h-4 w-4 text-white" />, color: "bg-red-600", bg: "bg-red-50", label: "Hospital" },
  clinic: { icon: <Stethoscope className="h-4 w-4 text-white" />, color: "bg-rose-500", bg: "bg-rose-50", label: "Clinic" },
  shelter: { icon: <Home className="h-4 w-4 text-white" />, color: "bg-amber-600", bg: "bg-amber-50", label: "Shelter" },
  social_centre: { icon: <Users className="h-4 w-4 text-white" />, color: "bg-violet-600", bg: "bg-violet-50", label: "Social Centre" },
  community_centre: { icon: <Users className="h-4 w-4 text-white" />, color: "bg-violet-500", bg: "bg-violet-50", label: "Community Centre" },
  assembly_point: { icon: <Flag className="h-4 w-4 text-white" />, color: "bg-orange-600", bg: "bg-orange-50", label: "Assembly Point" },
  park: { icon: <TreePine className="h-4 w-4 text-white" />, color: "bg-emerald-600", bg: "bg-emerald-50", label: "Park" },
  pitch: { icon: <MapPin className="h-4 w-4 text-white" />, color: "bg-sky-600", bg: "bg-sky-50", label: "Pitch" },
  stadium: { icon: <MapPin className="h-4 w-4 text-white" />, color: "bg-indigo-600", bg: "bg-indigo-50", label: "Stadium" },
};

const FILTER_OPTIONS = [
  { key: "all", label: "All" },
  { key: "hospital", label: "Hospitals" },
  { key: "clinic", label: "Clinics" },
  { key: "shelter", label: "Shelters" },
  { key: "community_centre", label: "Community" },
  { key: "assembly_point", label: "Assembly" },
  { key: "park", label: "Parks" },
  { key: "pitch", label: "Pitches" },
  { key: "stadium", label: "Stadiums" },
];

export default function ResourcesPage() {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  const [selectedResource, setSelectedResource] = useState<ResourceItem | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [mapCenter, setMapCenter] = useState<[number, number]>([NEPAL_CENTER.lat, NEPAL_CENTER.lng]);
  const [mapZoom, setMapZoom] = useState(7);

  const fetchResources = async () => {
    setLoading(true);
    setError(null);
    setIsFallback(false);
    try {
      const res = await fetch(`${BACKEND}/api/resources/osm/nepal`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const elements: OsmElement[] = Array.isArray(data?.elements) ? data.elements : [];
      if (data?.fallback) setIsFallback(true);

      const mapped: ResourceItem[] = elements
        .filter((el) => typeof el.lat === "number" && typeof el.lng === "number")
        .filter((el, index, self) => index === self.findIndex((item) => item.id === el.id))
        .map((el) => {
          const category = el.category || "other";
          const name = el.name || `${category} #${el.id}`;

          return {
            id: el.id,
            type: el.type,
            lat: el.lat as number,
            lng: el.lng as number,
            category,
            name,
            tags: el.tags,
          };
        });

      setResources(mapped);
    } catch (err) {
      console.error("Failed to fetch resources:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch resources");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchResources, 0);
    return () => clearTimeout(timer);
  }, []);

  const filteredResources = useMemo(() => {
    const query = search.trim().toLowerCase();
    let items = resources;
    if (filter !== "all") {
      items = items.filter((r) => r.category === filter);
    }
    if (query) {
      items = items.filter((r) => {
        const haystack = [
          r.name,
          r.tags?.city,
          r.tags?.state,
          r.tags?.country,
          r.tags?.address_line1,
          r.tags?.address_line2,
          r.tags?.postcode,
          ...(r.tags ? Object.values(r.tags).filter(Boolean) : []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      });
    }
    return items;
  }, [resources, filter, search]);

  useEffect(() => {
    if (filteredResources.length > 0 && search.trim()) {
      const first = filteredResources[0];
      setMapCenter([first.lat, first.lng]);
      setMapZoom(12);
    }
  }, [search, filteredResources]);

  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    resources.forEach((r) => {
      counts[r.category] = (counts[r.category] || 0) + 1;
    });
    return counts;
  }, [resources]);

  const getCategoryIcon = (category: string) => {
    return CATEGORY_CONFIG[category]?.icon || <MapPin className="h-4 w-4 text-white" />;
  };

  const getCategoryColor = (category: string) => {
    return CATEGORY_CONFIG[category]?.color || "bg-gray-600";
  };

  const getCategoryBg = (category: string) => {
    return CATEGORY_CONFIG[category]?.bg || "bg-gray-50";
  };

  const getCategoryLabel = (category: string) => {
    return CATEGORY_CONFIG[category]?.label || category;
  };

  const clusters = useMemo(() => {
    const items = filteredResources;
    if (items.length === 0) return [] as ClusterItem[];

    const zoom = mapZoom;
    const cellSize = Math.max(0.005, 0.5 * Math.pow(2, 7 - zoom));

    const grid: Record<string, ResourceItem[]> = {};

    for (const item of items) {
      const cellX = Math.floor(item.lng / cellSize);
      const cellY = Math.floor(item.lat / cellSize);
      const key = `${cellX}:${cellY}`;
      const bucket = grid[key];
      if (bucket) {
        bucket.push(item);
      } else {
        grid[key] = [item];
      }
    }

    const result: ClusterItem[] = [];
    let clusterIndex = 0;

    for (const key of Object.keys(grid)) {
      const bucket = grid[key];
      if (bucket.length === 1) {
        const item = bucket[0];
        result.push({
          id: `single-${item.id}`,
          lat: item.lat,
          lng: item.lng,
          count: 1,
          category: item.category,
          items: bucket,
        });
      } else {
        const avgLat = bucket.reduce((s: number, i: ResourceItem) => s + i.lat, 0) / bucket.length;
        const avgLng = bucket.reduce((s: number, i: ResourceItem) => s + i.lng, 0) / bucket.length;
        const primary = bucket[0];
        result.push({
          id: `cluster-${clusterIndex++}`,
          lat: avgLat,
          lng: avgLng,
          count: bucket.length,
          category: primary.category,
          items: bucket,
        });
      }
    }

    return result;
  }, [filteredResources, mapZoom]);

  return (
    <div className="flex h-screen flex-col bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold text-slate-900">Nepal Emergency Resources</h1>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 border border-emerald-200">
            OSM Live
          </span>
          {isFallback && (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 border border-amber-200">
              Sample Data
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchResources}
            className="gap-2 border-slate-200 font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </header>

      {/* Filters */}
      <div className="border-b border-slate-200 bg-white px-4 py-2.5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search place, city..."
              className="h-8 w-64 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setFilter(opt.key)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                  filter === opt.key
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 px-4 py-3 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total</p>
          <p className="text-lg font-bold text-slate-900">{resources.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Showing</p>
          <p className="text-lg font-bold text-slate-900">{filteredResources.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Hospitals</p>
          <p className="text-lg font-bold text-red-600">{stats.hospital || 0}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Shelters</p>
          <p className="text-lg font-bold text-amber-600">{stats.shelter || 0}</p>
        </div>
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pb-4 md:flex-row">
        {/* Map */}
        <div className="relative min-h-[50vh] flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-xs md:min-h-0">
          <Map
            center={mapCenter}
            zoom={mapZoom}
            onBoundsChanged={({ center, zoom }) => {
              setMapCenter(center);
              setMapZoom(zoom);
            }}
          >
            {clusters.map((cluster) => {
              const isCluster = cluster.count > 1;
              const handleClick = () => {
                if (isCluster) {
                  setMapZoom((z) => Math.min(z + 2, 18));
                } else if (cluster.items[0]) {
                  setSelectedResource(cluster.items[0]);
                }
              };

              return (
                <Overlay
                  key={cluster.id}
                  anchor={[cluster.lat, cluster.lng]}
                  offset={[16, 32]}
                >
                  <div
                    onClick={handleClick}
                    className="cursor-pointer transition-transform hover:scale-110 flex items-center justify-center rounded-full shadow-lg"
                  >
                    <div className={`relative flex h-8 w-8 items-center justify-center rounded-full ${getCategoryColor(cluster.category)} shadow-lg`}>
                      {getCategoryIcon(cluster.category)}
                      {isCluster && (
                        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-[9px] font-bold text-white">
                          {cluster.count}
                        </span>
                      )}
                    </div>
                  </div>
                </Overlay>
              );
            })}
          </Map>

          {/* Region label */}
          <div className="absolute left-3 top-3 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-md backdrop-blur">
            <p className="text-[11px] font-medium text-slate-500">OpenStreetMap</p>
            <p className="text-xs font-bold text-slate-900">Nepal Resources</p>
          </div>

          {/* Zoom controls */}
          <div className="absolute right-3 top-3 flex flex-col gap-1.5">
            <button
              onClick={() => setMapZoom((z) => Math.min(z + 1, 18))}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={() => setMapZoom((z) => Math.max(z - 1, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              onClick={() => { setMapCenter([NEPAL_CENTER.lat, NEPAL_CENTER.lng]); setMapZoom(7); }}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <LocateFixed className="h-4 w-4" />
            </button>
          </div>

          {/* Legend */}
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-md backdrop-blur">
            {Object.entries(CATEGORY_CONFIG).slice(0, 5).map(([key, cfg]) => (
              <span key={key} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                <span className={`h-2 w-2 rounded-full ${cfg.color}`} />
                {cfg.label}
              </span>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="h-64 shrink-0 md:h-auto md:w-80 md:shrink-0 md:overflow-y-auto md:rounded-2xl md:border md:border-slate-200 md:bg-white md:shadow-xs">
          <div className="border-b border-slate-100 px-3 py-2.5 md:border-b-0">
            <h2 className="text-sm font-bold text-slate-900">Resources</h2>
            <p className="text-xs text-slate-500">{filteredResources.length} locations</p>
          </div>
          {loading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-3.5 w-3/4 animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-3 text-xs text-red-600">{error}</div>
          ) : filteredResources.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">No resources found</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredResources.map((resource) => {
                const isSelected = selectedResource?.id === resource.id;
                return (
                  <button
                    key={resource.id}
                    onClick={() => setSelectedResource(resource)}
                    className={`w-full text-left p-3 transition-colors hover:bg-slate-50 ${
                      isSelected ? "bg-slate-50 ring-1 ring-inset ring-slate-300" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${getCategoryBg(resource.category)}`}>
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${getCategoryColor(resource.category)}`}>
                          {getCategoryIcon(resource.category)}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{resource.name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{getCategoryLabel(resource.category)}</p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {resource.lat.toFixed(4)}, {resource.lng.toFixed(4)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Selected resource detail panel */}
      {selectedResource && (
        <div className="fixed bottom-4 left-4 right-4 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur md:left-auto md:right-4 md:top-16 md:w-80 md:bottom-auto">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-900">Location Details</h3>
            <button
              onClick={() => setSelectedResource(null)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Close
            </button>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-xs font-semibold text-slate-500">Name</p>
              <p className="text-sm font-bold text-slate-900">{selectedResource.name}</p>
            </div>
            <div className="flex gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-500">Type</p>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold border ${getCategoryBg(selectedResource.category)} ${getCategoryColor(selectedResource.category)}`}>
                  {getCategoryLabel(selectedResource.category)}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Coordinates</p>
                <p className="text-xs font-mono text-slate-700">
                  {selectedResource.lat.toFixed(4)}, {selectedResource.lng.toFixed(4)}
                </p>
              </div>
            </div>
            {selectedResource.tags && Object.keys(selectedResource.tags).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500">Details</p>
                <div className="mt-1 space-y-1 max-h-32 overflow-y-auto">
                  {Object.entries(selectedResource.tags).map(([key, value]) => (
                    value && (
                      <div key={key} className="flex justify-between text-[11px]">
                        <span className="text-slate-500 capitalize">{key.replace(/_/g, " ")}</span>
                        <span className="font-semibold text-slate-900 max-w-[60%] text-right truncate">{value}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
