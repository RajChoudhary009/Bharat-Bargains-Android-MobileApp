import { processColor } from 'react-native';

// If Color is Empaty --> convert to grey
export const FALLBACK_COLOR = '#BDBDBD';

export const colors = {
  primary: '#2874f0', gold: '#ff9f00', accent: '#e8a617', text: '#212121',
  muted: '#878787', border: '#e0e0e0', bg: '#ffffff', surface: '#f1f3f6',
  cart: '#ffffff', buy: '#fb641b', danger: '#d32f2f', success: '#388e3c',
};

export const COLOR_ALIASES = {
  // ---------- White / Cream ----------
  'off white': '#F5F5DC',
  'offwhite': '#F5F5DC',
  'cream': '#FFFDD0',
  'ivory': '#FFFFF0',
  'pearl': '#EAE0C8',
  'snow': '#FFFAFA',
  'bone': '#E3DAC9',
  'egg white': '#F0EAD6',
  'vanilla': '#F3E5AB',

  // ---------- Black / Grey / Silver ----------
  'jet black': '#0A0A0A',
  'charcoal': '#36454F',
  'charcoal grey': '#36454F',
  'charcoal gray': '#36454F',
  'dark grey': '#555555',
  'dark gray': '#555555',
  'light grey': '#D3D3D3',
  'light gray': '#D3D3D3',
  'ash': '#B2BEB5',
  'ash grey': '#B2BEB5',
  'slate': '#708090',
  'slate grey': '#708090',
  'steel': '#71797E',
  'steel grey': '#71797E',
  'gunmetal': '#2A3439',
  'silver': '#C0C0C0',
  'graphite': '#41424C',
  'smoke': '#848884',
  'melange': '#9E9E9E',
  'grey melange': '#9E9E9E',

  // ---------- Blue ----------
  'navy blue': '#000080',
  'navy': '#000080',
  'dark blue': '#00008B',
  'royal blue': '#4169E1',
  'sky blue': '#87CEEB',
  'light blue': '#ADD8E6',
  'baby blue': '#89CFF0',
  'powder blue': '#B0E0E6',
  'ice blue': '#99FFFF',
  'steel blue': '#4682B4',
  'cobalt': '#0047AB',
  'cobalt blue': '#0047AB',
  'electric blue': '#7DF9FF',
  'turquoise': '#40E0D0',
  'teal': '#008080',
  'teal blue': '#367588',
  'aqua': '#00FFFF',
  'cyan': '#00FFFF',
  'denim': '#1560BD',
  'denim blue': '#1560BD',
  'indigo': '#4B0082',
  'midnight blue': '#191970',
  'peacock blue': '#005F69',
  'cerulean': '#007BA7',
  'azure': '#007FFF',
  'sapphire': '#0F52BA',

  // ---------- Green ----------
  'dark green': '#006400',
  'light green': '#90EE90',
  'lime green': '#32CD32',
  'lime': '#00FF00',
  'olive': '#808000',
  'olive green': '#6B8E23',
  'army green': '#4B5320',
  'bottle green': '#006A4E',
  'forest green': '#228B22',
  'emerald': '#50C878',
  'emerald green': '#50C878',
  'mint': '#98FF98',
  'mint green': '#98FF98',
  'sea green': '#2E8B57',
  'pista': '#93C572',
  'pista green': '#93C572',
  'parrot green': '#8DB600',
  'moss green': '#8A9A5B',
  'sage': '#B2AC88',
  'sage green': '#B2AC88',
  'khaki green': '#78866B',
  'mehendi': '#6B8E23',
  'mehendi green': '#6B8E23',
  'neon green': '#39FF14',
  'jade': '#00A86B',

  // ---------- Red / Pink ----------
  'dark red': '#8B0000',
  'maroon': '#800000',
  'burgundy': '#800020',
  'wine': '#722F37',
  'brick red': '#B22222',
  'cherry': '#DE3163',
  'cherry red': '#D2042D',
  'crimson': '#DC143C',
  'scarlet': '#FF2400',
  'rust': '#B7410E',
  'coral': '#FF7F50',
  'salmon': '#FA8072',
  'peach': '#FFDAB9',
  'light pink': '#FFB6C1',
  'baby pink': '#F4C2C2',
  'dusty pink': '#D8A7B1',
  'rose': '#FF007F',
  'rose pink': '#FF66CC',
  'rose gold': '#B76E79',
  'hot pink': '#FF69B4',
  'fuchsia': '#FF00FF',
  'magenta': '#FF00FF',
  'rani': '#E0115F',
  'rani pink': '#E0115F',
  'blush': '#DE5D83',
  'blush pink': '#F4C2C2',
  'onion pink': '#E6A9A9',
  'ruby': '#9B111E',
  'tomato red': '#FF6347',

  // ---------- Yellow / Orange / Gold ----------
  'mustard': '#E1AD01',
  'mustard yellow': '#E1AD01',
  'lemon': '#FFF700',
  'lemon yellow': '#FFF44F',
  'canary': '#FFEF00',
  'sunshine yellow': '#FFDB58',
  'golden': '#FFD700',
  'gold': '#FFD700',
  'antique gold': '#CFB53B',
  'champagne': '#F7E7CE',
  'amber': '#FFBF00',
  'saffron': '#F4C430',
  'turmeric': '#E3A857',
  'dark orange': '#FF8C00',
  'burnt orange': '#CC5500',
  'tangerine': '#F28500',
  'apricot': '#FBCEB1',

  // ---------- Brown / Beige / Tan ----------
  'dark brown': '#5C4033',
  'light brown': '#B5651D',
  'chocolate': '#7B3F00',
  'chocolate brown': '#7B3F00',
  'coffee': '#6F4E37',
  'coffee brown': '#6F4E37',
  'tan': '#D2B48C',
  'beige': '#F5F5DC',
  'nude': '#E3BC9A',
  'camel': '#C19A6B',
  'khaki': '#C3B091',
  'taupe': '#483C32',
  'mocha': '#967969',
  'walnut': '#773F1A',
  'copper': '#B87333',
  'bronze': '#CD7F32',
  'sand': '#C2B280',
  'brown': '#8B4513',
  'cognac': '#9A463D',
  'caramel': '#AF6F09',
  'mud': '#70543E',

  // ---------- Purple / Violet ----------
  'dark purple': '#301934',
  'light purple': '#CBA3E3',
  'lavender': '#E6E6FA',
  'lilac': '#C8A2C8',
  'violet': '#8F00FF',
  'plum': '#8E4585',
  'mauve': '#E0B0FF',
  'grape': '#6F2DA8',
  'orchid': '#DA70D6',
  'amethyst': '#9966CC',
  'aubergine': '#3D0734',
  'purple': '#800080',

  // ---------- Misc ----------
  'multi': '#BDBDBD',
  'multicolor': '#BDBDBD',
  'multi color': '#BDBDBD',
  'multicolour': '#BDBDBD',
  'transparent': '#E0E0E0',
  'clear': '#E0E0E0',
};


export const fixColor = (raw) => {
  const c = String(raw ?? '').trim().toLowerCase();
  if (!c) return FALLBACK_COLOR;

  // hex
  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(c)) return c;
  if (/^([0-9a-f]{6})$/.test(c)) return `#${c}`;

  // alias table (space, hyphen, underscore)
  const spaced = c.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ');
  if (COLOR_ALIASES[spaced]) return COLOR_ALIASES[spaced];

  // RN ka apna naam
  const joined = spaced.replace(/\s/g, '');
  if (processColor(joined) != null) return joined;

  return FALLBACK_COLOR;
};