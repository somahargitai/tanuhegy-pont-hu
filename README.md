# tanuhegy.hu

Mobilböngészőben futó webapp. Több útvonal, mindegyikre egy QR kód mutat.
Minden oldalon egy szabálytalan, animált **hatszög-térháló** takar egy
**fekete-fehér** fotót – csak az előre kijelölt, átlátszó hatszögeken keresztül
látszanak a kép részletei. A hatszögek csúcsai finoman lebegnek.

## Deploy: két ág, két környezet

| Ág | Hova megy | Cím |
|---|---|---|
| `main` | **GitHub Pages – éles** | https://tanuhegy.hu |
| `dev` | **Vercel – pre-production** | https://tanuhegy-pont-hu.vercel.app |

Mindkettő automatikus: `main`-re pusholva a
`.github/workflows/deploy-pages.yml` buildel és deployol (~45 mp), `dev`-re
pusholva a Vercel Git-integrációja teszi ugyanezt. A szokásos menet tehát:
`dev`-en dolgozol → megnézed Vercelen → merge `main`-be → élesedik.

### Alap-útvonal (base path)

Az oldal **statikusan exportálódik** (`output: "export"`), és ugyanaz a build fut
ki mindkét helyre – és mivel a Pages egyéni domainen (`tanuhegy.hu`) a **gyökérről**
szolgál ki, mindkét helyen base path nélkül.

Ezt a `NEXT_PUBLIC_BASE_PATH` környezeti változó intézi: a workflow az
`actions/configure-pages` kimenetéből tölti fel (egyéni domainnél ez `/`, amit
üresre normalizálunk), Vercelen és helyben pedig eleve üres. Ha valaha
visszaállnánk a `somahargitai.github.io/<repo>/` címre, magától megjelenne az
előtag – nincs mit átírni.

**Ha új képet vagy SVG-t teszel be, `asset()`-tel hivatkozz rá**
(`lib/basePath.ts`). A Next csak a `<Link>` és `next/image` útvonalait igazítja a
base path-hoz — a nyers `<img src>`-eket és a canvasba töltött képeket nem, azok
előtag nélkül 404-esek lennének Pages-en.

## Futtatás

```bash
npm install
npm run dev      # http://localhost:3000
```

Telefonon (azonos WiFi-n): nyisd meg a gép IP-jét, pl. `http://192.168.1.192:3000`.
A kezdőlapon lévő QR kódok ilyenkor is a helyes címre mutatnak.

Statikus build (ugyanaz, ami élesbe megy):

```bash
npm run build                 # -> out/
cd out && python3 -m http.server 8080

# ha valaha alkönyvtárba kerülne, így tesztelhető:
NEXT_PUBLIC_BASE_PATH=/valami npm run build
mkdir -p /tmp/site && cp -R out /tmp/site/valami
cd /tmp/site && python3 -m http.server 8080   # http://localhost:8080/valami/
```

## Oldalak felvétele / hangolása

Minden oldal a `lib/pages.ts`-ben van definiálva:

```ts
{
  slug: "banya-1",              // az útvonal: /banya-1
  title: "Bánya – I.",
  image: "/images/qbanya1.jpg", // háttérkép a public/images alól
  overlay: "#0b0b0b",           // a maszk színe (tartsd monokrómnak)
  hexRadius: 96,                // csempeméret (nagyobb = kevesebb, nagyobb cella)
  seed: 101,                    // determinisztikus szabálytalanság
  reveal: { clusters: 4 },      // vagy: { indices: [12, 13, 27, ...] }
}
```

## Átlátszó hatszögek kézi kijelölése

Nyisd meg a `/editor/<slug>` oldalt (a kezdőlapon a **✎ szerkesztő** link).
Koppints a hatszögekre a ki-/bekapcsolásukhoz, majd a **Másolás a configba**
gombbal másold ki a kész `reveal: { indices: [...] }` sort, és illeszd be az adott
oldal konfigjába a `lib/pages.ts`-ben.

A háló fix, 1080×1920-as tervezési méretben épül és onnan skálázódik a
képernyőre, ezért a hatszög-indexek **eszközfüggetlenek** – amit itt kijelölsz,
minden telefonon ugyanaz a cella lesz.

## Fő fájlok

- `lib/hexMesh.ts` – a térháló geometriája (osztott csúcsú méhsejt, szabálytalanítás, animáció).
- `components/HexMesh.tsx` – canvas rajzolás + szerkesztő mód.
- `components/QRCard.tsx` – QR kód generálás a kezdőlapon.
- `lib/pages.ts` – az oldalak konfigja.
- `lib/stage.ts` – a slide-ok közös geometriája (a swipe-hoz).
- `components/SlideDeck.tsx` – swipe + a canvasszal együtt mozgó felirat/szöveg réteg.
- `lib/basePath.ts` – `asset()` a GitHub Pages alkönyvtárhoz.
