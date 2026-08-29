export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  targetScope: "all" | "targeted";
  province?: string;
  district?: string;
  imageUrl?: string;
  severity: "critical" | "warning" | "info";
  category?: string;
  createdAt: string;
  createdBy?: string;
  acknowledgedCount?: number;
}
