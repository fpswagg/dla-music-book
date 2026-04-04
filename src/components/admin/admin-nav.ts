import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Music,
  Users,
  Tag,
  Pen,
  FolderOpen,
  BarChart3,
  Database,
} from "lucide-react";

export type AdminNavEntry = {
  href: string;
  icon: LucideIcon;
  labelKey:
    | "overview"
    | "songs"
    | "authors"
    | "tags"
    | "collections"
    | "users"
    | "analytics"
    | "backups";
};

export const ADMIN_NAV: AdminNavEntry[] = [
  { href: "/admin", icon: LayoutDashboard, labelKey: "overview" },
  { href: "/admin/songs", icon: Music, labelKey: "songs" },
  { href: "/admin/authors", icon: Pen, labelKey: "authors" },
  { href: "/admin/tags", icon: Tag, labelKey: "tags" },
  { href: "/admin/collections", icon: FolderOpen, labelKey: "collections" },
  { href: "/admin/users", icon: Users, labelKey: "users" },
  { href: "/admin/analytics", icon: BarChart3, labelKey: "analytics" },
  { href: "/admin/backups", icon: Database, labelKey: "backups" },
];
