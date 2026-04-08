// Holidays use an array — plain object would silently drop duplicate keys
// (Gandhi Jayanti + Dussehra can both fall on Oct 2)
export const INDIAN_HOLIDAYS = [
  { date: "2025-01-14", name: "Makar Sankranti",       emoji: "🪁" },
  { date: "2025-01-26", name: "Republic Day",           emoji: "🇮🇳" },
  { date: "2025-03-14", name: "Holi",                   emoji: "🎨" },
  { date: "2025-04-14", name: "Dr. Ambedkar Jayanti",   emoji: "📚" },
  { date: "2025-04-18", name: "Good Friday",            emoji: "✝️" },
  { date: "2025-05-12", name: "Buddha Purnima",         emoji: "☸️" },
  { date: "2025-08-15", name: "Independence Day",       emoji: "🇮🇳" },
  { date: "2025-08-16", name: "Janmashtami",            emoji: "🦚" },
  { date: "2025-10-02", name: "Gandhi Jayanti",         emoji: "🌿" },
  { date: "2025-10-02", name: "Dussehra",               emoji: "🏹" },
  { date: "2025-10-20", name: "Diwali",                 emoji: "🪔" },
  { date: "2025-11-05", name: "Guru Nanak Jayanti",     emoji: "🙏" },
  { date: "2025-12-25", name: "Christmas",              emoji: "🎄" },
  { date: "2026-01-14", name: "Makar Sankranti",        emoji: "🪁" },
  { date: "2026-01-26", name: "Republic Day",           emoji: "🇮🇳" },
  { date: "2026-03-03", name: "Holi",                   emoji: "🎨" },
  { date: "2026-04-03", name: "Good Friday",            emoji: "✝️" },
  { date: "2026-04-14", name: "Dr. Ambedkar Jayanti",   emoji: "📚" },
  { date: "2026-08-15", name: "Independence Day",       emoji: "🇮🇳" },
  { date: "2026-10-02", name: "Gandhi Jayanti",         emoji: "🌿" },
  { date: "2026-10-09", name: "Dussehra",               emoji: "🏹" },
  { date: "2026-10-28", name: "Diwali",                 emoji: "🪔" },
  { date: "2026-12-25", name: "Christmas",              emoji: "🎄" },
];

// Merge duplicate dates so the grid shows one combined label
export const HOLIDAY_MAP = INDIAN_HOLIDAYS.reduce((acc, h) => {
  if (acc[h.date]) {
    acc[h.date] = { ...acc[h.date], name: `${acc[h.date].name} & ${h.name}` };
  } else {
    acc[h.date] = h;
  }
  return acc;
}, {});

