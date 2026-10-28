import LegalPage, { Todo } from "@/components/LegalPage";
import { LIMITS, PRO_PRICE_LABEL } from "@/lib/plans";

export const metadata = { title: "Conditions générales · RevizUp" };

export default function Page() {
  return (
    <LegalPage title="Conditions générales d'utilisation et de vente" updated="28 octobre 2026">
      <h2>1. Objet</h2>
      <p>
        Les présentes conditions régissent l&apos;utilisation du service RevizUp, édité par <Todo>Prénom Nom</Todo>, qui permet de
        générer des fiches de révision et des quiz à partir de cours importés par l&apos;utilisateur. Créer un compte vaut acceptation
        de ces conditions.
      </p>

      <h2>2. Compte</h2>
      <p>
        L&apos;inscription se fait avec une adresse e-mail valide. L&apos;utilisateur est responsable de l&apos;accès à sa
        messagerie, qui sert à se connecter. Le service est réservé aux personnes de 15 ans et plus ; en dessous, l&apos;accord
        d&apos;un titulaire de l&apos;autorité parentale est requis.
      </p>

      <h2>3. Offres</h2>
      <p>
        <b>Offre gratuite</b> : {LIMITS.free.generations} générations (fiches, quiz ou affinages), {LIMITS.free.courses} cours au
        maximum.
        <br />
        <b>Offre Pro</b> : {PRO_PRICE_LABEL} TTC par mois, sans engagement, générations illimitées dans la limite d&apos;un usage
        raisonnable de {LIMITS.pro.generationsPer30Days} générations par période de 30 jours.
      </p>

      <h2>4. Paiement et résiliation</h2>
      <p>
        Le paiement est mensuel, par carte bancaire, via le prestataire Stripe. L&apos;abonnement se renouvelle automatiquement
        chaque mois. Il peut être résilié à tout moment depuis l&apos;espace « Mon abonnement » ; la résiliation prend effet à la
        fin de la période déjà payée.
      </p>

      <h2>5. Droit de rétractation</h2>
      <p>
        Conformément à l&apos;article L. 221-28 du Code de la consommation, en demandant l&apos;accès immédiat au service Pro lors
        du paiement, l&apos;utilisateur reconnaît que l&apos;exécution commence avant la fin du délai de rétractation de 14 jours et
        renonce expressément à ce droit. <Todo>Faire valider cette clause et ajouter la case à cocher correspondante au paiement</Todo>
      </p>

      <h2>6. Contenus de l&apos;utilisateur</h2>
      <p>
        L&apos;utilisateur reste titulaire des droits sur les cours qu&apos;il importe et garantit avoir le droit de les utiliser
        pour ses révisions personnelles. Il s&apos;interdit d&apos;importer des contenus illicites.
      </p>

      <h2>7. Limites du service</h2>
      <p>
        Les fiches et les quiz sont générés automatiquement par une intelligence artificielle. Malgré les consignes données au
        modèle, ils peuvent contenir des erreurs ou des omissions. Ils constituent une aide à la révision et ne remplacent pas le
        cours original, qui reste la référence. L&apos;éditeur ne garantit pas les résultats obtenus aux examens.
      </p>

      <h2>8. Disponibilité</h2>
      <p>
        L&apos;éditeur s&apos;efforce d&apos;assurer l&apos;accès au service sans interruption, sans obligation de résultat. Le
        service peut être suspendu pour maintenance.
      </p>

      <h2>9. Données personnelles</h2>
      <p>Le traitement des données est décrit dans la politique de confidentialité.</p>

      <h2>10. Litiges et médiation</h2>
      <p>
        Les présentes conditions sont soumises au droit français. En cas de litige, l&apos;utilisateur consommateur peut recourir
        gratuitement au médiateur de la consommation <Todo>nom et coordonnées du médiateur choisi</Todo>, après une réclamation
        écrite restée sans réponse satisfaisante.
      </p>
    </LegalPage>
  );
}
