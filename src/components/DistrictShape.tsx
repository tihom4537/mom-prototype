import { useState, useEffect, useRef } from 'react';
import { MapContainer, GeoJSON as LeafletGeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { GeoJsonObject, FeatureCollection, Feature, GeoJsonProperties } from 'geojson';
import type { Layer, PathOptions, LeafletMouseEvent } from 'leaflet';
import { DISTRICT_ID_MAP, TALUK_NAME_MAP } from './KarnatakaLeafletMap';
import 'leaflet/dist/leaflet.css';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

const STYLE_DEFAULT: PathOptions = { fillColor: '#c99080', fillOpacity: 0.75, color: '#ffffff', weight: 1.5 };
const STYLE_HOVER:   PathOptions = { fillColor: '#9e9e9e', fillOpacity: 0.85, color: '#ffffff', weight: 1.5 };
const STYLE_SELECTED: PathOptions = { fillColor: '#6a3e31', fillOpacity: 0.9,  color: '#ffffff', weight: 1.5 };

function FitToDistrict({ geoJson, districtName }: { geoJson: GeoJsonObject | null; districtName: string }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !geoJson) return;
    const fc = geoJson as FeatureCollection;
    const filtered = fc.features.filter(f => (f.properties as Record<string, unknown>)?.['NAME_2'] === districtName);
    if (!filtered.length) return;
    const bounds = L.geoJSON({ type: 'FeatureCollection', features: filtered } as GeoJsonObject).getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [8, 8], animate: false });
  }, [map, geoJson, districtName]);
  return null;
}

export interface DistrictShapeProps {
  districtGeoName: string;
  talukGpData?: Record<string, number>;
  selectedTaluk?: string;
  onTalukClick?: (talukAppName: string) => void;
  width?: number;
  height?: number;
  className?: string;
}

interface Tooltip { visible: boolean; taluk: string; gps?: number }

export default function DistrictShape({
  districtGeoName, talukGpData, selectedTaluk, onTalukClick,
  width = 340, height = 400, className,
}: DistrictShapeProps) {
  const [districtGeoJson, setDistrictGeoJson] = useState<GeoJsonObject | null>(null);
  const [talukGeoJson, setTalukGeoJson]       = useState<GeoJsonObject | null>(null);
  const [tooltip, setTooltip] = useState<Tooltip>({ visible: false, taluk: '' });
  const tooltipElRef = useRef<HTMLDivElement | null>(null);

  const selectedTalukRef  = useRef(selectedTaluk);
  const onTalukClickRef   = useRef(onTalukClick);
  const talukGpDataRef    = useRef(talukGpData);
  // map from appName → leaflet layer so we can imperatively update selected style
  const layerMapRef = useRef<Map<string, Layer & { setStyle: (s: PathOptions) => void }>>(new Map());

  selectedTalukRef.current = selectedTaluk;
  onTalukClickRef.current  = onTalukClick;
  talukGpDataRef.current   = talukGpData;

  useEffect(() => {
    fetch('/karnataka-districts.json').then(r => r.json()).then(setDistrictGeoJson);
    fetch('/karnataka-taluks.geojson').then(r => r.json()).then(setTalukGeoJson);
  }, []);

  // When selectedTaluk changes, imperatively update all layer styles
  useEffect(() => {
    layerMapRef.current.forEach((layer, appName) => {
      layer.setStyle(appName === selectedTaluk ? STYLE_SELECTED : STYLE_DEFAULT);
    });
  }, [selectedTaluk]);

  const districtId = DISTRICT_ID_MAP[districtGeoName] ?? null;
  const districtIdRef = useRef(districtId);
  districtIdRef.current = districtId;

  // Stable — created once, reads state through refs
  const onEachTaluk = useRef((feature: Feature<import('geojson').Geometry, GeoJsonProperties>, layer: Layer) => {
    const geoTaluk = (feature.properties as Record<string, unknown>)?.['taluk'] as string ?? '';
    const appName  = Object.keys(TALUK_NAME_MAP).find(k => TALUK_NAME_MAP[k] === geoTaluk) ?? geoTaluk;
    const target   = layer as Layer & { setStyle: (s: PathOptions) => void };

    layerMapRef.current.set(appName, target);
    target.setStyle(appName === selectedTalukRef.current ? STYLE_SELECTED : STYLE_DEFAULT);

    layer.on({
      mouseover: (e: LeafletMouseEvent) => {
        if (appName !== selectedTalukRef.current) target.setStyle(STYLE_HOVER);
        const gps = talukGpDataRef.current?.[appName] ?? talukGpDataRef.current?.[geoTaluk];
        if (tooltipElRef.current) {
          tooltipElRef.current.style.left = `${e.originalEvent.clientX + 14}px`;
          tooltipElRef.current.style.top  = `${e.originalEvent.clientY - 60}px`;
        }
        setTooltip({ visible: true, taluk: appName, gps });
      },
      mousemove: (e: LeafletMouseEvent) => {
        if (tooltipElRef.current) {
          tooltipElRef.current.style.left = `${e.originalEvent.clientX + 14}px`;
          tooltipElRef.current.style.top  = `${e.originalEvent.clientY - 60}px`;
        }
      },
      mouseout: () => {
        target.setStyle(appName === selectedTalukRef.current ? STYLE_SELECTED : STYLE_DEFAULT);
        setTooltip(t => ({ ...t, visible: false }));
      },
      click: () => onTalukClickRef.current?.(appName),
    });
  }).current;

  const talukFilter = useRef((feature: Feature<import('geojson').Geometry, GeoJsonProperties>) =>
    (feature.properties as Record<string, unknown>)?.['districtId'] === districtIdRef.current
  ).current;

  return (
    <div style={{ width, height, position: 'relative' }} className={className ?? ''}>
      <MapContainer
        center={[15, 76.5]} zoom={8}
        zoomControl={false} attributionControl={false}
        dragging={false} scrollWheelZoom={false} doubleClickZoom={false}
        touchZoom={false} boxZoom={false} keyboard={false}
        style={{ width: '100%', height: '100%', background: 'transparent' }}
      >
        {talukGeoJson && districtId !== null && (
          <LeafletGeoJSON
            key={`taluk-${districtGeoName}`}
            data={talukGeoJson}
            style={STYLE_DEFAULT}
            filter={talukFilter}
            onEachFeature={onEachTaluk}
          />
        )}
        <FitToDistrict geoJson={districtGeoJson} districtName={districtGeoName} />
      </MapContainer>

      <div
        ref={tooltipElRef}
        className="pointer-events-none bg-[#2d1f1a] text-white rounded-[10px] px-[14px] py-[10px] shadow-lg flex flex-col gap-[4px]"
        style={{ position: 'fixed', left: 0, top: 0, zIndex: 9999, visibility: tooltip.visible ? 'visible' : 'hidden' }}
      >
        <span className="font-normal text-[10px] text-[rgba(255,255,255,0.5)] tracking-[0.4px] uppercase" style={NS}>Taluk</span>
        <span className="font-semibold text-[13px]" style={NS}>{tooltip.taluk}</span>
        {tooltip.gps !== undefined && (
          <>
            <div className="w-full h-[1px] bg-[rgba(255,255,255,0.12)]" />
            <span className="text-[12px] text-[rgba(255,255,255,0.8)]" style={NS}>
              Grama Panchayats: <span className="font-semibold text-white">{tooltip.gps.toLocaleString('en-IN')}</span>
            </span>
          </>
        )}
      </div>
    </div>
  );
}
