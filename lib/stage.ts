// Közös "színpad" geometria. A tervezés fix méretű slide-okban készül
// (1080×1920), és több slide egyetlen, összefüggő vászont alkot. A vásznat
// "cover" módon skálázzuk a képernyőre, vízszintesen pedig a swipe pozíciója
// (progress) tolja el – így a canvas (kép + hatszögrács) és a DOM rétegek
// (felirat, szövegek) pontosan együtt mozognak.

export const SLIDE_W = 1080;
export const SLIDE_H = 1920;

/**
 * Függőleges túlfutás tervezési pixelben. A terv 9:16, a mai telefonok ennél
 * nyúltabbak – a slide TELJES szélességét mutatjuk (különben a szélső
 * szövegek levágódnának), a maradék helyet pedig a kép és a rács tölti ki.
 * 440 px túlfutás egészen 1080:2760 (≈0.39) képarányig elég.
 */
export const BLEED_Y = 440;

export type StageTransform = {
  /** A tervezési pixel → CSS pixel szorzó. */
  scale: number;
  /** A vászon (0,0) pontja a képernyőn, CSS pixelben. */
  offX: number;
  offY: number;
  /** Egy slide szélessége a képernyőn, CSS pixelben. */
  slideW: number;
};

/**
 * @param progress Hányadik slide van a képernyőn (törtszám: 1.5 = félúton
 *   a második és harmadik slide között).
 */
export function stageTransform(
  cssW: number,
  cssH: number,
  progress: number
): StageTransform {
  // Szélességre illesztünk: egy slide pontosan kitölti a képernyő szélességét.
  // Fekvő ablakban ez egyben "cover" is (a magasság túlfut).
  const scale = cssW / SLIDE_W;
  const slideW = cssW;
  return {
    scale,
    offX: (cssW - slideW) / 2 - progress * slideW,
    offY: (cssH - SLIDE_H * scale) / 2,
    slideW,
  };
}
