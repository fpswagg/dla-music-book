import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">{children}</main>
      <Footer />
    </>
  );
}
