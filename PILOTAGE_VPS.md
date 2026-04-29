# Pilotage VPS + Claude Code Remote Control

Référence pratique. Mise à jour 2026-04-29.

---

## Identité du VPS

| | |
|---|---|
| Hostname | `srv1624764.hstgr.cloud` |
| IPv4 | `187.127.225.167` |
| IPv6 | `2a02:4780:7:3d08::1` |
| OS | Ubuntu 24.04 / KVM 2 |
| Disque | 100 GB |
| Plan expire | **2026-05-27** (renouveler avant — [rappel auto programmé pour le 2026-05-22](https://claude.ai/code/routines/trig_01TwVk92TkUXXmKMtcXYJ3rQ)) |

---

## Connexion

```bash
ssh vps                       # alias Mac (config dans ~/.ssh/config)
ssh root@187.127.225.167      # direct, marche partout
```

L'alias `vps` inclut keepalive 60s pour éviter `Broken pipe` après inactivité.

---

## Tmux — l'essentiel

| Action | Commande |
|---|---|
| Lister les sessions actives | `tmux ls` |
| Attacher une session | `tmux attach -t <nom>` |
| **Détacher** (laisse tourner) | `Ctrl+b` puis `d` |
| Créer une session détachée | `tmux new -d -s <nom> "<commande>"` |
| Tuer une session | `tmux kill-session -t <nom>` |
| Tuer toutes les sessions | `tmux kill-server` |

Tout ce qui tourne dans tmux **survit** à la déconnexion SSH, au reboot Mac, etc.

---

## Claude Code sur le VPS

- Binaire : `/root/.local/bin/claude` (pas dans le PATH des shells non-interactifs)
- Config user : `~/.claude/settings.json`
- Hooks actifs : `Stop` → `claude-auto-push` (commit + push GitHub auto)
- Auth : compte Claude Max `maz11hakim@gmail.com`, modèle Opus 4.7 1M

### Slash commands utiles
- `/exit` — quitter
- `/context` — visualiser usage du contexte
- `/extra-usage` — config dépassements

### Mode Remote Control vs Teleport vs Dispatch

| Feature | Tourne où | Quand l'utiliser |
|---|---|---|
| **Remote Control** | ton VPS | piloter ton VPS depuis le tel — **c'est ce qu'on utilise** |
| **Teleport** (`/remote-env`) | sandbox Anthropic cloud | bidouille rapide isolée, pas tes vrais fichiers |
| **Dispatch** ("Envoi" app mobile) | agent autonome Anthropic | tâches "fire and forget" sur tes repos GitHub |

---

## Workflow Remote Control

### Premier lancement d'un projet

```bash
ssh vps
mkdir -p ~/projets/<nom> && cd ~/projets/<nom>
claude-init-project <nom>     # init git + .gitignore + repo privé GitHub
tmux new -d -s claude-<nom> "cd ~/projets/<nom> && /root/.local/bin/claude remote-control"
```

Côté tel : app Claude → onglet **Code** → sélectionner `srv1624764-<nom-mignon>` dans le picker.

### Reprendre une session déjà lancée

```bash
ssh vps
tmux ls                       # voit ce qui tourne
# rien d'autre — la session est déjà disponible côté tel
```

### Voir/debug la console d'une session

```bash
ssh vps
tmux attach -t claude-<nom>   # tu vois les logs Remote Control
# Ctrl+b puis d pour détacher sans tuer
```

### Tuer une session Remote Control

```bash
ssh vps "tmux kill-session -t claude-<nom>"
```

---

## GitHub auto-sync

Tous les projets sur le VPS = repo privé `github.com/maz11hakim-art/<nom>`.

### Scripts installés (dans `/usr/local/bin/`)

- **`claude-init-project <nom>`** : init git + .gitignore standard + crée repo privé + 1er push
- **`claude-auto-push`** : commit `chore: auto-snapshot <iso>` + push, appelé par hook Stop
- **`claude-sessions`** : liste les sessions Remote Control actives (root + claudeuser) avec leur URL
- **`sync-pilotage-doc`** : copie `/usr/local/share/claude-vps/PILOTAGE_VPS.md` dans tous les projets, commit + push auto

### .gitignore standard (créé auto)

`node_modules/`, `dist/`, `build/`, `.next/`, `.expo/`, `.vite/`, `.netlify/`, `.turbo/`, `.cache/`, `*.log`, `.DS_Store`, `.env`, `.env.*`, `*.keystore`, `*.jks`, `*.pem`

---

## Multi-projets en parallèle

Une instance `claude remote-control` = un projet. Pour bosser sur plusieurs :

```bash
tmux new -d -s rc-projetD   "cd ~/projets/projetD && /usr/local/bin/claude remote-control"
tmux new -d -s rc-internat  "cd ~/projets/internat && /usr/local/bin/claude remote-control"
tmux new -d -s rc-fretboard "cd ~/projets/fretboard && /usr/local/bin/claude remote-control"
```

Chaque instance apparaît dans le picker mobile sous un nom `srv1624764-XXX`.

**Note** : une seule instance peut héberger jusqu'à 32 sessions concurrentes dans le **même** dossier projet (option spawn=same-dir par défaut).

---

## User `claudeuser` (mode bypass permissions)

Pour faire tourner une session Remote Control en mode `bypassPermissions` (Claude exécute tout sans demander confirmation), Claude refuse cette config quand l'user est `root` (sécurité hardcodée). Solution : un user dédié `claudeuser` configuré sur le VPS.

| Détail | Valeur |
|---|---|
| Login | pas de mot de passe, clé SSH uniquement (même clé Mac que root) |
| Auth Claude / gh | copiées de root, fonctionnent |
| Home | `/home/claudeuser` |
| Projets sous | `/home/claudeuser/projets/<nom>` |
| Hook auto-push | actif (mêmes scripts `/usr/local/bin/claude-*`) |

### Connexion directe en SSH comme claudeuser

```bash
ssh claudeuser@187.127.225.167
```

### Gérer les sessions claudeuser depuis SSH root

```bash
sudo -u claudeuser -H tmux ls
sudo -u claudeuser -H tmux attach -t <nom>
sudo -u claudeuser -H tmux kill-session -t <nom>
```

### Lancer une session bypass

```bash
sudo -u claudeuser -H bash -c \
  "tmux new -d -s rc-<nom> 'cd /home/claudeuser/projets/<projet> && /usr/local/bin/claude remote-control --permission-mode bypassPermissions --name <projet>'"
```

### Quand utiliser bypass vs normal

| Mode | Comportement | Usage |
|---|---|---|
| **normal** (root) | demande confirmation pour chaque action sensible | dev quotidien, tâches sérieuses |
| **bypass** (claudeuser) | exécute tout sans demander | automatisation, scripts longs, tâches répétitives — **éviter pour code critique** |

---

## Doc accessible depuis chaque session

Le fichier `PILOTAGE_VPS.md` est présent à la racine de **chaque projet** sur le VPS. Depuis n'importe quelle session Remote Control sur le tel :

```
"Affiche-moi le contenu de PILOTAGE_VPS.md"
```

Claude lira le fichier local et te le présentera dans le chat — récupérable depuis le tel.

Le fichier maître est à `/usr/local/share/claude-vps/PILOTAGE_VPS.md`. Pour mettre à jour partout après modification :

```bash
/usr/local/bin/sync-pilotage-doc
```

---

## Auto-relance après reboot VPS (à activer si besoin)

Créer le script `/root/start-claude-sessions.sh` avec une fonction `launch` qui lance les sessions tmux voulues, puis ajouter au cron :

```
@reboot /bin/bash /root/start-claude-sessions.sh
```

---

## Limites à connaître

- **App mobile** : 1 session visible à la fois (picker pour switcher), pas de split-screen.
- **`claude` non trouvé en mode tmux non-interactif** → toujours utiliser `/root/.local/bin/claude` plein chemin dans les `tmux new -d`.
- **Workspace trust** : nouveau projet doit avoir `hasTrustDialogAccepted: true` dans `~/.claude.json` sous `"projects"`. Lancer `claude` une fois en interactif dans le dossier suffit (accepter le dialog), ou éditer le JSON manuellement.
- **VPS ressources** : KVM 2, ~5 sessions Remote Control en parallèle = pas de souci.

---

## Troubleshooting

| Symptôme | Cause / Fix |
|---|---|
| `client_loop: send disconnect: Broken pipe` | Inactivité SSH. Le keepalive dans `~/.ssh/config` couvre. Sinon : reconnecte, et lance les processus longs dans tmux. |
| `Workspace not trusted` au lancement | Ajouter projet dans `~/.claude.json` (voir Limites) |
| `claude: command not found` dans tmux | Utiliser `/root/.local/bin/claude` plein chemin |
| L'auto-push ne se déclenche pas | Vérifier `cat ~/.claude/settings.json` → doit contenir hook Stop pointant vers `/usr/local/bin/claude-auto-push` |
| QR code ne s'affiche pas | Tape `space` dans la console Remote Control (tmux attach pour la voir) |

---

## Cloner ce repo sur ton Mac (lecture offline)

```bash
gh repo clone maz11hakim-art/test-vps-claude ~/Documents/Claude/Projects/vps-guide
```

---

## Rappels programmés (Claude Code routines)

| Quoi | Quand | Lien |
|---|---|---|
| Renouvellement VPS Hostinger | 2026-05-22 09:00 Paris (5 jours avant expiration) | https://claude.ai/code/routines/trig_01TwVk92TkUXXmKMtcXYJ3rQ |

Pour gérer toutes les routines : https://claude.ai/code/routines
