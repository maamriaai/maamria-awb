# Making `maamria-awb` available everywhere

When you run `maamria-awb init` in some other project and zsh says:

```
zsh: command not found: maamria-awb
```

…it's because the CLI lives only inside this `maamria-awb/` folder. To call it from **any directory** you have four options. Pick the one that fits your workflow — they're equivalent in behavior.

> All four still let `npm run build` / `tsx` keep working — they just put the `maamria-awb` name on your `$PATH`.
>
> **Path convention used below:** the examples assume you cloned the repo to **`~/maamria-awb`**. If you put it somewhere else, swap that path everywhere it appears (e.g. `~/code/maamria-awb`, `~/work/oss/maamria-awb`).

---

## Option 1 — `npm link` (recommended for dev)

`npm link` symlinks the package into your global node prefix. After it, `maamria-awb` and `maamria` become real commands available in every shell.

```bash
cd ~/maamria-awb
npm install        # once, if you haven't already
npm link
```

Verify:

```bash
which maamria-awb
# → /usr/local/bin/maamria-awb         (macOS, npm prefix /usr/local)
# or /opt/homebrew/bin/maamria-awb     (macOS Apple-silicon brew)
# or ~/.npm-global/bin/maamria-awb     (custom prefix)

maamria-awb --version
```

Use it anywhere:

```bash
cd ~/projects/some-app
maamria-awb init
```

To undo:

```bash
cd ~/maamria-awb
npm unlink -g @maamria/awb
```

### If `npm link` says EACCES / permission denied

You're hitting a global node prefix that needs sudo. Fix it once by pointing npm at a folder you own:

```bash
mkdir -p ~/.npm-global
npm config set prefix ~/.npm-global
echo 'export PATH="$HOME/.npm-global/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

For bash use `~/.bashrc` (Linux) or `~/.bash_profile` (macOS) instead of `~/.zshrc`. Then re-run `npm link`.

---

## Option 2 — pnpm link --global

If you used pnpm to install:

```bash
cd ~/maamria-awb
pnpm install
pnpm link --global
```

Verify:

```bash
which maamria-awb
maamria-awb --version
```

Undo:

```bash
pnpm unlink --global
```

---

## Option 3 — Manual symlink into a directory already on `$PATH`

Lower-level, but doesn't depend on npm/pnpm at all.

```bash
# pick a folder that's already on $PATH (or add one — see Option 4)
ln -s ~/maamria-awb/bin/maamria-awb.js \
      /usr/local/bin/maamria-awb

chmod +x ~/maamria-awb/bin/maamria-awb.js
```

If `/usr/local/bin` needs sudo (often the case on stock macOS), use a user-owned dir like `~/bin` and add it to `$PATH`:

```bash
mkdir -p ~/bin
ln -s ~/maamria-awb/bin/maamria-awb.js ~/bin/maamria-awb

# zsh:
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# bash on Linux:
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# bash on macOS:
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bash_profile
source ~/.bash_profile
```

Verify:

```bash
which maamria-awb
maamria-awb --version
```

Undo:

```bash
rm /usr/local/bin/maamria-awb     # or ~/bin/maamria-awb
```

---

## Option 4 — Add the package's `bin/` to `$PATH`

No symlink, no `npm link` — just put the package's own `bin/` directory on the path.

### zsh (default on macOS)

```bash
# ~/.zshrc
echo 'export PATH="$HOME/maamria-awb/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### bash on Linux

```bash
# ~/.bashrc
echo 'export PATH="$HOME/maamria-awb/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### bash on macOS

```bash
# ~/.bash_profile  (macOS bash sources this for login shells)
echo 'export PATH="$HOME/maamria-awb/bin:$PATH"' >> ~/.bash_profile
source ~/.bash_profile
```

Verify:

```bash
which maamria-awb
# → ~/maamria-awb/bin/maamria-awb.js

maamria-awb --version
```

Make sure the bin file is executable:

```bash
chmod +x ~/maamria-awb/bin/maamria-awb.js
```

Undo: open the rc file in an editor and delete the line you appended, then `source` it again.

---

## Option 5 — Shell alias (quickest, slightly limited)

Aliases work inside the shell that defined them. They don't get inherited by `npm`, `make`, etc., but they're great for quick personal use.

### zsh

```bash
echo 'alias maamria-awb="$HOME/maamria-awb/bin/dev.sh"' >> ~/.zshrc
source ~/.zshrc
```

### bash on Linux

```bash
echo 'alias maamria-awb="$HOME/maamria-awb/bin/dev.sh"' >> ~/.bashrc
source ~/.bashrc
```

### bash on macOS

```bash
echo 'alias maamria-awb="$HOME/maamria-awb/bin/dev.sh"' >> ~/.bash_profile
source ~/.bash_profile
```

Verify:

```bash
type maamria-awb
# → maamria-awb is an alias for /Users/.../maamria-awb/bin/dev.sh

maamria-awb --version
```

Undo: edit the rc file and delete the alias line, then `source` it again, or `unalias maamria-awb` for the current shell.

---

## Picking between them

| You want… | Use |
|---|---|
| The cleanest "real command" experience and you have npm working | **Option 1 — `npm link`** |
| Same as above but you're on pnpm | **Option 2 — `pnpm link --global`** |
| No reliance on npm/pnpm internals | **Option 3 — manual symlink** |
| To keep the source folder authoritative and skip symlinks | **Option 4 — PATH entry** |
| Fast and disposable (you might delete the folder later) | **Option 5 — alias** |

---

## After you've set it up

You should now be able to `cd` anywhere and run:

```bash
cd ~/some-other-project
maamria-awb status
maamria-awb init
```

Files generated by `init` land in the **current working directory** — so `cd` into the project you want to set up first.

If `maamria-awb` works in **one** terminal but not another, your rc file edit didn't take effect there. Reopen the terminal, or run `source ~/.zshrc` (or the bash file you edited) in the failing one.

### Sanity checklist

```bash
# 1. is it on PATH?
which maamria-awb

# 2. does it run?
maamria-awb --version

# 3. is it pointing at the right backend?
maamria-awb config

# 4. are you logged in?
maamria-awb status
```

If `which` prints nothing, your shell isn't seeing the change. Re-source the rc file or restart the terminal.

---

## Updating after a code change

- **Option 1 / 2 (`npm link` / `pnpm link --global`)** — nothing to do. The link points at the source; just edit and re-run.
  - If you have a `dist/` build, run `npm run build` after changes so the bin loads the new compiled code.
  - If you don't, `bin/maamria-awb.js` falls back to `tsx` automatically.
- **Option 3 (symlink)** — same; the symlink keeps pointing at the source.
- **Option 4 (PATH)** — same; it's the actual file.
- **Option 5 (alias)** — same; it points at `bin/dev.sh`.

In other words: once it's wired up, you never have to redo it. Edit `src/`, run again.

---

## Going back to "just from this folder"

If you ever want to drop the global install and only run from the package directory again:

```bash
# Option 1
npm unlink -g @maamria/awb

# Option 2
pnpm unlink --global

# Option 3
rm /usr/local/bin/maamria-awb   # or ~/bin/maamria-awb

# Option 4
# remove the export line from ~/.zshrc / ~/.bashrc / ~/.bash_profile

# Option 5
unalias maamria-awb
# and remove the alias line from your rc file
```

Then keep using:
```bash
cd maamria-awb
./bin/dev.sh init
```
