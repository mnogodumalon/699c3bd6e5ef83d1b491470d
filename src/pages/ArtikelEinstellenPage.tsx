import { useState, useEffect } from 'react';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import type { ArtikelEinstellen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Plus, Search } from 'lucide-react';
import { ArtikelEinstellenDialog } from '@/components/dialogs/ArtikelEinstellenDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageShell } from '@/components/PageShell';
import { AI_PHOTO_SCAN } from '@/config/ai-features';

export default function ArtikelEinstellenPage() {
  const [records, setRecords] = useState<ArtikelEinstellen[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ArtikelEinstellen | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ArtikelEinstellen | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      setRecords(await LivingAppsService.getArtikelEinstellen());
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(fields: ArtikelEinstellen['fields']) {
    await LivingAppsService.createArtikelEinstellenEntry(fields);
    await loadData();
    setDialogOpen(false);
  }

  async function handleUpdate(fields: ArtikelEinstellen['fields']) {
    if (!editingRecord) return;
    await LivingAppsService.updateArtikelEinstellenEntry(editingRecord.record_id, fields);
    await loadData();
    setEditingRecord(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await LivingAppsService.deleteArtikelEinstellenEntry(deleteTarget.record_id);
    setRecords(prev => prev.filter(r => r.record_id !== deleteTarget.record_id));
    setDeleteTarget(null);
  }

  const filtered = records.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return Object.values(r.fields).some(v =>
      String(v ?? '').toLowerCase().includes(s)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <PageShell
      title="Artikel einstellen"
      subtitle={`${records.length} Artikel einstellen im System`}
      action={
        <Button onClick={() => setDialogOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" /> Hinzufügen
        </Button>
      }
    >
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Artikel einstellen suchen..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Artikelname</TableHead>
              <TableHead>Beschreibung</TableHead>
              <TableHead>Preis (€)</TableHead>
              <TableHead>Zustand</TableHead>
              <TableHead>Kategorie</TableHead>
              <TableHead>Größe</TableHead>
              <TableHead>Marke</TableHead>
              <TableHead>Farbe</TableHead>
              <TableHead>Foto 1</TableHead>
              <TableHead>Foto 2</TableHead>
              <TableHead>Foto 3</TableHead>
              <TableHead>Foto 4</TableHead>
              <TableHead>Vorname</TableHead>
              <TableHead>Nachname</TableHead>
              <TableHead>E-Mail</TableHead>
              <TableHead>Telefonnummer</TableHead>
              <TableHead>Ort</TableHead>
              <TableHead className="w-24">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(record => (
              <TableRow key={record.record_id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium">{record.fields.artikelname ?? '—'}</TableCell>
                <TableCell className="max-w-xs"><span className="truncate block">{record.fields.beschreibung ?? '—'}</span></TableCell>
                <TableCell>{record.fields.preis ?? '—'}</TableCell>
                <TableCell><Badge variant="secondary">{record.fields.zustand ?? '—'}</Badge></TableCell>
                <TableCell><Badge variant="secondary">{record.fields.kategorie ?? '—'}</Badge></TableCell>
                <TableCell>{record.fields.groesse ?? '—'}</TableCell>
                <TableCell>{record.fields.marke ?? '—'}</TableCell>
                <TableCell>{record.fields.farbe ?? '—'}</TableCell>
                <TableCell>{record.fields.foto_1 ?? '—'}</TableCell>
                <TableCell>{record.fields.foto_2 ?? '—'}</TableCell>
                <TableCell>{record.fields.foto_3 ?? '—'}</TableCell>
                <TableCell>{record.fields.foto_4 ?? '—'}</TableCell>
                <TableCell>{record.fields.vorname ?? '—'}</TableCell>
                <TableCell>{record.fields.nachname ?? '—'}</TableCell>
                <TableCell>{record.fields.email ?? '—'}</TableCell>
                <TableCell>{record.fields.telefon ?? '—'}</TableCell>
                <TableCell>{record.fields.ort ?? '—'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditingRecord(record)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(record)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={18} className="text-center py-16 text-muted-foreground">
                  {search ? 'Keine Ergebnisse gefunden.' : 'Noch keine Artikel einstellen. Jetzt hinzufügen!'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ArtikelEinstellenDialog
        open={dialogOpen || !!editingRecord}
        onClose={() => { setDialogOpen(false); setEditingRecord(null); }}
        onSubmit={editingRecord ? handleUpdate : handleCreate}
        defaultValues={editingRecord?.fields}
        enablePhotoScan={AI_PHOTO_SCAN['ArtikelEinstellen']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Artikel einstellen löschen"
        description="Soll dieser Eintrag wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden."
      />
    </PageShell>
  );
}