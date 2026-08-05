# Anna – hatszög / foto / QR

Mobilböngészőben futó webapp. Több útvonal, mindegyikre egy QR kód mutat.
Minden oldalon egy szabálytalan, animált **hatszög-térháló** takar egy
**fekete-fehér** fotót – csak az előre kijelölt, átlátszó hatszögeken keresztül
látszanak a kép részletei. A hatszögek csúcsai finoman lebegnek.

## Futtatás

```bash
npm install
npm run dev      # http://localhost:3000
```

Telefonon (azonos WiFi-n): nyisd meg a gép IP-jét, pl. `http://192.168.1.192:3000`.
A kezdőlapon lévő QR kódok ilyenkor is a helyes címre mutatnak.

Éles build:

```bash
npm run build && npm run start
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
