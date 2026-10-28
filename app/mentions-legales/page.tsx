import LegalPage, { Todo } from "@/components/LegalPage";

export const metadata = { title: "Mentions légales · RevizUp" };

export default function Page() {
  return (
    <LegalPage title="Mentions légales" updated="28 octobre 2026">
      <h2>Éditeur du site</h2>
      <p>
        Le site RevizUp est édité par <Todo>Prénom Nom</Todo>, entrepreneur individuel, immatriculé sous le numéro SIREN{" "}
        <Todo>numéro SIREN</Todo>, dont l&apos;adresse est <Todo>adresse postale</Todo>.
        <br />
        Contact : <Todo>adresse e-mail de contact</Todo>
        <br />
        Directeur de la publication : <Todo>Prénom Nom</Todo>.
      </p>
      <p>TVA non applicable, article 293 B du Code général des impôts.</p>

      <h2>Hébergement</h2>
      <p>
        Le site est hébergé par Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis, sur des serveurs situés à
        Paris. La base de données est hébergée par Supabase Inc. dans la région de Paris (Union européenne). Le modèle d&apos;IA
        est fourni par <Todo>Scaleway SAS, 8 rue de la Ville l&apos;Évêque, 75008 Paris, ou autre fournisseur retenu</Todo>.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        La marque RevizUp, le site et ses contenus propres sont la propriété de l&apos;éditeur. Les cours importés restent la
        propriété de leurs auteurs ; l&apos;utilisateur garantit avoir le droit de les utiliser pour ses propres révisions.
      </p>
    </LegalPage>
  );
}
