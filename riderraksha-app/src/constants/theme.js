export const C = {
  bg:      '#07090F',
  surf:    '#0D1117',
  card:    '#111827',
  cardHi:  '#16202E',
  border:  '#1E2D3D',
  borderHi:'#2A4060',
  orange:  '#FF6B2B',
  orangeDim:'#FF6B2B22',
  teal:    '#00D4AA',
  tealDim: '#00D4AA18',
  red:     '#FF4560',
  redDim:  '#FF456018',
  yellow:  '#F5A623',
  blue:    '#3D8EF0',
  purple:  '#8B5CF6',
  text:    '#EDF2FF',
  sub:     '#7A94B0',
  muted:   '#3D556B',
  faint:   '#0D1523',
};

export const CITIES = {
  Hyderabad: ['Zone-1','Zone-2','Zone-3','Zone-4'],
  Mumbai:    ['Zone-1','Zone-2','Zone-3','Zone-4'],
  Delhi:     ['Zone-1','Zone-2','Zone-3','Zone-4'],
  Bangalore: ['Zone-1','Zone-2','Zone-3','Zone-4'],
  Chennai:   ['Zone-1','Zone-2','Zone-3','Zone-4'],
  Pune:      ['Zone-1','Zone-2','Zone-3','Zone-4'],
};

export const TIERS = [
  { name:'BASIC',    label:'Basic',    premium:29, cap:1000, color:'#3D8EF0', icon:'🔵', desc:'Occasional riders' },
  { name:'STANDARD', label:'Standard', premium:59, cap:2500, color:'#FF6B2B', icon:'🟠', desc:'Full-time partners', popular:true },
  { name:'PRO',      label:'Pro',      premium:99, cap:5000, color:'#00D4AA', icon:'🟢', desc:'High earners' },
];

export const TRIGGER_META = {
  RAIN:   { icon:'🌧️', label:'Heavy Rainfall',  threshold:'>60mm/hr',    hours:4.0 },
  HEAT:   { icon:'🌡️', label:'Extreme Heat',    threshold:'>43°C',       hours:3.0 },
  AQI:    { icon:'😷', label:'Severe AQI',      threshold:'AQI >350',    hours:5.0 },
  FLOOD:  { icon:'🌊', label:'Flash Flood',     threshold:'Zone alert',   hours:6.0 },
  CURFEW: { icon:'🚫', label:'Curfew / Strike', threshold:'>2hr closure', hours:5.0 },
};

export const STATUS_COLOR = {
  APPROVED:     '#00D4AA',
  PENDING:      '#F5A623',
  UNDER_REVIEW: '#3D8EF0',
  REJECTED:     '#FF4560',
  ACTIVE:       '#00D4AA',
  EXPIRED:      '#3D556B',
};

export const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
`;
