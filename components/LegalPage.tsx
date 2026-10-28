import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";

export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="wrap">
      <nav className="site-nav">
        <Link href="/" className="logo">
          Reviz<span className="up">Up</span>
        </Link>
      </nav>
      <article className="legal">
        <h1>{title}</h1>
        <p className="muted">Dernière mise à jour : {updated}</p>
        {children}
      </article>
      <SiteFooter />
    </div>
  );
}

// Champ à compléter avant la mise en ligne publique.
export function Todo({ children }: { children: React.ReactNode }) {
  return <span className="todo">[{children}]</span>;
}