// THEME DEFINITIONS
// Using w=1200 for better performance.
export const MONTH_THEMES = [
  {
    month:    "January",
    // Snowy mountain
    image:    "https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=1200&q=80&auto=format&fit=crop",
    fallback: "linear-gradient(135deg,#1B3A5C 0%,#2E6B9A 50%,#7EAFD4 100%)",
    bg:       "#EBF0F5",
    accent:   "#1B4F7A",
    accentRgb:"27,79,122",
    hue:      "210",
    label:    "New Beginnings",
    season:   "winter",
  },
  {
    month:    "February",
    // Cherry blossom
    image:    "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=1200&q=80&auto=format&fit=crop",
    fallback: "linear-gradient(135deg,#5C1A3A 0%,#9B4D7A 50%,#D4A0B8 100%)",
    bg:       "#F5EBF1",
    accent:   "#7A2D5A",
    accentRgb:"122,45,90",
    hue:      "330",
    label:    "Tender Bloom",
    season:   "spring",
  },
  {
    month:    "March",
    // Hands throwing bright Holi powder
    image:    "https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=1200&q=80&auto=format&fit=crop",
    fallback: "linear-gradient(135deg,#7A2000 0%,#C44A14 50%,#F0936A 100%)",
    bg:       "#F5EEE8",
    accent:   "#B8400A",
    accentRgb:"184,64,10",
    hue:      "20",
    label:    "Colours of Holi",
    season:   "spring",
  },
  {
    month:    "April",
    // Purple wildflowers in a meadow
    image:    "https://images.unsplash.com/photo-1462275646964-a0e3386b89fa?w=1200&q=80&auto=format&fit=crop",
    fallback: "linear-gradient(135deg,#0F3D20 0%,#2E7A44 50%,#7DC48A 100%)",
    bg:       "#EBF4EE",
    accent:   "#256B3A",
    accentRgb:"37,107,58",
    hue:      "130",
    label:    "Fresh Earth",
    season:   "spring",
  },
  {
    month:    "May",
    // Golden wheat field at sunset
    image:    "https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=1200&q=80&auto=format&fit=crop",
    fallback: "linear-gradient(135deg,#5C3300 0%,#A86010 50%,#D4A040 100%)",
    bg:       "#F5F0E8",
    accent:   "#9A5A08",
    accentRgb:"154,90,8",
    hue:      "40",
    label:    "Golden Heat",
    season:   "summer",
  },
  {
    month:    "June",
    // Dense rain-forest with shafts of mist
    image:    "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&q=80&auto=format&fit=crop",
    fallback: "linear-gradient(135deg,#073A3A 0%,#0D7A7A 50%,#4DB8B8 100%)",
    bg:       "#E8F3F3",
    accent:   "#0D5C5C",
    accentRgb:"13,92,92",
    hue:      "170",
    label:    "First Showers",
    season:   "monsoon",
  },
  {
    month:    "July",
    // Waterfall through tropical forest
    image:    "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1200&q=80&auto=format&fit=crop",
    fallback: "linear-gradient(135deg,#0A1F3D 0%,#1A4A7A 50%,#4A80B0 100%)",
    bg:       "#E8EEF5",
    accent:   "#1A3D6B",
    accentRgb:"26,61,107",
    hue:      "200",
    label:    "Deep Monsoon",
    season:   "monsoon",
  },
  {
    month:    "August",
    // Sunsets
    image:    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=80&auto=format&fit=crop",
    fallback: "linear-gradient(135deg,#0A2E18 0%,#1A6B36 50%,#4AB870 100%)",
    bg:       "#E8F2EC",
    accent:   "#1A5C2E",
    accentRgb:"26,92,46",
    hue:      "140",
    label:    "Independence",
    season:   "monsoon",
  },
  {
    month:    "September",
    // Vineyards
    image:    "https://images.unsplash.com/photo-1476673160081-cf065607f449?w=1200&q=80&auto=format&fit=crop",
    fallback: "linear-gradient(135deg,#3A1E00 0%,#8B5A10 50%,#C8963C 100%)",
    bg:       "#F2ECE5",
    accent:   "#6B3E0A",
    accentRgb:"107,62,10",
    hue:      "35",
    label:    "Harvest Time",
    season:   "autumn",
  },
  {
    month:    "October",
    // Diwali vibes
    image:    "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200&q=80&auto=format&fit=crop",
    fallback: "linear-gradient(135deg,#5C1C00 0%,#B84010 50%,#F07840 100%)",
    bg:       "#F5EDEA",
    accent:   "#A83A00",
    accentRgb:"168,58,0",
    hue:      "25",
    label:    "Festive Season",
    season:   "autumn",
  },
  {
    month:    "November",
    // Holiday lights
    image:    "https://images.unsplash.com/photo-1477601263568-180e2c6d046e?w=1200&q=80&auto=format&fit=crop",
    fallback: "linear-gradient(135deg,#200A40 0%,#5A1A8A 50%,#A060D4 100%)",
    bg:       "#EEEAF5",
    accent:   "#4A1A7A",
    accentRgb:"74,26,122",
    hue:      "275",
    label:    "Diwali Glow",
    season:   "autumn",
  },
  {
    month:    "December",
    // Winter road
    image:    "https://images.unsplash.com/photo-1418985991508-e47386d96a71?w=1200&q=80&auto=format&fit=crop",
    fallback: "linear-gradient(135deg,#0A1E30 0%,#1F4A6B 50%,#4A80A8 100%)",
    bg:       "#E8EEF2",
    accent:   "#1F4A6B",
    accentRgb:"31,74,107",
    hue:      "215",
    label:    "Year's End",
    season:   "winter",
  },
];
