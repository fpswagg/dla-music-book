/** Full-screen pages (projection): no header, no footer. */
export default function PresentLayout({ children }: { children: React.ReactNode }) {
  return <main className="flex-1">{children}</main>;
}
