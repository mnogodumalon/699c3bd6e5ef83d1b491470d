import { useState, useMemo } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import type { ArtikelEinstellen } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { formatCurrency } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Plus, Search, Tag, Pencil, Trash2, MapPin, Phone, Mail, ShoppingBag, Package, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/StatCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ArtikelEinstellenDialog } from '@/components/dialogs/ArtikelEinstellenDialog';
import { AI_PHOTO_SCAN } from '@/config/ai-features';

const KATEGORIE_LABELS: Record<string, string> = {
  damenkleidung: 'Damenkleidung',
  herrenkleidung: 'Herrenkleidung',
  kinderkleidung: 'Kinderkleidung',
  schuhe: 'Schuhe',
  accessoires: 'Accessoires',
  taschen: 'Taschen',
  schmuck: 'Schmuck',
  sonstiges: 'Sonstiges',
};

const ZUSTAND_LABELS: Record<string, string> = {
  neu_mit_etikett: 'Neu mit Etikett',
  neu_ohne_etikett: 'Neu ohne Etikett',
  sehr_gut: 'Sehr gut',
  gut: 'Gut',
  zufriedenstellend: 'Zufriedenstellend',
};

const ZUSTAND_COLORS: Record<string, string> = {
  neu_mit_etikett: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  neu_ohne_etikett: 'bg-teal-100 text-teal-700 border-teal-200',
  sehr_gut: 'bg-blue-100 text-blue-700 border-blue-200',
  gut: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  zufriedenstellend: 'bg-amber-100 text-amber-700 border-amber-200',
};

const ALLE_KATEGORIEN = ['alle', ...Object.keys(KATEGORIE_LABELS)];

