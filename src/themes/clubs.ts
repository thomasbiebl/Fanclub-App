/**
 * Clubs with their well-known colors, for the club themes. Names are only labels,
 * the app uses no logos or crests. Colors were put together from memory: please check them
 * and adjust the hex values if a club uses a different shade.
 *
 * `colors` is [main color, second color]. A white second color is fine.
 */
export interface Club {
  id: string;
  name: string;
  league: 1 | 2;
  colors: [string, string];
}

export const CLUBS: Club[] = [
  // 1. Bundesliga
  { id: 'bayern', name: 'FC Bayern München', league: 1, colors: ['#DC052D', '#0066B2'] },
  { id: 'dortmund', name: 'Borussia Dortmund', league: 1, colors: ['#FDE100', '#000000'] },
  { id: 'leipzig', name: 'RB Leipzig', league: 1, colors: ['#DD0741', '#001F47'] },
  { id: 'leverkusen', name: 'Bayer 04 Leverkusen', league: 1, colors: ['#E32221', '#000000'] },
  { id: 'frankfurt', name: 'Eintracht Frankfurt', league: 1, colors: ['#E1000F', '#000000'] },
  { id: 'freiburg', name: 'SC Freiburg', league: 1, colors: ['#E2001A', '#000000'] },
  { id: 'stuttgart', name: 'VfB Stuttgart', league: 1, colors: ['#E32219', '#FFFFFF'] },
  { id: 'wolfsburg', name: 'VfL Wolfsburg', league: 1, colors: ['#65B32E', '#FFFFFF'] },
  { id: 'gladbach', name: 'Borussia Mönchengladbach', league: 1, colors: ['#009A44', '#000000'] },
  { id: 'mainz', name: '1. FSV Mainz 05', league: 1, colors: ['#C3141E', '#FFFFFF'] },
  { id: 'hoffenheim', name: 'TSG Hoffenheim', league: 1, colors: ['#1961B5', '#FFFFFF'] },
  { id: 'augsburg', name: 'FC Augsburg', league: 1, colors: ['#BA3733', '#046A38'] },
  { id: 'bremen', name: 'SV Werder Bremen', league: 1, colors: ['#1D9053', '#FFFFFF'] },
  { id: 'union', name: '1. FC Union Berlin', league: 1, colors: ['#EB1923', '#F5C400'] },
  { id: 'stpauli', name: 'FC St. Pauli', league: 1, colors: ['#5C3A21', '#FFFFFF'] },
  { id: 'heidenheim', name: '1. FC Heidenheim', league: 1, colors: ['#E2001A', '#003A79'] },
  { id: 'koeln', name: '1. FC Köln', league: 1, colors: ['#ED1C24', '#FFFFFF'] },
  { id: 'hamburg', name: 'Hamburger SV', league: 1, colors: ['#005CA9', '#000000'] },
  // 2. Bundesliga
  { id: 'hertha', name: 'Hertha BSC', league: 2, colors: ['#004D9E', '#FFFFFF'] },
  { id: 'hannover', name: 'Hannover 96', league: 2, colors: ['#00983C', '#000000'] },
  { id: 'nuernberg', name: '1. FC Nürnberg', league: 2, colors: ['#AF1900', '#000000'] },
  { id: 'duesseldorf', name: 'Fortuna Düsseldorf', league: 2, colors: ['#E2001A', '#FFFFFF'] },
  { id: 'karlsruhe', name: 'Karlsruher SC', league: 2, colors: ['#004C97', '#FFFFFF'] },
  { id: 'darmstadt', name: 'SV Darmstadt 98', league: 2, colors: ['#004E9E', '#FFFFFF'] },
  { id: 'schalke', name: 'FC Schalke 04', league: 2, colors: ['#004D9D', '#FFFFFF'] },
  { id: 'kaiserslautern', name: '1. FC Kaiserslautern', league: 2, colors: ['#D6001C', '#FFFFFF'] },
  { id: 'braunschweig', name: 'Eintracht Braunschweig', league: 2, colors: ['#FFD400', '#0A3D91'] },
  { id: 'paderborn', name: 'SC Paderborn 07', league: 2, colors: ['#004C97', '#000000'] },
  { id: 'elversberg', name: 'SV 07 Elversberg', league: 2, colors: ['#000000', '#FFFFFF'] },
  { id: 'fuerth', name: 'SpVgg Greuther Fürth', league: 2, colors: ['#00A650', '#FFFFFF'] },
  { id: 'magdeburg', name: '1. FC Magdeburg', league: 2, colors: ['#0057A8', '#FFFFFF'] },
  { id: 'muenster', name: 'Preußen Münster', league: 2, colors: ['#006B3F', '#000000'] },
  { id: 'kiel', name: 'Holstein Kiel', league: 2, colors: ['#004B93', '#D5001C'] },
  { id: 'bielefeld', name: 'Arminia Bielefeld', league: 2, colors: ['#0068B3', '#000000'] },
  { id: 'bochum', name: 'VfL Bochum', league: 2, colors: ['#005BA6', '#FFFFFF'] },
  { id: 'dresden', name: 'Dynamo Dresden', league: 2, colors: ['#FFD500', '#000000'] },
];
