import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
  @font-face { font-family:'MariellaNove'; src:url('/mariella-noeve.ttf') format('truetype'); font-display:swap; }
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  body{background:#060608;}
`;

const PAGES = {
  "mentions-legales": {
    title: "Mentions Légales",
    content: `
## Éditeur du site

**Nom :** Olivier AMISADOR
**Statut :** Micro-entreprise
**SIRET :** 992 564 468 000 13
**Adresse :** Le Gosier, Guadeloupe (971), France
**Email :** contact@fyltra.app

## Hébergement

Le site Fyltra est hébergé par :
**Vercel Inc.**
340 Pine Street, Suite 701
San Francisco, CA 94104, États-Unis
[vercel.com](https://vercel.com)

## Directeur de la publication

Olivier AMISADOR

## Propriété intellectuelle

L'ensemble du contenu de ce site (textes, visuels, logos, code) est la propriété exclusive d'Olivier AMISADOR et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle. Toute reproduction, même partielle, est strictement interdite sans autorisation préalable écrite.

## Données personnelles

Pour toute question relative à vos données personnelles, consultez notre [Politique de Confidentialité](/confidentialite) ou contactez-nous à contact@fyltra.app.
    `
  },

  "cgv": {
    title: "Conditions Générales de Vente",
    content: `
## 1. Objet

Les présentes Conditions Générales de Vente (CGV) régissent les relations contractuelles entre Olivier AMISADOR (micro-entreprise, SIRET 992 564 468 000 13), éditeur du service Fyltra, et tout utilisateur souhaitant souscrire à un abonnement payant.

## 2. Service proposé

Fyltra est un journal de trading en ligne permettant aux traders de suivre, analyser et améliorer leurs performances via un tableau de bord, des statistiques avancées et un coaching basé sur l'intelligence artificielle.

## 3. Prix

Les tarifs sont affichés en euros (€) toutes taxes comprises sur la page Tarifs du site.
- **Early Bird :** 19,99 € / mois (prix verrouillé à vie pour les 50 premiers abonnés)
- **Pro Trader :** 24,99 € / mois

Le paiement est mensuel, sans engagement. Les prix peuvent être modifiés à tout moment pour les nouveaux abonnements, sans effet rétroactif sur les abonnements en cours.

## 4. Paiement

Le paiement est effectué via **Lemon Squeezy**, marchand de référence (Merchant of Record) qui gère la facturation, la TVA et la sécurité des transactions. Les moyens de paiement acceptés sont ceux proposés par Lemon Squeezy (carte bancaire, etc.).

## 5. Accès au service

L'accès au service est activé dès confirmation du paiement. Un email de confirmation est envoyé à l'adresse utilisée lors du paiement, permettant d'activer le compte.

## 6. Droit de rétractation

Conformément à l'article L.221-18 du Code de la consommation, vous disposez d'un délai de **14 jours** à compter de la souscription pour exercer votre droit de rétractation, sans avoir à justifier de motif.

Pour exercer ce droit, envoyez un email à contact@fyltra.app en indiquant votre souhait de vous rétracter et votre adresse email d'abonnement. Le remboursement sera effectué dans les 14 jours suivant la réception de votre demande.

**Exception :** conformément à l'article L.221-28 du Code de la consommation, le droit de rétractation ne peut être exercé si le service a été pleinement exécuté avant la fin du délai de rétractation, avec votre accord préalable exprès.

## 7. Résiliation

Vous pouvez résilier votre abonnement à tout moment depuis votre espace client Lemon Squeezy ou en contactant contact@fyltra.app. La résiliation prend effet à la fin de la période de facturation en cours.

## 8. Disponibilité du service

Fyltra s'efforce d'assurer une disponibilité maximale du service. Des interruptions ponctuelles peuvent survenir pour maintenance ou pour des raisons techniques indépendantes de notre volonté.

## 9. Responsabilité

Fyltra est un outil d'aide à l'analyse et ne constitue en aucun cas un conseil en investissement financier. Toute décision de trading reste sous l'entière responsabilité de l'utilisateur.

## 10. Loi applicable

Les présentes CGV sont soumises au droit français. Tout litige sera porté devant les juridictions compétentes du ressort de la Guadeloupe.

## 11. Contact

Pour toute question : contact@fyltra.app
    `
  },

  "confidentialite": {
    title: "Politique de Confidentialité",
    content: `
## 1. Responsable du traitement

Olivier AMISADOR
Micro-entreprise — SIRET 992 564 468 000 13
Email : contact@fyltra.app

## 2. Données collectées

Dans le cadre de l'utilisation de Fyltra, nous collectons les données suivantes :

**Lors du paiement (via Lemon Squeezy) :**
- Adresse email
- Informations de paiement (gérées exclusivement par Lemon Squeezy)

**Lors de l'utilisation de l'application :**
- Données de trading saisies manuellement (trades, notes, stratégies)
- Préférences et paramètres de l'application

**Automatiquement :**
- Données de connexion (adresse IP, navigateur, date et heure)

## 3. Finalité des traitements

| Données | Finalité | Base légale |
|---------|----------|-------------|
| Email | Gestion du compte et accès au service | Exécution du contrat |
| Email | Envoi de communications liées au service | Intérêt légitime |
| Données de trading | Fourniture des fonctionnalités de l'app | Exécution du contrat |
| Données de connexion | Sécurité et prévention de la fraude | Intérêt légitime |

## 4. Durée de conservation

- **Données de compte :** durée de l'abonnement + 3 ans après résiliation
- **Données de trading :** durée de l'abonnement, puis supprimées sur demande
- **Données de connexion :** 12 mois

## 5. Sous-traitants

| Prestataire | Rôle | Pays |
|-------------|------|------|
| Supabase Inc. | Base de données et authentification | États-Unis |
| Vercel Inc. | Hébergement | États-Unis |
| Lemon Squeezy | Paiement et facturation | États-Unis |
| Groq Inc. | Analyse IA des trades | États-Unis |

Ces prestataires sont soumis à des contrats garantissant un niveau de protection adéquat des données conformément au RGPD.

## 6. Vos droits (RGPD)

Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :

- **Accès** : obtenir une copie de vos données
- **Rectification** : corriger des données inexactes
- **Suppression** : demander l'effacement de vos données
- **Opposition** : vous opposer à certains traitements
- **Portabilité** : recevoir vos données dans un format structuré

Pour exercer ces droits : contact@fyltra.app

En cas de réponse insatisfaisante, vous pouvez saisir la **CNIL** (Commission Nationale de l'Informatique et des Libertés) : [cnil.fr](https://www.cnil.fr).

## 7. Cookies

Fyltra utilise uniquement des cookies techniques strictement nécessaires au fonctionnement du service (session, préférences). Aucun cookie publicitaire ou de tracking tiers n'est utilisé.

## 8. Sécurité

Vos données sont stockées de manière sécurisée via Supabase avec chiffrement en transit (HTTPS) et au repos. L'accès est protégé par authentification.

## 9. Modifications

Cette politique peut être mise à jour. Toute modification substantielle sera notifiée par email.

**Dernière mise à jour :** Mai 2026
    `
  }
};

function renderMarkdown(text) {
  const lines = text.trim().split("\n");
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("## ")) {
      elements.push(<h2 key={i} style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginTop: 36, marginBottom: 12, letterSpacing: "-0.01em" }}>{line.slice(3)}</h2>);
    } else if (line.startsWith("| ") && line.endsWith(" |")) {
      // Table
      const tableLines = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        if (!lines[i].match(/^\|[-| ]+\|$/)) tableLines.push(lines[i]);
        i++;
      }
      elements.push(
        <div key={i} style={{ overflowX: "auto", marginBottom: 16 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            {tableLines.map((row, ri) => {
              const cells = row.split("|").filter(c => c.trim() !== "");
              const Tag = ri === 0 ? "th" : "td";
              return (
                <tr key={ri} style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  {cells.map((cell, ci) => (
                    <Tag key={ci} style={{ padding: "8px 12px", color: ri === 0 ? "rgba(232,205,169,0.8)" : "rgba(255,255,255,0.55)", fontWeight: ri === 0 ? 600 : 400, textAlign: "left" }}>{cell.trim()}</Tag>
                  ))}
                </tr>
              );
            })}
          </table>
        </div>
      );
      continue;
    } else if (line.startsWith("- ")) {
      const items = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={i} style={{ paddingLeft: 20, marginBottom: 12 }}>
          {items.map((item, ii) => <li key={ii} style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: formatInline(item) }} />)}
        </ul>
      );
      continue;
    } else if (line.trim() === "") {
      // skip
    } else {
      elements.push(<p key={i} style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.8, marginBottom: 10 }} dangerouslySetInnerHTML={{ __html: formatInline(line) }} />);
    }
    i++;
  }
  return elements;
}

function formatInline(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:rgba(255,255,255,0.85);font-weight:600">$1</strong>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color:#e8cda9;text-decoration:underline" target="_blank" rel="noreferrer">$1</a>');
}

export default function Legal() {
  const location = useLocation();
  const navigate = useNavigate();
  const page = location.pathname.replace("/", "");
  const data = PAGES[page];

  useEffect(() => { window.scrollTo(0, 0); }, [page]);

  if (!data) {
    navigate("/");
    return null;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#060608", fontFamily: "'Outfit',sans-serif", color: "#fff" }}>
      <style>{FONTS}</style>

      {/* Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, padding: "0 5vw", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(6,6,8,0.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <button onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer" }}>
          <img src="/fyltra-logo-black.svg" style={{ height: 60, width: "auto" }} alt="Fyltra" />
        </button>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 14px", color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
          ← Retour
        </button>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 740, margin: "0 auto", padding: "60px 5vw 100px" }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, color: "#e8cda9", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 10, fontWeight: 600 }}>Fyltra · Légal</div>
          <h1 style={{ fontSize: "clamp(28px,5vw,48px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1 }}>{data.title}</h1>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 36 }}>
          {renderMarkdown(data.content)}
        </div>

        {/* Links to other pages */}
        <div style={{ marginTop: 60, paddingTop: 32, borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: 16, flexWrap: "wrap" }}>
          {Object.entries(PAGES).filter(([slug]) => slug !== page).map(([slug, p]) => (
            <button key={slug} onClick={() => navigate(`/${slug}`)}
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 16px", color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif", transition: "all .2s" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.4)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}>
              {p.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
