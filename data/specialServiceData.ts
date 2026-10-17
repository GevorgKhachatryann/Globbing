// TODO: replace every value below once you have the real DOM.
// Each ID must match whatever attribute the tile actually uses
// (data-id, data-service, id, etc. — confirm in selectSpecialServiceOption
// inside pages/OrderPage.ts and update both places together).

export const specialServices = {
  holdAtWarehouse: 'level12',       // Պահել պահեստում
  photoBeforePacking: 'level23',                 // Չվերափաթեթավորել / Լուսանկարել
  secureRepacking: 'level25',         // Ապահով փաթեթավորում
  photoAfterPacking: 'level26',            // Լուսանկարել դրսից
  returnToShop: 'level27',                      // Վերադարձնել
  checkWeight: 'level29',                 // Ստուգել պատվերը
  divideIntoTwo: 'level30',                     // Միավորել
  combineTwo: 'level31',                       // Բաժանել մասերի
  deconsolidation: 'level54',          // Վերափաթեթավորել
} as const;

export type SpecialServiceKey = keyof typeof specialServices;

// Verified on am.new.globbing.com (2026-10-17): the service card's data-id,
// language-independent. Use with OrderPage.getSpecialServiceCard().
// NOTE: several labels in `specialServices` above do not match their ids
// (e.g. level30 is Consolidate, level54 is Repack) — prefer this map.
export const specialServiceIds = {
  hold: 12,
  doNotRepack: 23,
  photoInside: 24,
  safeRepack: 25,
  photoOutside: 26,
  return: 27,
  recipientChange: 28,
  checkOrder: 29,
  consolidate: 30,
  deconsolidate: 31,
  repack: 54,
} as const;

// Pairs that the app should NOT allow on the same parcel at once.
// TODO: confirm which pairs are actually mutually exclusive — you named
// deconsolidation + "do not repack" as one example; there may be others.
export const conflictingServicePairs: [SpecialServiceKey, SpecialServiceKey][] = [
  ['deconsolidation', 'photoBeforePacking'], // placeholder — replace with the real "do not repack" key
];