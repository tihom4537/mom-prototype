import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, GeoJSON as LeafletGeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { GeoJsonObject, Feature, FeatureCollection, GeoJsonProperties } from 'geojson';
import type { Layer, PathOptions, LeafletMouseEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Vite + Leaflet icon fix
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)['_getIconUrl'];
L.Icon.Default.mergeOptions({ iconRetinaUrl: '', iconUrl: '', shadowUrl: '' });

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

export const DEFAULT_GP_DATA: Record<string, number> = {
  'Bagalkot':        196,
  'Bangalore Rural': 107,
  'Bangalore Urban':  85,
  'Belgaum':         497,
  'Bellary':         100,
  'Bidar':           181,
  'Bijapur':         211,
  'Chamrajnagar':    130,
  'Chikmagalur':     226,
  'Chitradurga':     189,
  'Dakshin Kannad':  223,
  'Davanagere':      194,
  'Dharwad':         146,
  'Gadag':           122,
  'Gulbarga':        261,
  'Hassan':          264,
  'Haveri':          223,
  'Kodagu':          102,
  'Kolar':           154,
  'Koppal':          152,
  'Mandya':          231,
  'Mysore':          255,
  'Raichur':         179,
  'Shimoga':         262,
  'Tumkur':          330,
  'Udupi':           155,
  'Uttar Kannand':   229,
};

// Maps GeoJSON NAME_2 (district choropleth) → KSRSAC districtId (taluk GeoJSON)
export const DISTRICT_ID_MAP: Record<string, number> = {
  'Bagalkot':        14,
  'Bangalore Rural': 18,
  'Bangalore Urban': 20,
  'Belgaum':         17,
  'Bellary':         15,
  'Bidar':           21,
  'Bijapur':         52,
  'Chamrajnagar':    22,
  'Chikmagalur':     24,
  'Chitradurga':     25,
  'Dakshin Kannad':  26,
  'Davanagere':      27,
  'Dharwad':         28,
  'Gadag':           29,
  'Gulbarga':        33,
  'Hassan':          30,
  'Haveri':          31,
  'Kodagu':          34,
  'Coorg':           34,
  'Kolar':           35,
  'Koppal':          36,
  'Mandya':          39,
  'Mysore':          40,
  'Raichur':         41,
  'Shimoga':         46,
  'Tumkur':          48,
  'Udupi':           50,
  'Uttar Kannand':   51,
};

