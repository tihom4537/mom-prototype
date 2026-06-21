import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import AccessibilityBar from '../components/AccessibilityBar';
import AccessibilityFab from '../components/AccessibilityFab';
import Navbar from '../components/Navbar';
import ScaleToFit from '../components/ScaleToFit';
import GoBackToPreviousPage from '../components/GoBackToPreviousPage';
import Breadcrumb from '../components/Breadcrumb';
import SectionTopper from '../components/SectionTopper';
import RadioButton from '../components/RadioButton';
import DropdownField from '../components/DropdownField';
import Button from '../components/Button';
import AppDownloadCTA from '../components/AppDownloadCTA';
import Footer from '../components/Footer';
import { DISTRICTS, KARNATAKA_HIERARCHY } from '../data/karnatakaData';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

type LevelFilter = 'GP' | 'ZP';

export default function PanchamitraScreen() {
  const navigate = useNavigate();
  useLanguage();

  const [level, setLevel] = useState<LevelFilter>('GP');
  const [selectedZilla, setSelectedZilla] = useState('');
  const [selectedTaluk, setSelectedTaluk] = useState('');
  const [selectedGP, setSelectedGP] = useState('');

  const zillaOptions = DISTRICTS;

  const talukOptions = useMemo(() =>
    selectedZilla && KARNATAKA_HIERARCHY[selectedZilla]
      ? Object.keys(KARNATAKA_HIERARCHY[selectedZilla])
      : [],
  [selectedZilla]);

  const gpOptions = useMemo(() =>
    selectedZilla && selectedTaluk && KARNATAKA_HIERARCHY[selectedZilla]?.[selectedTaluk]
      ? KARNATAKA_HIERARCHY[selectedZilla][selectedTaluk]
      : [],
  [selectedZilla, selectedTaluk]);

  return (
    <ScaleToFit>
    <div className="flex flex-col min-h-screen w-full bg-white">
      <AccessibilityBar />
      <Navbar version="home-page-identity" />
      <Navbar version="home-page-nav-menu" />

      {/* Back + breadcrumb */}
      <div className="px-[200px] pt-[32px] flex items-center justify-between">
        <GoBackToPreviousPage label="Back to Home" onClick={() => navigate('/homepage')} />
        <Breadcrumb level={3} items={['Home', 'Modules', 'Panchamitra']} />
      </div>

      {/* SectionTopper */}
      <div className="px-[200px] pt-[20px]">
        <SectionTopper
          variant="variant3"
          heading="Panchamitra"
          subheading="Panchamitra is the public information portal for Karnataka's Zilla, Taluk, and Gram Panchayats. It allows citizens to access comprehensive details regarding elected representatives, staff members, meeting details (both completed and upcoming), revenue collection, and budget allocations etc."
          illustration="/Illustrations/panchamitra.svg"
          className="rounded-[10px]"
        />
      </div>

      {/* ── Search panel ── */}
      <div id="main-content" tabIndex={-1} className="px-[200px] pt-[48px] pb-[80px] flex flex-col items-center gap-[32px]">

        {/* Level radio */}
        <div className="flex items-center gap-[32px]">
          <span className="text-[14px] font-medium text-[#525c66]" style={NS}>Select level:</span>
          <RadioButton
            label="Grama Panchayat"
            selected={level === 'GP'}
            onChange={() => { setLevel('GP'); setSelectedZilla(''); setSelectedTaluk(''); setSelectedGP(''); }}
          />
          <RadioButton
            label="Zilla Panchayat"
            selected={level === 'ZP'}
            onChange={() => { setLevel('ZP'); setSelectedZilla(''); setSelectedTaluk(''); setSelectedGP(''); }}
          />
        </div>

        {/* Dropdowns */}
        <div className="flex gap-[16px] items-end w-full">
          <DropdownField
            label="Zilla"
            placeholder="Select Zilla"
            value={selectedZilla}
            onChange={v => { setSelectedZilla(v); setSelectedTaluk(''); setSelectedGP(''); }}
            options={zillaOptions}
            className="flex-1"
          />
          {level === 'GP' && (
            <>
              <DropdownField
                label="Taluk"
                placeholder="Select Taluk"
                value={selectedTaluk}
                onChange={v => { setSelectedTaluk(v); setSelectedGP(''); }}
                options={talukOptions}
                className="flex-1"
              />
              <DropdownField
                label="Grama Panchayat"
                placeholder="Select GP"
                value={selectedGP}
                onChange={setSelectedGP}
                options={gpOptions}
                className="flex-1"
              />
            </>
          )}
        </div>

        {/* Search */}
        <Button variant="filled" iconPlacement="left" iconName="search" text="Search" />
      </div>

      <AppDownloadCTA variant="cta-option-2" />
      <Footer variant="dark" />      <AccessibilityFab />
    </div>
    </ScaleToFit>
  );
}
