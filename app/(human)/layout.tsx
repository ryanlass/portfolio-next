import { ViewTransitions } from "next-view-transitions";
import { HumanShell } from "@/components/HumanShell";
import { MarkAnimation } from "@/components/MarkAnimation";
import { MobileMenuToggle } from "@/components/MobileMenuToggle";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function HumanLayout({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransitions>
      <HumanShell>
        <div className="page">
          <header className="site-header">
            <MarkAnimation />
            <div className="header-actions">
              <MobileMenuToggle />
              <ThemeToggle />
            </div>
          </header>
          <main className="content">{children}</main>
        </div>
      </HumanShell>
    </ViewTransitions>
  );
}