// Maps app spelling → GeoJSON KGISTalukN (for 79 mismatches)
export const TALUK_NAME_MAP: Record<string, string> = {
  'Afzalpura':                  'Afzalpur',
  'Annigeri':                   'ANNIGERI',
  'Arakalagudu':                'Arkalgud',
  'Arasikere':                  'Arsikere',
  'Bangarpete':                 'BANGARPET',
  'Basavakalyana':              'Basavakalyan',
  'Basavana Bagewadi':          'Basavan Bagewadi',
  'Bengaluru East':             'Bangalore-East',
  'Bengaluru North':            'Bangalore (North)',
  'Byadgi':                     'Byadagi',
  'Byndoor':                    'Bynduru',
  'Channarayapattana':          'Channarayapatna',
  'Chikkaballapura':            'chikballapur',
  'Chikkamagaluru':             'Chikmagalur',
  'Chikkanayakanahalli':        'Chiknayakanahalli',
  'Chintamani':                 'Chinthamani',
  'Chitguppa':                  'Chittaguppa',
  'Chitradurga':                'chitradurga',
  'Devadurga':                  'Devdurga',
  'Gajendragada':               'Gajendragad',
  'Gauribidanur':               'gauribidanur',
  'Gudibanda':                  'gudibande',
  'Gundlupete':                 'Gundlupet',
  'Gurmatkal':                  'Gurumithakala',
  'Hanur':                      'Kollegala(Hanur)',
  'Harihara':                   'Harihar',
  'Hiriyur':                    'hiriyur',
  'Holalkere':                  'holalkere',
  'Holenarsipura':              'Holenarasipura',
  'Hoovina Hadagali':           'Hadagali',
  'Hosadurga':                  'hosadurga',
  'Hosakote':                   'Hoskote',
  'Hosanagara':                 'Hosanagar',
  'Hosapete':                   'Hospet',
  'Hubballi':                   'Hubballi Nagara',
  'Hunsagi':                    'Hunisigi',
  'Jamkhandi':                  'Jamakhandi',
  'Kalaburagi':                 'Gulbarga',
  'Kalghatgi':                  'Kalgatgi',
  'Kamalapur':                  'Kamalapura',
  'Kanakapura':                 'Kanakpura',
  'Kolar Gold Fields':          'K.G.F',
  'Koppal':                     'koppal',
  'Krishnarajapete':            'Krishnarajpet',
  'Krishnarajnagar':            'K.R.Nagar',
  'Kundapura':                  'Kundapur',
  'Kushalnagar':                'Madikeri',
  'Mangaluru':                  'Mangalore',
  'Moodabidri':                 'Mudabidri',
  'Mulbagal':                   'Mulabagilu',
  'Mundaragi':                  'Mundargi',
  'Naragunda':                  'Naragund',
  'Pandavapura':                'Pandavpura',
  'Ponnampet':                  'Virajpet',
  'Ramanagara':                 'Ramanagar',
  'Ramdurg':                    'Ramadurg',
  'Ranibennur':                 'Ranebennur',
  'Rattihalli':                 'Ratteehalli',
  'Ron':                        'Rona',
  'Sakleshpur':                 'Sakleshpura',
  'Saligrama':                  'Karkala',
  'Sanduru':                    'Sonduru',
  'Shahabad':                   'Shahbadha',
  'Shahpur':                    'Shahapur',
  'Shikaripura':                'shikaripura',
  'Shivamogga':                 'shimoga',
  'Sidlaghatta':                'Shidlagatta',
  'Sindgi':                     'Sindagi',
  'Siruguppa':                  'Siraguppa',
  'Somwarpet':                  'somawarpet',
  'Srinivasapura':              'Srinivaspura',
  'Tirumakudalu Narasipura':    'T.Narasipura',
  'Tumakuru':                   'Tumkur',
  'Ullal':                      'Bantwal',
  'Vijayapura':                 'Bijapur',
  'Wadagera':                   'Vadagera',
  'Yelahanka':                  'Bangalore (North)',
  'Yelandur':                   'Yalandur',
  'Yelburga':                   'yelburga',
};

function toGeoTalukName(appName: string): string {
  return TALUK_NAME_MAP[appName] ?? appName;
}

// Module-level constants — never new references, so LeafletGeoJSON never re-calls onEachFeature
const DISTRICT_STYLE_PLACEHOLDER: PathOptions = { fillColor: '#c99080', fillOpacity: 0.85, color: '#ffffff', weight: 1 };
const TALUK_STYLE_PLACEHOLDER: PathOptions    = { fillColor: '#c99080', fillOpacity: 0.85, color: '#ffffff', weight: 0.8 };

function getFillColor(value: number, maxValue: number, greyed = false): string {
  if (greyed) return '#e8e8e8';
  if (value === 0) return '#efe0dc';
  const intensity = value / maxValue;
  if (intensity > 0.8) return '#6a3e31';
  if (intensity > 0.6) return '#8a5446';
  if (intensity > 0.4) return '#aa6e5e';
  if (intensity > 0.2) return '#c99080';
  return '#dfc2b9';
}

interface FitBoundsProps {
  districtId: number | null;
  selectedGeoDistrict: string | null;
  talukGeoJson: GeoJsonObject | null;
  districtGeoJson: GeoJsonObject | null;
}

