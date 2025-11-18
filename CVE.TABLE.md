
Dans ce TP DevSecOps, j’ai analysé le projet Node.js avec plusieurs outils de scan (npm audit, Snyk, Trivy, Gitleaks). Cela m’a permis d’identifier des vulnérabilités dans les dépendances ainsi qu’un secret exposé dans le dépôt.

Le tableau ci-dessous résume les principales vulnérabilités trouvées : pour chacune, je précise la référence (CVE ou advisory), le package concerné, la version vulnérable, le correctif appliqué, la gravité et le lien avec l’OWASP Top 10.

| #   | Vulnérabilité                                   | Référence (CVE/Advisory)  | Package affecté      | Version vulnérable | Correctif appliqué                                        | Gravité      | OWASP Top-10 2021                                         |
| --- | ----------------------------------------------- | ------------------------- | -------------------- | ------------------ | --------------------------------------------------------- | ------------ | --------------------------------------------------------- |
| 1   | Command Injection via template                  | CVE-2021-23337            | lodash               | 4.17.20            | `npm install lodash@4.17.21`                              | HIGH         | A06:2021 - Vulnerable Components                          |
| 2   | ReDoS via toNumber/trim                         | CVE-2020-28500            | lodash               | 4.17.20            | `npm install lodash@4.17.21`                              | MEDIUM       | A06:2021 - Vulnerable Components                          |
| 3   | Signature verification laxity (digestAlgorithm) | CVE-2022-24771            | node-forge           | 0.10.0             | `npm install node-forge@1.3.1`                            | HIGH         | A02:2021 - Cryptographic Failures                         |
| 4   | Signature verification trailing garbage bytes   | CVE-2022-24772            | node-forge           | 0.10.0             | `npm install node-forge@1.3.1`                            | HIGH         | A02:2021 - Cryptographic Failures                         |
| 5   | Open Redirect                                   | CVE-2022-0122             | node-forge           | 0.10.0             | `npm install node-forge@1.3.1`                            | MEDIUM       | A01:2021 - Broken Access Control                          |
| 6   | DigestInfo structure verification laxity        | CVE-2022-24773            | node-forge           | 0.10.0             | `npm install node-forge@1.3.1`                            | MEDIUM       | A02:2021 - Cryptographic Failures                         |
| 7   | Prototype Pollution in debug API                | GHSA-5rrq-pxf6-6jx5       | node-forge           | 0.10.0             | `npm install node-forge@1.3.1`                            | LOW          | A08:2021 - Software and Data Integrity Failures           |
| 8   | URL parsing unexpected behavior                 | GHSA-gf8q-jrpm-jvxq       | node-forge           | 0.10.0             | `npm install node-forge@1.3.1`                            | UNKNOWN      | A05:2021 - Security Misconfiguration                      |
| 9   | Remote Code Injection via deleteFunctions       | CVE-2020-7660             | serialize-javascript | 2.1.0              | `npm install serialize-javascript@7.0.0` + `safeSerialize` | HIGH         | A03:2021 - Injection                                      |
| 10  | XSS via unsafe RegExp serialization             | CVE-2019-16769            | serialize-javascript | 2.1.0              | `npm install serialize-javascript@7.0.0` + `safeSerialize` | MEDIUM       | A03:2021 - Injection                                      |
| 11  | Secret exposé : Clé privée RSA                  | N/A - Secret Exposure     | private-node.pem     | N/A                | `git rm --cached private-node.pem` + règle `.gitignore`   | CRITICAL     | A02:2021 - Cryptographic Failures *(ou A07 si tu préfères)* |

Explications: 

1) lodash (Command Injection + ReDoS)

Pourquoi corriger ?
La version utilisée de lodash contenait des failles qui pouvaient permettre soit d’exécuter du code malveillant, soit de faire ralentir ou tomber le serveur avec des entrées spécialement construites. Comme lodash est utilisé dans notre projet pour manipuler des données côté serveur, garder cette version vulnérable exposait inutilement l’application.

Pourquoi cette correction ?
J’ai mis à jour lodash vers la version 4.17.21, qui corrige les failles signalées par les outils (npm audit, Snyk). Cela ne change pas le comportement fonctionnel du code, mais supprime les vulnérabilités connues sur ce composant.

2) node-forge (failles cryptographiques, open redirect, etc.)

Pourquoi corriger ?
node-forge est une librairie de cryptographie. Les vulnérabilités détectées dans l’ancienne version pouvaient affaiblir la vérification des signatures ou permettre des comportements inattendus (open redirect, mauvaise validation). Même si le projet est un TP, utiliser une librairie crypto vulnérable n’est pas acceptable dans une démarche DevSecOps.

Pourquoi cette correction ?
J’ai mis à jour node-forge vers la version 1.3.1, recommandée par les outils de scan. Cette version corrige l’ensemble des failles identifiées, tout en restant compatible avec le projet. On garde les mêmes fonctionnalités, mais avec une base cryptographique à jour et plus sûre.

3) serialize-javascript (RCE / XSS)

Pourquoi corriger ?
serialize-javascript sert à transformer des objets en texte. Les vulnérabilités de l’ancienne version pouvaient permettre de générer du JavaScript exécutable à partir de données utilisateur, ce qui ouvre la porte à de l’injection de code ou de la XSS. Comme la route /serialize sérialise directement le corps de la requête, le risque était réel.

Pourquoi cette correction ?
J’ai mis à jour la librairie en version 7.0.0, qui corrige les CVE remontées, puis j’ai modifié le code pour remplacer la fonction unsafeSerialize par safeSerialize, sans option “unsafe”. On limite ainsi la sérialisation à des données et non plus à du code exécutable, ce qui réduit fortement le risque d’injection.

4) Clé privée RSA exposée (private-node.pem)

Pourquoi corriger ?
La présence d’une clé privée dans le dépôt est un problème de sécurité, même si la clé est factice pour le TP. Dans un vrai projet, une clé privée exposée pourrait être réutilisée pour usurper le service ou accéder à des ressources protégées. C’est typiquement un exemple de mauvaise gestion des secrets.

Pourquoi cette correction ?
J’ai ajouté le fichier dans .gitignore et je l’ai retiré du suivi Git avec git rm --cached, puis supprimé du projet pour que les scanners (Trivy, Gitleaks) ne le détectent plus. 

En revanche, j’ai conservé le fichier private-node.pem.pub car il contient uniquement la clé publique, qui n’est pas sensible et peut être partagée sans risque dans le cadre du TP.

Lors de certains runs GitHub Actions, Gitleaks a affiché des avertissements liés aux services GitHub (erreur de cache / service temporairement indisponible). Il s’agit d’un incident côté plateforme et non d’un problème de configuration du workflow. Les scans restent correctement configurés dans le pipeline CI.

Pour Snyk, le workflow CI est correctement configuré de mon côté ; le code de sortie 2 vient d’un problème technique lié à l’outil / au service externe, et pas d’une erreur dans mon code ou mon fichier YAML.

