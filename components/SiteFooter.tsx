import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site">
      <span>© {new Date().getFullYear()} RevizUp</span>
      <Link href="/mentions-legales">Mentions légales</Link>
      <Link href="/cgv">Conditions générales</Link>
      <Link href="/confidentialite">Confidentialité</Link>
    </footer>
  );
}