function fitBoundsToData(
  map: L.Map,
  districtId: number | null,
  selectedGeoDistrict: string | null,
  talukGeoJson: GeoJsonObject | null,
  districtGeoJson: GeoJsonObject | null,
) {
  map.invalidateSize();
  if (districtId !== null && talukGeoJson) {
    const fc = talukGeoJson as FeatureCollection;
    const filtered = fc.features.filter(f => (f.properties as { districtId: number } | null)?.districtId === districtId);
    if (!filtered.length) return;
    const bounds = L.geoJSON({ type: 'FeatureCollection', features: filtered } as GeoJsonObject).getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [24, 24], animate: true });
  } else if (selectedGeoDistrict && districtGeoJson) {
    const fc = districtGeoJson as FeatureCollection;
    const filtered = fc.features.filter(f => (f.properties as Record<string, unknown>)?.['NAME_2'] === selectedGeoDistrict);
    if (!filtered.length) return;
    const bounds = L.geoJSON({ type: 'FeatureCollection', features: filtered } as GeoJsonObject).getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [16, 16], animate: true });
  } else if (districtGeoJson) {
    const bounds = L.geoJSON(districtGeoJson).getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { animate: false, maxZoom: 18 });
  }
}

function MapController({ districtId, selectedGeoDistrict, talukGeoJson, districtGeoJson }: FitBoundsProps) {
  const map = useMap();

  useEffect(() => {
    if (!map || !districtGeoJson) return;

    const container = map.getContainer();

    const fit = () => {
      map.invalidateSize({ animate: false });
      fitBoundsToData(map, districtId, selectedGeoDistrict, talukGeoJson, districtGeoJson);
    };

    // Fire once when container reaches a stable non-zero size
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) fit();
    });
    ro.observe(container);

    // Also fire immediately
    fit();

    return () => ro.disconnect();
  }, [map, districtId, selectedGeoDistrict, talukGeoJson, districtGeoJson]);

  return null;
}

export interface KarnatakaLeafletMapProps {
  gpData?: Record<string, number>;
  talukData?: Record<string, number>;
  districtTooltipData?: Record<string, { total: number; completed: number }>;
  tooltipCompletedLabel?: string;
  tooltipTotalLabel?: string;
  onDistrictClick?: (geoName: string, gpCount: number) => void;
  onTalukClick?: (talukGeoName: string) => void;
  selectedGeoDistrict?: string | null;
  className?: string;
  width?: number | string;
  height?: number | string;
  valueLabel?: string;
  showTalukCount?: boolean;
  static?: boolean;
  noPanZoom?: boolean;
}

interface Tooltip {
  visible: boolean;
  label: string;
  sublabel?: string;
  value: number;
  valueLabel: string;
  total?: number;
  completed?: number;
}

