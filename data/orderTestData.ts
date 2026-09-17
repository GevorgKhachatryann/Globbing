// Shop names stay in English — brand names render unchanged on the site
// regardless of locale, so no translation needed here.
export const shopsByCountry: Record<string, string[]> = {
  ԱՄՆ: ['A.L.C.', '1people', 'AHparts', 'ALDO SHOES', 'ALYX Studio'],
  Անգլիա: ['ARKET', 'AXXA', 'Adidas UK', 'AllBeauty', 'Amazon UK'],
  Չինաստան: ['AliExpress', 'Tmall', 'Vmall', 'JD', 'Taobao'],
  Գերմանիա: ['Amazon', 'ASOS Germany', 'Amigo Germany'],
  Իտալիա: ['Armani Beauty', 'Bershka Italy', 'C&A'],
  Դուբայ: ['Burjauto', 'Carbox', 'JUMBO'],
  Ռուսաստան: ['ANBIK', 'Askona', 'Befree'],
  Հունաստան: ['Adopt', 'Bershka Greece', 'Zara Greece'],
  Կորեա: ['&Other Stories Korea', 'ARITAUM'],
  Իսպանիա: ['Benetton Spain', 'Bibs Spain', 'Calvin Klein Spain'],
};

// Keep English keys as the stable identifiers your tests loop over.
export const countries = Object.keys(shopsByCountry);

// What the country selector actually renders on the (Armenian-only) site.
// Source: page snapshot from tests/registration flow — confirm these match
// exactly if the site copy changes.
export const countryLabels: Record<string, string> = {
  USA: 'ԱՄՆ',
  England: 'Անգլիա',
  China: 'Չինաստան',
  Germany: 'Գերմանիա',
  Italy: 'Իտալիա',
  Dubai: 'Դուբայ',
  Russia: 'Ռուսաստան',
  Greece: 'Հունաստան',
  Korea: 'Կորեա',
  Spain: 'Իսպանիա',
};

// Delivery method labels as rendered on the site (Armenian).
// NOTE: the USA page snapshot showed TWO delivery options
// ("ԱՄՆ էքսպրես" / "ԱՄՆ ստանդարտ") — verify which one your
// tests should target, and confirm exact wording for the other
// nine countries against the live site before relying on these.
export const deliveryMethodByCountry: Record<string, string> = {
  ԱՄՆ: 'ԱՄՆ էքսպրես',
  Անգլիա: 'Անգլիա էքսպրես',
  Չինաստան: 'Չինաստան էքսպրես',
  Գերմանիա: 'Գերմանիա էքսպրես',
  Իտալիա: 'Իտալիա ցամաք',
  Դուբայ: 'Դուբայ էքսպրես',
  Ռուսաստան: 'ՌԴ էքսպրես',
  Հունաստան: 'Հունաստան ցամաք',
  Կորեա: 'Կորեա էքսպրես',
  Իսպանիա: 'Իսպանիա ցամաք',
};

// Insurance dropdown text — translated to match likely Armenian wording.
// Verify exact strings against the live insurance dropdown before use;
// currency amounts/format may differ from this placeholder translation.
export const insuranceOptions: string[] = [
  'Մինչև 50,000 | 600 դրամ',
  'Մինչև 100,000 | 1200 դրամ',
  'Մինչև 200,000 | 2400 դրամ',
  'Մինչև 300,000 | 3600 դրամ',
  'Մինչև 400,000 | 5000 դրամ',
  'Մինչև 500,000 | 6500 դրամ',
  'Մինչև 600,000 | 8000 դրամ',
];

export const PRICE_RANGE = { min: 10, max: 500 };