// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export interface ArtikelEinstellen {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    artikelname?: string;
    beschreibung?: string;
    preis?: number;
    zustand?: 'gut' | 'zufriedenstellend' | 'neu_mit_etikett' | 'neu_ohne_etikett' | 'sehr_gut';
    kategorie?: 'damenkleidung' | 'herrenkleidung' | 'kinderkleidung' | 'schuhe' | 'accessoires' | 'taschen' | 'schmuck' | 'sonstiges';
    groesse?: string;
    marke?: string;
    farbe?: string;
    foto_1?: string;
    foto_2?: string;
    foto_3?: string;
    foto_4?: string;
    vorname?: string;
    nachname?: string;
    email?: string;
    telefon?: string;
    ort?: string;
  };
}

export const APP_IDS = {
  ARTIKEL_EINSTELLEN: '699c3bc70ed1606ddd89088d',
} as const;

// Helper Types for creating new records
export type CreateArtikelEinstellen = ArtikelEinstellen['fields'];