export default function DashboardOverview() {
  const { artikelEinstellen, loading, error, fetchAll } = useDashboardData();

  const [search, setSearch] = useState('');
  const [selectedKategorie, setSelectedKategorie] = useState('alle');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<ArtikelEinstellen | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ArtikelEinstellen | null>(null);
  const [detailRecord, setDetailRecord] = useState<ArtikelEinstellen | null>(null);

  const filtered = useMemo(() => {
    return artikelEinstellen.filter((a) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        (a.fields.artikelname ?? '').toLowerCase().includes(q) ||
        (a.fields.marke ?? '').toLowerCase().includes(q) ||
        (a.fields.ort ?? '').toLowerCase().includes(q) ||
        (a.fields.beschreibung ?? '').toLowerCase().includes(q);
      const matchKat =
        selectedKategorie === 'alle' || a.fields.kategorie === selectedKategorie;
      return matchSearch && matchKat;
    });
  }, [artikelEinstellen, search, selectedKategorie]);

  const stats = useMemo(() => {
    const total = artikelEinstellen.length;
    const withPrice = artikelEinstellen.filter((a) => a.fields.preis != null);
    const avgPrice =
      withPrice.length > 0
        ? withPrice.reduce((s, a) => s + (a.fields.preis ?? 0), 0) / withPrice.length
        : 0;
    const neuArtikel = artikelEinstellen.filter(
      (a) => a.fields.zustand === 'neu_mit_etikett' || a.fields.zustand === 'neu_ohne_etikett'
    ).length;
    const kategorien = new Set(artikelEinstellen.map((a) => a.fields.kategorie).filter(Boolean)).size;
    return { total, avgPrice, neuArtikel, kategorien };
  }, [artikelEinstellen]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await LivingAppsService.deleteArtikelEinstellenEntry(deleteTarget.record_id);
    setDeleteTarget(null);
    if (detailRecord?.record_id === deleteTarget.record_id) setDetailRecord(null);
    fetchAll();
  };

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Marktplatz</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {artikelEinstellen.length} {artikelEinstellen.length === 1 ? 'Inserat' : 'Inserate'} eingestellt
          </p>
        </div>
        <Button
          onClick={() => { setEditRecord(null); setDialogOpen(true); }}
          className="gap-2 shrink-0"
        >
          <Plus size={16} />
          Artikel einstellen
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Inserate"
          value={String(stats.total)}
          description="Gesamt"
          icon={<ShoppingBag size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Ø Preis"
          value={formatCurrency(stats.avgPrice)}
          description="Durchschnitt"
          icon={<Tag size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Neu"
          value={String(stats.neuArtikel)}
          description="Neu mit/ohne Etikett"
          icon={<Star size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Kategorien"
          value={String(stats.kategorien)}
          description="Verschiedene"
          icon={<Package size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Artikel, Marke, Ort suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {ALLE_KATEGORIEN.map((k) => (
            <button
              key={k}
              onClick={() => setSelectedKategorie(k)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                selectedKategorie === k
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
              }`}
            >
              {k === 'alle' ? 'Alle' : KATEGORIE_LABELS[k]}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className={`${detailRecord ? 'grid lg:grid-cols-[1fr_360px] gap-6' : ''}`}>
        {/* Product Grid */}
        <div>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                <ShoppingBag size={28} className="text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Keine Artikel gefunden</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {search || selectedKategorie !== 'alle'
                    ? 'Passe die Suche oder Filter an'
                    : 'Stell deinen ersten Artikel ein!'}
                </p>
              </div>
              {!search && selectedKategorie === 'alle' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setEditRecord(null); setDialogOpen(true); }}
                  className="gap-1.5"
                >
                  <Plus size={14} />
                  Artikel einstellen
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((artikel) => (
                <ArticleCard
                  key={artikel.record_id}
                  artikel={artikel}
                  isSelected={detailRecord?.record_id === artikel.record_id}
                  onClick={() =>
                    setDetailRecord(
                      detailRecord?.record_id === artikel.record_id ? null : artikel
                    )
                  }
                  onEdit={(e) => {
                    e.stopPropagation();
                    setEditRecord(artikel);
                    setDialogOpen(true);
                  }}
                  onDelete={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(artikel);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {detailRecord && (
          <DetailPanel
            artikel={detailRecord}
            onEdit={() => { setEditRecord(detailRecord); setDialogOpen(true); }}
            onDelete={() => setDeleteTarget(detailRecord)}
            onClose={() => setDetailRecord(null)}
          />
        )}
      </div>

      {/* Dialogs */}
      <ArtikelEinstellenDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditRecord(null); }}
        onSubmit={async (fields) => {
          if (editRecord) {
            await LivingAppsService.updateArtikelEinstellenEntry(editRecord.record_id, fields);
          } else {
            await LivingAppsService.createArtikelEinstellenEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={editRecord?.fields}
        enablePhotoScan={AI_PHOTO_SCAN['ArtikelEinstellen']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Artikel löschen"
        description={`"${deleteTarget?.fields.artikelname ?? 'Dieser Artikel'}" wirklich löschen?`}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function ArticleCard({
  artikel,
  isSelected,
  onClick,
  onEdit,
  onDelete,
}: {
  artikel: ArtikelEinstellen;
  isSelected: boolean;
  onClick: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const foto = artikel.fields.foto_1 || artikel.fields.foto_2 || artikel.fields.foto_3 || artikel.fields.foto_4;
  const zustandKey = artikel.fields.zustand ?? '';
  const zustandLabel = ZUSTAND_LABELS[zustandKey] ?? '';
  const zustandColor = ZUSTAND_COLORS[zustandKey] ?? 'bg-muted text-muted-foreground border-border';

  return (
    <div
      onClick={onClick}
      className={`group relative bg-card border rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${
        isSelected ? 'ring-2 ring-primary border-primary shadow-md' : 'border-border'
      }`}
    >
      {/* Image */}
      <div className="aspect-[4/3] bg-muted relative overflow-hidden">
        {foto ? (
          <img
            src={foto}
            alt={artikel.fields.artikelname ?? 'Artikel'}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={36} className="text-muted-foreground/30" />
          </div>
        )}
        {zustandLabel && (
          <span
            className={`absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${zustandColor}`}
          >
            {zustandLabel}
          </span>
        )}
        {/* Action buttons on hover */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="w-7 h-7 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-sm hover:bg-white transition-colors"
          >
            <Pencil size={12} className="text-foreground" />
          </button>
          <button
            onClick={onDelete}
            className="w-7 h-7 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-sm hover:bg-red-50 transition-colors"
          >
            <Trash2 size={12} className="text-destructive" />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm text-foreground truncate">
              {artikel.fields.artikelname ?? 'Artikel'}
            </p>
            {artikel.fields.marke && (
              <p className="text-xs text-muted-foreground truncate">{artikel.fields.marke}</p>
            )}
          </div>
          {artikel.fields.preis != null && (
            <span className="font-bold text-sm text-primary shrink-0">
              {formatCurrency(artikel.fields.preis)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2">
          {artikel.fields.kategorie && (
            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {KATEGORIE_LABELS[artikel.fields.kategorie] ?? artikel.fields.kategorie}
            </span>
          )}
          {artikel.fields.groesse && (
            <span className="text-[10px] text-muted-foreground">Gr. {artikel.fields.groesse}</span>
          )}
        </div>
        {artikel.fields.ort && (
          <div className="flex items-center gap-1 mt-1.5">
            <MapPin size={10} className="text-muted-foreground shrink-0" />
            <span className="text-[10px] text-muted-foreground truncate">{artikel.fields.ort}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailPanel({
  artikel,
  onEdit,
  onDelete,
  onClose,
}: {
  artikel: ArtikelEinstellen;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const fotos = [artikel.fields.foto_1, artikel.fields.foto_2, artikel.fields.foto_3, artikel.fields.foto_4].filter(Boolean) as string[];
  const [activePhoto, setActivePhoto] = useState(0);
  const zustandKey = artikel.fields.zustand ?? '';
  const zustandLabel = ZUSTAND_LABELS[zustandKey] ?? '';
  const zustandColor = ZUSTAND_COLORS[zustandKey] ?? 'bg-muted text-muted-foreground border-border';

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col sticky top-6 max-h-[calc(100vh-120px)]">
      {/* Close button */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="font-semibold text-sm text-foreground truncate">{artikel.fields.artikelname ?? 'Details'}</span>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors text-xs px-2 py-1 rounded-md hover:bg-muted"
        >
          ✕
        </button>
      </div>

      <div className="overflow-y-auto flex-1">
        {/* Photos */}
        {fotos.length > 0 && (
          <div>
            <div className="aspect-square bg-muted overflow-hidden">
              <img
                src={fotos[activePhoto]}
                alt="Foto"
                className="w-full h-full object-cover"
              />
            </div>
            {fotos.length > 1 && (
              <div className="flex gap-2 p-3">
                {fotos.map((f, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePhoto(i)}
                    className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                      activePhoto === i ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img src={f} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Details */}
        <div className="p-4 space-y-4">
          {/* Price + condition */}
          <div className="flex items-center justify-between">
            {artikel.fields.preis != null ? (
              <span className="text-2xl font-bold text-primary">
                {formatCurrency(artikel.fields.preis)}
              </span>
            ) : (
              <span className="text-muted-foreground text-sm">Kein Preis angegeben</span>
            )}
            {zustandLabel && (
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${zustandColor}`}>
                {zustandLabel}
              </span>
            )}
          </div>

          {/* Category & Size */}
          <div className="flex flex-wrap gap-2">
            {artikel.fields.kategorie && (
              <Badge variant="secondary">
                {KATEGORIE_LABELS[artikel.fields.kategorie] ?? artikel.fields.kategorie}
              </Badge>
            )}
            {artikel.fields.groesse && (
              <Badge variant="outline">Gr. {artikel.fields.groesse}</Badge>
            )}
            {artikel.fields.farbe && (
              <Badge variant="outline">{artikel.fields.farbe}</Badge>
            )}
            {artikel.fields.marke && (
              <Badge variant="outline">{artikel.fields.marke}</Badge>
            )}
          </div>

          {/* Description */}
          {artikel.fields.beschreibung && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Beschreibung</p>
              <p className="text-sm text-foreground leading-relaxed">{artikel.fields.beschreibung}</p>
            </div>
          )}

          {/* Seller info */}
          {(artikel.fields.vorname || artikel.fields.nachname || artikel.fields.email || artikel.fields.telefon || artikel.fields.ort) && (
            <div className="border-t border-border pt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Verkäufer</p>
              <div className="space-y-2">
                {(artikel.fields.vorname || artikel.fields.nachname) && (
                  <p className="text-sm font-medium text-foreground">
                    {[artikel.fields.vorname, artikel.fields.nachname].filter(Boolean).join(' ')}
                  </p>
                )}
                {artikel.fields.ort && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin size={13} className="shrink-0" />
                    {artikel.fields.ort}
                  </div>
                )}
                {artikel.fields.email && (
                  <a
                    href={`mailto:${artikel.fields.email}`}
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Mail size={13} className="shrink-0" />
                    {artikel.fields.email}
                  </a>
                )}
                {artikel.fields.telefon && (
                  <a
                    href={`tel:${artikel.fields.telefon}`}
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Phone size={13} className="shrink-0" />
                    {artikel.fields.telefon}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-border flex gap-2">
        <Button onClick={onEdit} className="flex-1 gap-1.5" size="sm">
          <Pencil size={13} />
          Bearbeiten
        </Button>
        <Button onClick={onDelete} variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive hover:border-destructive/50">
          <Trash2 size={13} />
          Löschen
        </Button>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
      </div>
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <AlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">{error.message}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>Erneut versuchen</Button>
    </div>
  );
}
