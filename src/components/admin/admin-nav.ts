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
  BookMarked,
  Upload,
  ListMusic,
  Inbox,
  AudioLines,
} from "lucide-react";

export type AdminNavEntry = {
  href: string;
  icon: LucideIcon;
  labelKey:
    | "overview"
    | "songs"
    | "import"
    | "hymnals"
    | "authors"
    | "tags"
    | "collections"
    | "users"
    | "analytics"
    | "backups"
    | "tunes"
    | "moderation"
    | "recordings";
};

export const ADMIN_NAV: AdminNavEntry[] = [
  { href: "/admin", icon: LayoutDashboard, labelKey: "overview" },
  { href: "/admin/songs", icon: Music, labelKey: "songs" },
  { href: "/admin/import", icon: Upload, labelKey: "import" },
  { href: "/admin/tunes", icon: ListMusic, labelKey: "tunes" },
  { href: "/admin/recordings", icon: AudioLines, labelKey: "recordings" },
  { href: "/admin/moderation", icon: Inbox, labelKey: "moderation" },
  { href: "/admin/hymnals", icon: BookMarked, labelKey: "hymnals" },
  { href: "/admin/authors", icon: Pen, labelKey: "authors" },
  { href: "/admin/tags", icon: Tag, labelKey: "tags" },
  { href: "/admin/collections", icon: FolderOpen, labelKey: "collections" },
  { href: "/admin/users", icon: Users, labelKey: "users" },
  { href: "/admin/analytics", icon: BarChart3, labelKey: "analytics" },
  { href: "/admin/backups", icon: Database, labelKey: "backups" },
];