export default function KarnatakaLeafletMap({
  gpData = DEFAULT_GP_DATA,
  talukData = {},
  districtTooltipData,
  tooltipCompletedLabel = 'Completed',
  tooltipTotalLabel = 'Total',
  onDistrictClick,
  onTalukClick,
  selectedGeoDistrict = null,
  className,
  width = '100%',
  height = 520,
  valueLabel = 'Grama Panchayats',
  showTalukCount = true,
  static: isStatic = false,
  noPanZoom = false,
}: KarnatakaLeafletMapProps) {
  const [districtGeoJson, setDistrictGeoJson] = useState<GeoJsonObject | null>(null);
  const [talukGeoJson, setTalukGeoJson] = useState<GeoJsonObject | null>(null);
  const [tooltip, setTooltip] = useState<Omit<Tooltip, 'x' | 'y'>>({ visible: false, label: '', value: 0, valueLabel: '' });
  const tooltipElRef = useRef<HTMLDivElement | null>(null);
  const [drillDistrictId, setDrillDistrictId] = useState<number | null>(null);

  // Refs so event handlers never go stale
  const gpDataRef                 = useRef(gpData);
  const talukDataRef              = useRef(talukData);
  const districtTooltipDataRef    = useRef(districtTooltipData);
  const onDistrictClickRef        = useRef(onDistrictClick);
  const onTalukClickRef       = useRef(onTalukClick);
  const valueLabelRef         = useRef(valueLabel);
  const showTalukCountRef     = useRef(showTalukCount);
  const isStaticRef           = useRef(isStatic);
  const drillDistrictIdRef    = useRef(drillDistrictId);
  // layer registries for imperative style updates
  const districtLayersRef = useRef<Map<string, { setStyle: (s: PathOptions) => void }>>(new Map());
  const talukLayersRef    = useRef<Map<string, { setStyle: (s: PathOptions) => void }>>(new Map());

  gpDataRef.current              = gpData;
  talukDataRef.current           = talukData;
  districtTooltipDataRef.current = districtTooltipData;
  onDistrictClickRef.current     = onDistrictClick;
  onTalukClickRef.current    = onTalukClick;
  valueLabelRef.current      = valueLabel;
  showTalukCountRef.current  = showTalukCount;
  isStaticRef.current        = isStatic;
  drillDistrictIdRef.current = drillDistrictId;
  // also keep selectedGeoDistrict in a ref for use inside stable handlers
  const selectedGeoDistrictRef = useRef(selectedGeoDistrict);
  selectedGeoDistrictRef.current = selectedGeoDistrict;

  useEffect(() => {
    fetch('/karnataka-districts.json').then(r => r.json()).then(setDistrictGeoJson);
    fetch('/karnataka-taluks.geojson').then(r => r.json()).then(setTalukGeoJson);
  }, []);

  // These functions read everything through refs — stable identity, no stale closure
  const getDistrictBaseStyleRef = useRef((name: string): PathOptions => {
    const gd = gpDataRef.current;
    const mg = Math.max(...Object.values(gd).filter(v => v >= 0), 1);
    const gpCount = gd[name] ?? 0;
    const greyed  = gd[name] === -1 || (selectedGeoDistrictRef.current !== null && name !== selectedGeoDistrictRef.current);
    return { fillColor: getFillColor(gpCount, mg, greyed), fillOpacity: 0.85, color: '#ffffff', weight: 1 };
  });
  const getDistrictBaseStyle = getDistrictBaseStyleRef.current;

  const getTalukBaseStyleRef = useRef((talukGeoName: string, appName: string): PathOptions => {
    const td = talukDataRef.current;
    const mt = Math.max(...Object.values(td).filter(v => v >= 0), 1);
    const val = td[appName] ?? td[talukGeoName] ?? 0;
    return { fillColor: getFillColor(val, mt > 0 ? mt : 1), fillOpacity: 0.85, color: '#ffffff', weight: 0.8 };
  });
  const getTalukBaseStyle = getTalukBaseStyleRef.current;

  // When selectedGeoDistrict or gpData changes, imperatively re-style all district layers
  useEffect(() => {
    districtLayersRef.current.forEach((layer, name) => {
      layer.setStyle(getDistrictBaseStyle(name));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGeoDistrict, gpData]);

  const onEachDistrict = useRef((feature: Feature<import('geojson').Geometry, GeoJsonProperties>, layer: Layer) => {
    const name   = (feature.properties?.['NAME_2'] as string) ?? '';
    const target = layer as Layer & { setStyle: (s: PathOptions) => void };
    districtLayersRef.current.set(name, target);
    target.setStyle(getDistrictBaseStyleRef.current(name));

    layer.on({
      mouseover: (e: LeafletMouseEvent) => {
        if (gpDataRef.current[name] === -1) return;
        target.setStyle({ fillColor: '#F3F3F3', fillOpacity: 0.85, color: '#6a3e31', weight: 2.5 });
        const gpCount    = gpDataRef.current[name] ?? 0;
        const talukCount = talukDataRef.current[name] ?? 0;
        if (tooltipElRef.current) {
          tooltipElRef.current.style.left = `${e.originalEvent.clientX + 14}px`;
          tooltipElRef.current.style.top  = `${e.originalEvent.clientY - 72}px`;
        }
        const ttd = districtTooltipDataRef.current?.[name];
        setTooltip({
          visible: true,
          label: name,
          sublabel: showTalukCountRef.current ? `Taluks: ${talukCount}` : undefined,
          value: gpCount, valueLabel: valueLabelRef.current,
          total: ttd?.total,
          completed: ttd?.completed,
        });
      },
      mousemove: (e: LeafletMouseEvent) => {
        if (tooltipElRef.current) {
          tooltipElRef.current.style.left = `${e.originalEvent.clientX + 14}px`;
          tooltipElRef.current.style.top  = `${e.originalEvent.clientY - 72}px`;
        }
      },
      mouseout: () => {
        target.setStyle(getDistrictBaseStyleRef.current(name));
        setTooltip(t => ({ ...t, visible: false }));
      },
      click: () => {
        if (isStaticRef.current) return;
        const gpCount = gpDataRef.current[name] ?? 0;
        const distId  = DISTRICT_ID_MAP[name] ?? null;
        setDrillDistrictId(distId);
        onDistrictClickRef.current?.(name, gpCount);
      },
    });
  }).current;

  const onEachTaluk = useRef((feature: Feature<import('geojson').Geometry, GeoJsonProperties>, layer: Layer) => {
    const talukGeoName = (feature.properties?.['taluk'] as string) ?? '';
    const appName      = Object.keys(TALUK_NAME_MAP).find(k => TALUK_NAME_MAP[k] === talukGeoName) ?? talukGeoName;
    const target       = layer as Layer & { setStyle: (s: PathOptions) => void };
    talukLayersRef.current.set(appName, target);
    target.setStyle(getTalukBaseStyleRef.current(talukGeoName, appName));

    layer.on({
      mouseover: (e: LeafletMouseEvent) => {
        target.setStyle({ fillColor: '#9e9e9e', fillOpacity: 0.85, color: '#ffffff', weight: 1.5 });
        const td  = talukDataRef.current;
        const val = td[appName] ?? td[talukGeoName] ?? 0;
        if (tooltipElRef.current) {
          tooltipElRef.current.style.left = `${e.originalEvent.clientX + 14}px`;
          tooltipElRef.current.style.top  = `${e.originalEvent.clientY - 72}px`;
        }
        setTooltip({
          visible: true,
          label: appName !== talukGeoName ? appName : talukGeoName,
          value: val, valueLabel: valueLabelRef.current,
        });
      },
      mousemove: (e: LeafletMouseEvent) => {
        if (tooltipElRef.current) {
          tooltipElRef.current.style.left = `${e.originalEvent.clientX + 14}px`;
          tooltipElRef.current.style.top  = `${e.originalEvent.clientY - 72}px`;
        }
      },
      mouseout: () => {
        target.setStyle(getTalukBaseStyleRef.current(talukGeoName, appName));
        setTooltip(t => ({ ...t, visible: false }));
      },
      click: () => onTalukClickRef.current?.(talukGeoName),
    });
  }).current;

  const filterTalukFeature = useRef((feature: Feature<import('geojson').Geometry, GeoJsonProperties>): boolean => {
    if (drillDistrictIdRef.current === null) return false;
    return feature.properties?.['districtId'] === drillDistrictIdRef.current;
  }).current;

  const showTalukLayer = drillDistrictId !== null && talukGeoJson !== null;

  return (
    <div className={`relative ${className ?? ''}`} style={{ width, height }}>
      <MapContainer
        center={[15.0, 76.5]}
        zoom={7}
        zoomSnap={0.1}
        zoomDelta={0.5}
        zoomControl={false}
        attributionControl={false}
        dragging={!isStatic && !noPanZoom}
        scrollWheelZoom={!isStatic && !noPanZoom}
        doubleClickZoom={!isStatic && !noPanZoom}
        touchZoom={!isStatic && !noPanZoom}
        boxZoom={!isStatic && !noPanZoom}
        keyboard={!isStatic && !noPanZoom}
        style={{ width: '100%', height: '100%', background: 'transparent', borderRadius: 12, cursor: isStatic ? 'default' : undefined }}
      >
        {districtGeoJson && (
          <LeafletGeoJSON
            key="karnataka-districts"
            data={districtGeoJson}
            style={DISTRICT_STYLE_PLACEHOLDER}
            onEachFeature={onEachDistrict}
          />
        )}
        {showTalukLayer && (
          <LeafletGeoJSON
            key={`taluk-${drillDistrictId}`}
            data={talukGeoJson!}
            style={TALUK_STYLE_PLACEHOLDER}
            onEachFeature={onEachTaluk}
            filter={filterTalukFeature}
          />
        )}
        <MapController
          districtId={drillDistrictId}
          selectedGeoDistrict={selectedGeoDistrict}
          talukGeoJson={talukGeoJson}
          districtGeoJson={districtGeoJson}
        />
      </MapContainer>

      {drillDistrictId !== null && (
        <button
          type="button"
          onClick={() => setDrillDistrictId(null)}
          className="absolute top-[12px] left-[12px] z-[1000] flex items-center gap-[6px] px-[12px] py-[7px] bg-white border border-[rgba(106,62,49,0.24)] rounded-[8px] text-[13px] font-medium text-[#6a3e31] shadow-sm hover:bg-[#f7f0ee] transition-colors"
          style={NS}
        >
          <span className="material-icons text-[16px]">arrow_back</span>
          All Districts
        </button>
      )}

      {createPortal(
        <div
          ref={tooltipElRef}
          className="pointer-events-none bg-[#2d1f1a] text-white rounded-[10px] px-[16px] py-[12px] shadow-lg flex flex-col gap-[6px]"
          style={{ position: 'fixed', left: 0, top: 0, zIndex: 9999, visibility: tooltip.visible ? 'visible' : 'hidden' }}
        >
          <div className="flex flex-col gap-[1px]">
            <span className="font-normal text-[10px] text-[rgba(255,255,255,0.5)] leading-normal tracking-[0.4px] uppercase" style={NS}>
              {drillDistrictId !== null ? 'Taluk' : 'Zilla'}
            </span>
            <span className="font-semibold text-[14px] leading-normal" style={NS}>{tooltip.label}</span>
          </div>
          <div className="w-full h-[1px] bg-[rgba(255,255,255,0.12)]" />
          <div className="flex flex-col gap-[3px]">
            {tooltip.sublabel && (
              <span className="font-normal text-[12px] text-[rgba(255,255,255,0.8)] leading-normal" style={NS}>
                {tooltip.sublabel}
              </span>
            )}
            {tooltip.total !== undefined && tooltip.completed !== undefined ? (
              <>
                <span className="font-normal text-[12px] text-[rgba(255,255,255,0.8)] leading-normal" style={NS}>
                  {tooltipCompletedLabel}: <span className="font-semibold text-white">{tooltip.completed.toLocaleString('en-IN')}</span>
                  <span className="text-[rgba(255,255,255,0.5)]"> / {tooltip.total.toLocaleString('en-IN')} {tooltipTotalLabel}</span>
                </span>
                <span className="font-normal text-[12px] text-[rgba(255,255,255,0.8)] leading-normal" style={NS}>
                  Completion: <span className="font-semibold text-white">
                    {tooltip.total > 0 ? ((tooltip.completed / tooltip.total) * 100).toFixed(1) : '0'}%
                  </span>
                </span>
              </>
            ) : (
              <span className="font-normal text-[12px] text-[rgba(255,255,255,0.8)] leading-normal" style={NS}>
                {tooltip.valueLabel}: <span className="font-semibold text-white">{tooltip.value.toLocaleString('en-IN')}</span>
              </span>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export { toGeoTalukName };
