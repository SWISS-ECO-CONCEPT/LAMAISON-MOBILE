import { MaterialIcons } from '@expo/vector-icons';

export type PropertyType = 'maison' | 'appartement' | 'terrain' | 'chambre' | 'meublé' | 'studio' | 'duplex';

export const PROPERTY_TYPES: { key: PropertyType; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { key: 'maison', label: 'Maison', icon: 'home' },
  { key: 'appartement', label: 'Appartement', icon: 'apartment' },
  { key: 'terrain', label: 'Terrain', icon: 'landscape' },
  { key: 'chambre', label: 'Chambre', icon: 'bed' },
  { key: 'meublé', label: 'Meublé', icon: 'weekend' },
  { key: 'studio', label: 'Studio', icon: 'meeting-room' },
  { key: 'duplex', label: 'Duplex', icon: 'layers' },
];