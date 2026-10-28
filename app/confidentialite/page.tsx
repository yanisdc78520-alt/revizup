import LegalPage, { Todo } from "@/components/LegalPage";

export const metadata = { title: "Confidentialité · RevizUp" };

export default function Page() {
  return (
    <LegalPage title="Politique de confidentialité" updated="28 octobre 2026">
      <h2>Responsable du traitement</h2>
      <p>
        <Todo>Prénom Nom</Todo>, éditeur de RevizUp. Contact pour toute question ou demande : <Todo>adresse e-mail</Todo>.
      </p>

      <h2>Données traitées</h2>
      <ul>
        <li>Adresse e-mail, pour créer le compte et se connecter.</li>
        <li>Texte des cours importés, fiches et quiz générés, pour fournir le service.</li>
        <li>Informations d&apos;abonnement (offre, identifiant client Stripe). Les données de carte bancaire sont traitées par Stripe et ne sont jamais reçues par RevizUp.</li>
        <li>Journaux techniques (adresse IP, date des requêtes), pour la sécurité.</li>
      </ul>

      <h2>Finalités et bases légales</h2>
      <p>
        Fournir le service et gérer l&apos;abonnement (exécution du contrat) ; assurer la sécurité et prévenir les abus (intérêt
        légitime) ; tenir la comptabilité (obligation légale).
      </p>

      <h2>Intelligence artificielle</h2>
      <p>
        Pour générer une fiche ou un quiz, le texte du cours est envoyé à un modèle d&apos;IA open source hébergé par{" "}
        <Todo>Scaleway, en France</Todo>. Ce texte n&apos;est pas utilisé pour entraîner un modèle, ni par RevizUp ni par son
        fournisseur. <Todo>Vérifier ce point dans les conditions du fournisseur retenu</Todo>
      </p>

      <h2>Sous-traitants</h2>
      <ul>
        <li>Vercel Inc. : hébergement du site (serveurs à Paris ; société américaine, transferts encadrés par les clauses contractuelles types).</li>
        <li>Supabase Inc. : base de données et connexion (région de Paris).</li>
        <li><Todo>Scaleway SAS</Todo> : modèle d&apos;IA (France).</li>
        <li>Stripe Payments Europe Ltd : paiement.</li>
      </ul>

      <h2>Durée de conservation</h2>
      <p>
        Les cours, fiches et quiz sont conservés tant que le compte existe et supprimés avec lui. Les données de facturation sont
        conservées dix ans, comme l&apos;exige la loi.
      </p>

      <h2>Tes droits</h2>
      <p>
        Tu peux accéder à tes données, les rectifier, les supprimer, en demander la portabilité ou t&apos;opposer à leur traitement
        en écrivant à <Todo>adresse e-mail</Todo>. Tu peux aussi saisir la CNIL (cnil.fr).
      </p>

      <h2>Cookies</h2>
      <p>RevizUp n&apos;utilise que les cookies nécessaires à la connexion. Aucun cookie publicitaire ni de mesure d&apos;audience.</p>
    </LegalPage>
  );
}
