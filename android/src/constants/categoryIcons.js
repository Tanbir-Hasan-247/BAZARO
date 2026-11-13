const CATEGORY_ICON_RULES = [
  { match: /watch|horology|time/i, icon: 'watch-outline' },
  { match: /oud|fragrance|perfume|scent/i, icon: 'sparkles-outline' },
  { match: /bag|leather|accessor|jewel/i, icon: 'briefcase-outline' },
  { match: /studio|gaming|camera|audio/i, icon: 'camera-outline' },
  { match: /electronic|gadget|tech|phone/i, icon: 'hardware-chip-outline' },
  { match: /fashion|apparel|silk|scarf/i, icon: 'shirt-outline' },
  { match: /home|appliance|living/i, icon: 'home-outline' },
  { match: /book|stationery|journal/i, icon: 'book-outline' },
];

export function getCategoryIconName(name = '') {
  const clean = String(name || '');
  const found = CATEGORY_ICON_RULES.find((rule) => rule.match.test(clean));
  return found ? found.icon : 'diamond-outline';
}
