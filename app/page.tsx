import Link from "next/link";
import { LIMITS, PRO_PRICE_LABEL } from "@/lib/plans";
import SiteFooter from "@/components/SiteFooter";

export default function Home() {
  return (
    <div className="wrap">
      <nav className="site-nav">
        <Link href="/" className="logo">
          Reviz<span className="up">Up</span>
        </Link>
        <div className="spacer" />
        <a className="navlink" href="#tarifs">
          Tarifs
        </a>
        <Link className="btn" href="/connexion">
          Se connecter
        </Link>
      </nav>

      <section className="hero">
        <div>
          <h1>
            Ton cours devient <mark>fiches</mark> et <mark>quiz</mark>.
          </h1>
          <p className="lead">
            Importe ton cours en PDF ou en Word, choisis le point à réviser, et RevizUp te fait une fiche claire ou un quiz
            corrigé. Tu peux ensuite l&apos;affiner : plus court, plus dur, plus d&apos;exemples.
          </p>
          <div className="cta">
            <Link className="btn primary" href="/connexion">
              Essayer gratuitement
            </Link>
            <a className="btn" href="#comment">
              Comment ça marche
            </a>
          </div>
          <p className="reassure">{LIMITS.free.generations} fiches ou quiz offerts, sans carte bancaire.</p>
        </div>

        <div className="demo" aria-label="Exemple de fiche générée">
          <div className="src">
            <span>Droit des sociétés · L3.pdf</span>
            <span>42 pages</span>
          </div>
          <div className="ask-line">Fiche courte sur : les clauses léonines</div>
          <div className="fiche">
            <h3>Les clauses léonines</h3>
            <ul>
              <li>
                <strong>Définition</strong> : clause qui prive un associé de <strong>tout</strong> le profit ou lui fait supporter{" "}
                <strong>toutes</strong> les pertes.
              </li>
              <li>
                <strong>Texte</strong> : art. 1844-1 al. 2 du Code civil.
              </li>
              <li>
                <strong>Sanction</strong> : clause réputée non écrite, la société survit.
              </li>
            </ul>
            <div className="keep">À retenir : seule l&apos;exclusion totale est léonine, pas une simple inégalité.</div>
          </div>
        </div>
      </section>

      <section className="band" id="comment">
        <h2>Trois étapes, pas une de plus</h2>
        <div className="how">
          <div>
            <h3>Ajoute ton cours</h3>
            <p>PDF, Word ou texte collé. RevizUp repère tout seul les grands thèmes du cours.</p>
          </div>
          <div>
            <h3>Choisis ce que tu révises</h3>
            <p>Tout le cours, ou un point précis : une notion, un chapitre, un article, un arrêt.</p>
          </div>
          <div>
            <h3>Fiche ou quiz, puis affine</h3>
            <p>Une fiche à relire ou un quiz corrigé avec explications. Demande « plus court » ou « plus dur » si besoin.</p>
          </div>
        </div>
      </section>

      <section className="band">
        <h2>Une IA open source, tes données en Europe</h2>
        <div className="sov">
          <div>
            <b>IA open source</b>
            <p>Les fiches et les quiz sont faits par un modèle d&apos;IA open source, hébergé chez un fournisseur français.</p>
          </div>
          <div>
            <b>Tes cours ne servent qu&apos;à toi</b>
            <p>Ils ne sont ni revendus, ni utilisés pour entraîner une IA. Tu peux les supprimer quand tu veux.</p>
          </div>
          <div>
            <b>Ton fichier ne quitte pas ton appareil</b>
            <p>Le texte est extrait directement dans ton navigateur ; seul le texte du cours est envoyé.</p>
          </div>
        </div>
      </section>

      <section className="band" id="tarifs">
        <h2>Tarifs</h2>
        <div className="plans public">
          <div className="plan">
            <b>Gratuit</b>
            <div className="price">0 €</div>
            <ul>
              <li>{LIMITS.free.generations} fiches ou quiz pour essayer</li>
              <li>{LIMITS.free.courses} cours</li>
              <li>Quiz de {LIMITS.free.quizQuestions} questions</li>
            </ul>
            <Link className="btn" href="/connexion">
              Commencer
            </Link>
          </div>
          <div className="plan best">
            <b>Pro</b>
            <div className="price">
              {PRO_PRICE_LABEL} <small>/ mois</small>
            </div>
            <ul>
              <li>Fiches et quiz illimités</li>
              <li>Cours longs, jusqu&apos;à 150 pages</li>
              <li>Quiz de {LIMITS.pro.quizQuestions} questions</li>
              <li>Sans engagement, résiliable en un clic</li>
            </ul>
            <Link className="btn primary" href="/connexion">
              Passer en Pro
            </Link>
          </div>
        </div>
      </section>

      <section className="band faq">
        <h2>Questions fréquentes</h2>
        <details>
          <summary>Quels fichiers puis-je importer ?</summary>
          <p>
            Les PDF qui contiennent du texte, les fichiers Word (.docx) et le texte collé. Un PDF scanné, c&apos;est-à-dire une photo de
            page, ne contient pas de texte lisible : colle plutôt le texte.
          </p>
        </details>
        <details>
          <summary>Les fiches sont-elles fiables ?</summary>
          <p>
            RevizUp s&apos;appuie uniquement sur ton cours et a pour consigne de ne rien inventer. Une IA peut quand même se tromper :
            garde ton cours comme référence, surtout pour les dates, articles et numéros.
          </p>
        </details>
        <details>
          <summary>Comment résilier l&apos;abonnement Pro ?</summary>
          <p>Depuis l&apos;app, bouton « Mon abonnement ». La résiliation prend effet à la fin du mois déjà payé.</p>
        </details>
      </section>

      <SiteFooter />
    </div>
  );
}
