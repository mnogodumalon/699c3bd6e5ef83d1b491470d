import { useState, useEffect, useRef } from 'react';
import type { ArtikelEinstellen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Camera, Loader2 } from 'lucide-react';
import { extractFromPhoto, fileToDataUri } from '@/lib/ai';

interface ArtikelEinstellenDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: ArtikelEinstellen['fields']) => Promise<void>;
  defaultValues?: ArtikelEinstellen['fields'];
  enablePhotoScan?: boolean;
}

export function ArtikelEinstellenDialog({ open, onClose, onSubmit, defaultValues, enablePhotoScan = false }: ArtikelEinstellenDialogProps) {
  const [fields, setFields] = useState<Partial<ArtikelEinstellen['fields']>>({});
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setFields(defaultValues ?? {});
  }, [open, defaultValues]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(fields as ArtikelEinstellen['fields']);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoScan(file: File) {
    setScanning(true);
    try {
      const uri = await fileToDataUri(file);
      const schema = `{\n  "artikelname": string | null, // Artikelname\n  "beschreibung": string | null, // Beschreibung\n  "preis": number | null, // Preis (€)\n  "zustand": "gut" | "zufriedenstellend" | "neu_mit_etikett" | "neu_ohne_etikett" | "sehr_gut" | null, // Zustand\n  "kategorie": "damenkleidung" | "herrenkleidung" | "kinderkleidung" | "schuhe" | "accessoires" | "taschen" | "schmuck" | "sonstiges" | null, // Kategorie\n  "groesse": string | null, // Größe\n  "marke": string | null, // Marke\n  "farbe": string | null, // Farbe\n  "foto_1": string | null, // Foto 1\n  "foto_2": string | null, // Foto 2\n  "foto_3": string | null, // Foto 3\n  "foto_4": string | null, // Foto 4\n  "vorname": string | null, // Vorname\n  "nachname": string | null, // Nachname\n  "email": string | null, // E-Mail\n  "telefon": string | null, // Telefonnummer\n  "ort": string | null, // Ort\n}`;
      const raw = await extractFromPhoto<Record<string, unknown>>(uri, schema);
      setFields(prev => {
        const merged = { ...prev } as Record<string, unknown>;
        function matchName(name: string, candidates: string[]): boolean {
          const n = name.toLowerCase().trim();
          return candidates.some(c => c.toLowerCase().includes(n) || n.includes(c.toLowerCase()));
        }
        for (const [k, v] of Object.entries(raw)) {
          if (v != null && (merged[k] == null || merged[k] === '')) merged[k] = v;
        }
        return merged as Partial<ArtikelEinstellen['fields']>;
      });
    } catch (err) {
      console.error('Scan fehlgeschlagen:', err);
    } finally {
      setScanning(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{defaultValues ? 'Artikel einstellen bearbeiten' : 'Artikel einstellen hinzufügen'}</DialogTitle>
            {enablePhotoScan && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) handlePhotoScan(f);
                    e.target.value = '';
                  }}
                />
                <Button type="button" variant="outline" size="sm" disabled={scanning} onClick={() => fileInputRef.current?.click()}>
                  {scanning ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Camera className="h-4 w-4 mr-1" />}
                  {scanning ? 'Wird erkannt...' : 'Foto scannen'}
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="artikelname">Artikelname</Label>
            <Input
              id="artikelname"
              value={fields.artikelname ?? ''}
              onChange={e => setFields(f => ({ ...f, artikelname: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="beschreibung">Beschreibung</Label>
            <Textarea
              id="beschreibung"
              value={fields.beschreibung ?? ''}
              onChange={e => setFields(f => ({ ...f, beschreibung: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="preis">Preis (€)</Label>
            <Input
              id="preis"
              type="number"
              value={fields.preis ?? ''}
              onChange={e => setFields(f => ({ ...f, preis: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zustand">Zustand</Label>
            <Select
              value={fields.zustand ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, zustand: v === 'none' ? undefined : v as 'gut' | 'zufriedenstellend' | 'neu_mit_etikett' | 'neu_ohne_etikett' | 'sehr_gut' }))}
            >
              <SelectTrigger id="zustand"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="gut">Gut</SelectItem>
                <SelectItem value="zufriedenstellend">Zufriedenstellend</SelectItem>
                <SelectItem value="neu_mit_etikett">Neu mit Etikett</SelectItem>
                <SelectItem value="neu_ohne_etikett">Neu ohne Etikett</SelectItem>
                <SelectItem value="sehr_gut">Sehr gut</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="kategorie">Kategorie</Label>
            <Select
              value={fields.kategorie ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, kategorie: v === 'none' ? undefined : v as 'damenkleidung' | 'herrenkleidung' | 'kinderkleidung' | 'schuhe' | 'accessoires' | 'taschen' | 'schmuck' | 'sonstiges' }))}
            >
              <SelectTrigger id="kategorie"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="damenkleidung">Damenkleidung</SelectItem>
                <SelectItem value="herrenkleidung">Herrenkleidung</SelectItem>
                <SelectItem value="kinderkleidung">Kinderkleidung</SelectItem>
                <SelectItem value="schuhe">Schuhe</SelectItem>
                <SelectItem value="accessoires">Accessoires</SelectItem>
                <SelectItem value="taschen">Taschen</SelectItem>
                <SelectItem value="schmuck">Schmuck</SelectItem>
                <SelectItem value="sonstiges">Sonstiges</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="groesse">Größe</Label>
            <Input
              id="groesse"
              value={fields.groesse ?? ''}
              onChange={e => setFields(f => ({ ...f, groesse: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="marke">Marke</Label>
            <Input
              id="marke"
              value={fields.marke ?? ''}
              onChange={e => setFields(f => ({ ...f, marke: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="farbe">Farbe</Label>
            <Input
              id="farbe"
              value={fields.farbe ?? ''}
              onChange={e => setFields(f => ({ ...f, farbe: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="foto_1">Foto 1</Label>
            <Input
              id="foto_1"
              value={fields.foto_1 ?? ''}
              onChange={e => setFields(f => ({ ...f, foto_1: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="foto_2">Foto 2</Label>
            <Input
              id="foto_2"
              value={fields.foto_2 ?? ''}
              onChange={e => setFields(f => ({ ...f, foto_2: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="foto_3">Foto 3</Label>
            <Input
              id="foto_3"
              value={fields.foto_3 ?? ''}
              onChange={e => setFields(f => ({ ...f, foto_3: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="foto_4">Foto 4</Label>
            <Input
              id="foto_4"
              value={fields.foto_4 ?? ''}
              onChange={e => setFields(f => ({ ...f, foto_4: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vorname">Vorname</Label>
            <Input
              id="vorname"
              value={fields.vorname ?? ''}
              onChange={e => setFields(f => ({ ...f, vorname: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nachname">Nachname</Label>
            <Input
              id="nachname"
              value={fields.nachname ?? ''}
              onChange={e => setFields(f => ({ ...f, nachname: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-Mail</Label>
            <Input
              id="email"
              type="email"
              value={fields.email ?? ''}
              onChange={e => setFields(f => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefon">Telefonnummer</Label>
            <Input
              id="telefon"
              value={fields.telefon ?? ''}
              onChange={e => setFields(f => ({ ...f, telefon: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ort">Ort</Label>
            <Input
              id="ort"
              value={fields.ort ?? ''}
              onChange={e => setFields(f => ({ ...f, ort: e.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Abbrechen</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Speichern...' : defaultValues ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}