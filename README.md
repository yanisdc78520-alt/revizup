# RevizUp

Ton cours devient fiches et quiz. Application web : Next.js, Supabase, IA open source (Scaleway ou ton propre serveur), Stripe.

## Ce que fait l'app

- Inscription et connexion par lien e-mail (sans mot de passe).
- Import de cours en PDF, Word (.docx) ou texte collé. Le texte est extrait dans le navigateur.
- Repérage automatique des grands thèmes du cours.
- Fiches de révision (courte ou détaillée) et quiz (QCM, vrai/faux, mixte ; facile ou examen), sur tout le cours ou un point précis.
- Affinage d'une fiche ou d'un quiz par une demande libre (« plus court », « plus dur »…).
- Essai gratuit : 5 générations, 3 cours. Offre Pro à 4,99 €/mois via Stripe, résiliable depuis l'app.
- Pages mentions légales, CGV et confidentialité (à compléter : passages surlignés entre crochets).

## Où sont les réglages

| Fichier | Rôle |
|---|---|
| `lib/plans.ts` | Limites de l'essai gratuit et de l'offre Pro, prix affiché |
| `lib/prompts.ts` | Consignes données à l'IA pour les fiches et les quiz |
| `lib/llm.ts` | Connexion au modèle d'IA (format standard compatible avec tous les serveurs open source) |
| `supabase/schema.sql` | Base de données, sécurité et quota |
| `.env.example` | Liste des clés à renseigner dans Vercel |

---

## Mise en ligne, pas à pas

Compte environ une heure la première fois. Ne colle jamais une clé dans un message ou dans le code : uniquement dans Vercel.

### 1. Supabase (base de données et connexion)

1. Sur supabase.com, crée un projet `revizup`, région **West EU (Paris)**.
2. Menu **SQL Editor** → **New query** : colle tout le contenu de `supabase/schema.sql`, puis **Run**.
3. Menu **Project Settings → API** : note l'**URL du projet**, la clé **anon public** et la clé **service_role** (secrète).
4. Menu **Authentication → URL Configuration** : mets l'adresse de ton site dans **Site URL** (tu l'auras à l'étape 4 ; mets provisoirement `http://localhost:3000`) et ajoute `https://TON-SITE/auth/callback` dans **Redirect URLs**.
5. Facultatif mais conseillé avant le lancement : **Authentication → Emails → SMTP Settings**, branche un service d'envoi d'e-mails (Brevo, par exemple), car l'envoi intégré de Supabase est limité à quelques e-mails par heure.

### 2. Le modèle d'IA open source

**Pour démarrer (Scaleway Generative APIs) :**
1. Sur scaleway.com, crée un compte, puis un projet.
2. Menu **IAM → API keys** → **Generate API key**. Note la **Secret key**.
3. Menu **Generative APIs** : vérifie l'adresse de l'API (en général `https://api.scaleway.ai/v1`) et le nom exact des modèles disponibles.
4. Réglages à mettre dans Vercel :
   - `LLM_BASE_URL` = l'adresse de l'API
   - `LLM_API_KEY` = la Secret key
   - `LLM_MODEL` = le modèle le plus capable de la liste (ex. `llama-3.3-70b-instruct`)
   - `LLM_MODEL_FAST` = un petit modèle (ex. `mistral-nemo-instruct-2407`)

**Plus tard (ton propre serveur) :** loue une instance GPU, installe vLLM avec le modèle de ton choix, puis change seulement `LLM_BASE_URL`, `LLM_API_KEY` et `LLM_MODEL`. Rien d'autre ne change.

### 3. Stripe (abonnement Pro), en mode test

1. Sur stripe.com, reste en **mode test** (interrupteur en haut).
2. **Product catalog → Add product** : nom `RevizUp Pro`, prix **4,99 € par mois, récurrent**. Note l'identifiant du prix (`price_…`).
3. **Developers → API keys** : note la **Secret key** (`sk_test_…`).
4. **Settings → Billing → Customer portal** : active le portail (résiliation et changement de carte).
5. Le webhook se crée après l'étape 4, quand tu connais l'adresse du site.

### 4. Vercel (mise en ligne)

1. Sur vercel.com, connecte-toi avec GitHub, **Add New → Project**, choisis le dépôt `revizup`.
2. Avant **Deploy**, ouvre **Environment Variables** et ajoute toutes les lignes de `.env.example` avec tes valeurs.
3. **Deploy**. Vercel te donne une adresse (ex. `revizup.vercel.app`).
4. Mets cette adresse dans `NEXT_PUBLIC_SITE_URL` (Settings → Environment Variables), puis **Redeploy**.
5. Retourne dans Supabase (étape 1.4) pour mettre la vraie adresse.
6. Dans Stripe : **Developers → Webhooks → Add endpoint**, adresse `https://TON-SITE/api/stripe/webhook`, événements `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`. Copie le **Signing secret** dans `STRIPE_WEBHOOK_SECRET` sur Vercel, puis **Redeploy**.

### 5. Tester

1. Ouvre le site, connecte-toi avec ton e-mail.
2. Importe un cours, génère une fiche puis un quiz.
3. Clique sur **Passer en Pro**, paie avec la carte de test Stripe `4242 4242 4242 4242` (date future, n'importe quel code).
4. Vérifie que le badge **Pro** apparaît et que **Mon abonnement** ouvre le portail.

### Avant d'encaisser de vrais paiements

- Déclare-toi micro-entrepreneur (autoentrepreneur.urssaf.fr) pour avoir un SIREN.
- Complète les passages entre crochets dans les pages légales et choisis un médiateur de la consommation.
- Vérifie les conditions du fournisseur d'IA sur la réutilisation des données.
- Passe Stripe en mode réel et remplace les clés `sk_test_` et `price_` par les vraies.
- Achète un nom de domaine et ajoute-le dans Vercel (Settings → Domains).

## Lancer l'app sur ton ordinateur (facultatif)

Il faut Node.js 20 ou plus récent.

```bash
npm install
cp .env.example .env.local   # puis remplis les valeurs
npm run dev                  # ouvre http://localhost:3000
```
