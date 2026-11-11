export type SchoolId = 'metro' | 'foundry' | 'redcrest';

export interface SchoolConfig {
  id: SchoolId;
  name: string;
  shortName: string;
  color: string;
  colorHex: number;
  accentColor: string;
  accentColorHex: number;
  description: string;
  style: string;
  emblemShape: 'hexagon' | 'diamond' | 'shield';
  motto: string;
  specialtyBuilding: string;
  specialtyBonus: string;
}

export const SCHOOLS: Record<SchoolId, SchoolConfig> = {
  metro: {
    id: 'metro',
    name: 'Metro Heights University',
    shortName: 'Metro',
    color: 'blue',
    colorHex: 0x3498db,
    accentColor: 'silver',
    accentColorHex: 0xbdc3c7,
    description: 'A metropolitan campus featuring modern towers, open plazas, and rooftop gathering spaces.',
    style: 'modern',
    emblemShape: 'hexagon',
    motto: 'Rise Above',
    specialtyBuilding: 'Innovation Hub',
    specialtyBonus: '+10% passive income from all buildings',
  },
  foundry: {
    id: 'foundry',
    name: 'Foundry Institute',
    shortName: 'Foundry',
    color: 'yellow',
    colorHex: 0xf1c40f,
    accentColor: 'bronze',
    accentColorHex: 0xcd7f32,
    description: 'An inventive campus with workshops, laboratories, and angular experimental architecture.',
    style: 'industrial',
    emblemShape: 'diamond',
    motto: 'Forge Forward',
    specialtyBuilding: 'Maker Workshop',
    specialtyBonus: '+15% building upgrade discount',
  },
  redcrest: {
    id: 'redcrest',
    name: 'Redcrest University',
    shortName: 'Redcrest',
    color: 'red',
    colorHex: 0xe74c3c,
    accentColor: 'gold',
    accentColorHex: 0xd4af37,
    description: 'A traditional campus with brick buildings, grand lawns, and large gathering halls.',
    style: 'traditional',
    emblemShape: 'shield',
    motto: 'Stand Strong',
    specialtyBuilding: 'Grand Hall',
    specialtyBonus: '+20% student capacity bonus',
  },
};

export const SCHOOL_IDS: SchoolId[] = ['metro', 'foundry', 'redcrest'];
export const PLOTS_PER_SCHOOL = 4;
export const MAX_PLAYERS = 12;
