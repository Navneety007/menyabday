# Menya's Birthdayyayie 💗

A little website: a secret-code lock, a hand-drawn gift, a flower vortex, polaroids, poems, a handwritten letter, and a finale. It plays music the whole way through.

---

## ✏️ The easy way: the editor

Double-click **`Edit Website.command`** in this folder. The first time, macOS may ask whether to open it: right-click it, choose **Open**, then confirm. Your browser then opens the editor, where you can:

- edit every piece of text, one card per screen
- click any photo to replace it, or use **+ Add photos** (iPhone HEIC photos are converted automatically)
- choose your song file
- add, delete and reorder poems, photo walls, quotes and letters
- click **Preview ↗** on any card to jump straight to that screen
- click **Publish** to save a version (and push it to GitHub once the folder is connected)

Everything saves as you type. Keep the Terminal window that opens alongside the editor running while you work; close it when you're done.

The sections below explain the manual way, if you ever want it.

## 1. Adding your photos

Put your pictures in the **`photos/`** folder and name them exactly like this:

| File name | Where it shows up |
|---|---|
| `you.jpg` | left heart frame on the code screen |
| `me.jpg` | right heart frame on the code screen |
| `01.jpg` … `06.jpg` | the first polaroid wall |
| `07.jpg` … `11.jpg` | the second polaroid wall |

Until a photo is there, its polaroid shows a pink placeholder with the file name it's waiting for.

**Tips**
- Use `.jpg` and keep each photo under about 500 KB so the site loads fast on her phone. On a Mac you can open a photo in **Preview → Tools → Adjust Size**, set the width to about **1200 px**, and save.
- iPhone photos are often `.HEIC`. Convert them first: open the photo in Preview, choose **File → Export**, and set Format to **JPEG**.
- Want different names or more photos? Edit the list in `content.js`. Each photo is one line:
  ```js
  { src: "photos/12.jpg", caption: "the beach" },
  ```

## 2. Changing the words

Open **`content.js`** in any text editor (TextEdit works; VS Code is nicer). Every bit of text on the site is in there:

- `lock.code` is the 4-digit secret code (default `1402`). Set `lock.enabled: false` to skip the code screen.
- `lock.hint` is the hint shown under the code boxes.
- `gift.title`, `intro.title`, `finale.title`: the headline words.
- `story` is the list of blocks she scrolls through, in order.

Only change the text **inside the quotes**. Keep the commas and brackets as they are.

## 3. Adding poems

Copy this block into the `story` list wherever you want the poem to appear:

```js
{
  type: "poem",
  title: "Your poem title",
  lines: [
    "first line",
    "second line",
    "",                // an empty line starts a new stanza
    "third line",
  ],
  author: "— me",
},
```

The other block types work the same way:

```js
{ type: "quote", text: "One big line that lights up word by word as she scrolls." },

{ type: "polaroids", title: "a title", photos: [ { src: "photos/12.jpg", caption: "caption" } ] },

{ type: "letter", greeting: "To My Dearest,", paragraphs: ["...", "..."], signoff: "Forever yours,", signature: "Me" },
```

## 4. Music

Put your song in the **`music/`** folder and name it **`song.mp3`**. It starts the first time she taps the screen (phones only allow sound after a tap) and loops. Until you add a song, a soft music-box melody plays instead.

## 5. Trying it on your computer

Open Terminal in this folder and run:

```bash
python3 -m http.server 5180
```

Then visit http://localhost:5180. Opening `index.html` by double-clicking also mostly works, but the local server is closer to the real thing.

## 6. Putting it online (GitHub Pages)

1. Create a repository on GitHub, for example `for-you`.
2. Upload everything in this folder: drag the files onto the repo page, or push with git.
3. Go to **Settings → Pages → Build and deployment**, set **Source: Deploy from a branch**, then choose **Branch: `main`** and **`/ (root)`**, and click **Save**.
4. About a minute later the site is live at `https://<your-username>.github.io/for-you/`.

Each time you change a file and upload it again, the site updates within a minute or so.

> A free GitHub account can only publish Pages from a **public** repository. Anyone who finds the repo can see the photos and text, but the site itself is only reachable through its link (or the QR code).
