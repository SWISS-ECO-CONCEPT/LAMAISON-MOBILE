import { MaterialIcons } from '@expo/vector-icons';

export type PropertyType = 'maison' | 'appartement' | 'terrain' | 'chambre' | 'meublé' | 'studio' | 'duplex';

// Le libellé affiché vient de la traduction `propertyTypes.<key>` ; `key` reste
// la valeur métier (envoyée au backend, utilisée comme texte de recherche).
export const PROPERTY_TYPES: { key: PropertyType; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { key: 'maison', icon: 'home' },
  { key: 'appartement', icon: 'apartment' },
  { key: 'terrain', icon: 'landscape' },
  { key: 'chambre', icon: 'bed' },
  { key: 'meublé', icon: 'weekend' },
  { key: 'studio', icon: 'meeting-room' },
  { key: 'duplex', icon: 'layers' },
];