export const shopsByCountry: Record<string, string[]> = {
  USA: ['A.L.C.', '1people', 'AHparts', 'ALDO SHOES', 'ALYX Studio'],
  England: ['ARKET', 'AXXA', 'Adidas UK', 'AllBeauty', 'Amazon UK'],
  China: ['AliExpress', 'Tmall', 'Vmall', 'JD', 'Taobao'],
  Germany: ['Amazon', 'ASOS Germany', 'Amigo Germany'],
  Italy: ['Armani Beauty', 'Bershka Italy', 'C&A'],
  Dubai: ['Burjauto', 'Carbox', 'JUMBO'],
  Russia: ['ANBIK', 'Askona', 'Befree'],
  Greece: ['Adopt', 'Bershka Greece', 'Zara Greece'],
  Korea: ['&Other Stories Korea', 'ARITAUM',],
  Spain: ['Benetton Spain', 'Bibs Spain', 'Calvin Klein Spain'],
};

export const countries = Object.keys(shopsByCountry);

export const deliveryMethodByCountry: Record<string, string> = {
  USA: 'USA express',
  England: 'England express',
  China: 'China express',
  Germany: 'Germany express',
  Italy: 'Italy ground',
  Dubai: 'Dubai express',
  Russia: 'Russia express',
  Greece: 'Greece ground',
  Korea: 'Korea express',
  Spain: 'Spain ground',
};

export const insuranceOptions: string[] = [
  'Up to 50,000 | 600 dram',
  'Up to 100,000 | 1200 dram',
  'Up to 200,000 | 2400 dram',
  'Up to 300,000 | 3600 dram',
  'Up to 400,000 | 5000 dram',
  'Up to 500,000 | 6500 dram',
  'Up to 600,000 | 8000 dram',
];

export const PRICE_RANGE = { min: 10, max: 500 };