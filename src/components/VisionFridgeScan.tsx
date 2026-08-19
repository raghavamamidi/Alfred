import React, { useState, useRef } from 'react';
import { Scan, Camera, Upload, CheckCircle2, AlertCircle, RefreshCw, Sparkles, Refrigerator, ArrowRight, Plus } from 'lucide-react';
import { InventoryItem, StorageLocation, ItemCategory } from '../types';

interface VisionFridgeScanProps {
  onAddItemsToInventory: (newItems: Partial<InventoryItem>[]) => void;
  onClose?: () => void;
}

interface DetectedItem {
  name: string;
  category: ItemCategory;
  quantity: string;
  unit: string;
  storageLocation: StorageLocation;
  freshness: 'fresh' | 'consume_soon' | 'depleting';
  estimatedDaysLeft: number;
  confidence: 'high' | 'medium' | 'low';
  notes?: string;
  isSelected?: boolean;
}

export const VisionFridgeScan: React.FC<VisionFridgeScanProps> = ({
  onAddItemsToInventory,
  onClose,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisSummary, setAnalysisSummary] = useState<string | null>(null);
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
  const [scanLocation, setScanLocation] = useState<StorageLocation>('fridge');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // High-fidelity sample images for quick exploration
  const samplePresets = [
    {
      title: 'Fridge Crisper & Dairy',
      location: 'fridge' as StorageLocation,
      desc: 'Tomatoes, Fresh Palak, Mother Dairy Paneer, Amul Dahi, Green Chillies & Coriander',
      // SVG base64 representation of a well organized Indian fridge crisper
      dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="%23e8f4f8"/><rect x="40" y="40" width="720" height="520" rx="16" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="6"/><rect x="60" y="60" width="680" height="150" rx="8" fill="%23f1f5f9"/><text x="80" y="100" font-family="sans-serif" font-weight="bold" font-size="20" fill="%23334155">TOP SHELF: DAIRY &amp; CONDIMENTS</text><circle cx="150" cy="150" r="35" fill="%2338bdf8"/><text x="125" y="155" font-family="sans-serif" font-size="12" fill="%23ffffff">Milk 1L</text><rect x="230" y="120" width="90" height="60" rx="6" fill="%23fbbf24"/><text x="245" y="155" font-family="sans-serif" font-size="12" fill="%2378350f">Paneer 200g</text><rect x="360" y="115" width="80" height="70" rx="6" fill="%23f87171"/><text x="375" y="155" font-family="sans-serif" font-size="11" fill="%23ffffff">Kissan 500g</text><circle cx="500" cy="150" r="35" fill="%23fef08a"/><text x="475" y="155" font-family="sans-serif" font-size="12" fill="%23854d0e">Dahi 400g</text><rect x="60" y="240" width="680" height="280" rx="8" fill="%23f0fdf4"/><text x="80" y="280" font-family="sans-serif" font-weight="bold" font-size="20" fill="%23166534">CRISPER: FRESH VEGETABLES</text><circle cx="160" cy="380" r="45" fill="%23ef4444"/><text x="130" y="385" font-family="sans-serif" font-size="13" fill="%23ffffff">Tomatoes 4pcs</text><ellipse cx="320" cy="380" rx="65" ry="45" fill="%2322c55e"/><text x="270" y="385" font-family="sans-serif" font-size="13" fill="%23ffffff">Palak 1 Bunch</text><ellipse cx="480" cy="380" rx="55" ry="40" fill="%237e22ce"/><text x="435" y="385" font-family="sans-serif" font-size="13" fill="%23ffffff">Baingan 2pcs</text><circle cx="620" cy="380" r="35" fill="%23a3e635"/><text x="590" y="385" font-family="sans-serif" font-size="12" fill="%23365314">Chillies/Dhaniya</text></svg>',
    },
    {
      title: 'Pantry Dry Staples',
      location: 'pantry' as StorageLocation,
      desc: 'Aashirvaad Atta 5kg, India Gate Basmati, Toor Dal, Moong Dal, Brooke Bond Tea',
      dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="%23fdfaf6"/><rect x="40" y="40" width="720" height="520" rx="16" fill="%23fef3c7" stroke="%23d97706" stroke-width="4"/><text x="80" y="100" font-family="sans-serif" font-weight="bold" font-size="22" fill="%2392400e">HOUSEHOLD PANTRY PROVISIONS</text><rect x="80" y="150" width="130" height="180" rx="8" fill="%23e0e7ff"/><text x="95" y="240" font-family="sans-serif" font-size="14" fill="%233730a3">Atta 5kg</text><rect x="240" y="150" width="120" height="180" rx="8" fill="%23dcfce7"/><text x="250" y="240" font-family="sans-serif" font-size="13" fill="%23166534">Basmati 5kg</text><rect x="390" y="180" width="100" height="150" rx="8" fill="%23fef08a"/><text x="405" y="260" font-family="sans-serif" font-size="13" fill="%23854d0e">Toor Dal 1kg</text><rect x="520" y="200" width="90" height="130" rx="8" fill="%23fee2e2"/><text x="530" y="270" font-family="sans-serif" font-size="12" fill="%23991b1b">Red Label Tea</text></svg>',
    },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setDetectedItems([]);
      setAnalysisSummary(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRunAnalysis = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setAnalysisSummary(null);

    try {
      const response = await fetch('/api/gemini/scan-fridge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          mimeType: imageMimeType,
          locationType: scanLocation,
        }),
      });

      const data = await response.json();
      setAnalysisSummary(data.summary || 'Provisions successfully catalogued by Alfred.');
      const itemsWithSelection = (data.items || []).map((it: any) => ({
        ...it,
        isSelected: true,
      }));
      setDetectedItems(itemsWithSelection);
    } catch (err: any) {
      console.error('Scan error:', err);
      setAnalysisSummary('I encountered a momentary impediment reading the photograph. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleToggleItemSelection = (index: number) => {
    setDetectedItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, isSelected: !item.isSelected } : item))
    );
  };

  const handleCommitToInventory = () => {
    const selected = detectedItems.filter((i) => i.isSelected);
    if (selected.length === 0) return;

    const formatted: Partial<InventoryItem>[] = selected.map((item) => {
      // Parse numeric quantity
      const match = item.quantity.match(/([\d.]+)/);
      const parsedQty = match ? parseFloat(match[1]) : 1;

      return {
        name: item.name,
        category: item.category || 'Produce & Veggies',
        quantity: parsedQty,
        unit: item.unit || 'pcs',
        storageLocation: item.storageLocation || scanLocation,
        status: item.freshness === 'depleting' ? 'depleting' : 'fresh',
        estimatedDaysLeft: item.estimatedDaysLeft || 3,
        notes: item.notes,
        lastUpdated: 'Just scanned',
      };
    });

    onAddItemsToInventory(formatted);
    setDetectedItems([]);
    setSelectedImage(null);
    if (onClose) onClose();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-[#f5f9fc] border border-brand-950/10 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-900 text-brand-50 flex items-center justify-center font-serif text-lg font-bold shadow-xs">
            <Scan className="w-5 h-5 text-brand-200" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-semibold text-stone-900">
              Alfred’s Visual Kitchen Audit
            </h2>
            <p className="text-xs sm:text-sm text-stone-600">
              Photograph your refrigerator shelves, produce rack, or spice drawer. Alfred will identify provisions and update mental inventory.
            </p>
          </div>
        </div>
      </div>

      {/* Preset Quick Tests */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
          <Sparkles className="w-3.5 h-3.5 text-brand-700" />
          <span>Quick Exploration Presets (Try Instant Scan):</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {samplePresets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setSelectedImage(preset.dataUrl);
                setImageMimeType('image/svg+xml');
                setScanLocation(preset.location);
                setDetectedItems([]);
                setAnalysisSummary(null);
              }}
              className="text-left p-3.5 rounded-xl border border-stone-200 hover:border-brand-400 hover:bg-brand-50/40 transition-all flex items-start gap-3 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-stone-100 group-hover:bg-brand-100 flex items-center justify-center shrink-0 mt-0.5">
                <Refrigerator className="w-4 h-4 text-stone-700 group-hover:text-brand-900" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-stone-900">{preset.title}</h4>
                <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-2">{preset.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Upload & Camera Area */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <h3 className="text-sm font-semibold text-stone-900">Upload or Capture Kitchen Photograph</h3>
            <p className="text-xs text-stone-500">Supports JPG, PNG, WEBP, or live camera upload</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500">Storage Context:</span>
            <select
              value={scanLocation}
              onChange={(e) => setScanLocation(e.target.value as StorageLocation)}
              className="text-xs px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-800"
            >
              <option value="fridge">Fridge & Chiller</option>
              <option value="produce_basket">Produce Basket</option>
              <option value="pantry">Pantry & Dry Shelf</option>
              <option value="spice_rack">Spice Drawer</option>
            </select>
          </div>
        </div>

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
        />

        {!selectedImage ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-stone-300 hover:border-brand-600 rounded-xl p-8 sm:p-12 text-center bg-stone-50/50 hover:bg-brand-50/20 transition-all cursor-pointer space-y-3"
          >
            <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-900 flex items-center justify-center mx-auto shadow-xs">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-800">Click to upload or drag & drop photo</p>
              <p className="text-xs text-stone-500 mt-1">Take a clear photo showing labels, crisper vegetables, or dairy packs</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden border border-stone-200 bg-stone-900 max-h-[360px] flex items-center justify-center">
              <img
                src={selectedImage}
                alt="Kitchen photo for AI scan"
                className="max-h-[360px] w-auto object-contain"
              />
              <button
                type="button"
                onClick={() => {
                  setSelectedImage(null);
                  setDetectedItems([]);
                  setAnalysisSummary(null);
                }}
                className="absolute top-3 right-3 bg-stone-900/80 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-stone-900 transition-colors"
              >
                Change Photo
              </button>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-stone-600 hover:text-stone-900 font-medium"
              >
                Select Different Image
              </button>

              <button
                id="run-vision-scan-btn"
                type="button"
                disabled={isAnalyzing}
                onClick={handleRunAnalysis}
                className="px-5 py-2.5 bg-brand-900 hover:bg-brand-950 disabled:opacity-50 text-brand-50 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2 transition-all shadow-xs cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-brand-300" />
                    <span>Alfred is scrutinizing photo...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-brand-300" />
                    <span>Audit Provisions with Alfred</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Analysis Results View */}
      {analysisSummary && (
        <div className="bg-brand-50/70 border border-brand-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-900 text-brand-50 flex items-center justify-center font-serif text-xs font-bold shrink-0 mt-0.5">
            A
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-serif font-semibold uppercase tracking-wider text-brand-900">
              Alfred’s Observation
            </h4>
            <p className="text-xs sm:text-sm text-stone-800 leading-relaxed font-sans">
              {analysisSummary}
            </p>
          </div>
        </div>
      )}

      {detectedItems.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <h3 className="text-sm font-semibold text-stone-900">
                Detected Provisions ({detectedItems.filter((i) => i.isSelected).length} of {detectedItems.length} selected)
              </h3>
              <p className="text-xs text-stone-500">Uncheck any item you do not wish to incorporate into the inventory ledger.</p>
            </div>

            <button
              id="confirm-inventory-add-btn"
              type="button"
              onClick={handleCommitToInventory}
              className="px-4 py-2 bg-brand-800 hover:bg-brand-700 text-white rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Incorporate into Inventory</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {detectedItems.map((item, idx) => (
              <div
                key={idx}
                onClick={() => handleToggleItemSelection(idx)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  item.isSelected
                    ? 'border-brand-800/40 bg-brand-50/30'
                    : 'border-stone-200 opacity-60 bg-stone-50'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-stone-900">{item.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-600">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-500">
                    Category: {item.category} • Location: {item.storageLocation}
                  </div>
                  {item.notes && (
                    <div className="text-[11px] text-stone-600 italic">
                      "{item.notes}"
                    </div>
                  )}
                </div>

                <input
                  type="checkbox"
                  checked={item.isSelected}
                  onChange={() => {}}
                  className="rounded-md border-stone-300 text-brand-900 focus:ring-brand-800 w-4 h-4 mt-0.5 cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
