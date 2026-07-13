import React from 'react';

const NS_FONT = 'Noto Sans, sans-serif';

export const MOCK_ATTENDANCE = [
  { id: 1,  name: 'Suresh Patil',      designation: 'President',            status: 'present' },
  { id: 2,  name: 'Anitha Rao',        designation: 'Vice President',       status: 'present' },
  { id: 3,  name: 'Ramesh Kumar',      designation: 'PDO',                  status: 'present' },
  { id: 4,  name: 'Savitha Gowda',     designation: 'Secretary',            status: 'present' },
  { id: 5,  name: 'Manjunath B.',      designation: 'Ward Member — Ward 1', status: 'present' },
  { id: 6,  name: 'Lakshmi Devi',      designation: 'Ward Member — Ward 2', status: 'present' },
  { id: 7,  name: 'Prakash Hegde',     designation: 'Ward Member — Ward 3', status: 'absent'  },
  { id: 8,  name: 'Kaveri S.',         designation: 'Ward Member — Ward 4', status: 'present' },
  { id: 9,  name: 'Nagesh M.',         designation: 'Ward Member — Ward 5', status: 'present' },
  { id: 10, name: 'Bhavana Naik',      designation: 'Ward Member — Ward 6', status: 'present' },
  { id: 11, name: 'Raju Chandra',      designation: 'Ward Member — Ward 7', status: 'present' },
  { id: 12, name: 'Geetha Kumari',     designation: 'Ward Member — Ward 8', status: 'absent'  },
  { id: 13, name: 'Manoj K.',          designation: 'PDO (Assisting)',      status: 'present' },
  { id: 14, name: 'Divya Rao',         designation: 'Elected Member',       status: 'present' },
];

export interface ProceedingsPreviewProps {
  t: (key: string) => string;
  meeting: { name: string; meetingType?: string; date: string; time: string; venue: string; chairperson?: string; description?: string; } | undefined;
  agendaItems: { id: number; heading: string; description: string; completed: boolean; proceedingsText?: string | Record<string, string>; }[];
  summary: string;
  nextMeetingDate: string;
  nextMeetingType: string;
  page: 1 | 2;
}

// A4 at 760px wide → height = 760 * (297/210) ≈ 1075px
const A4_HEIGHT = 1075;

export default function ProceedingsPreviewDocument({ t, meeting, agendaItems, summary, nextMeetingDate, nextMeetingType, page: activePage }: ProceedingsPreviewProps) {
  const page: React.CSSProperties = {
    background: 'white',
    width: '100%',
    height: `${A4_HEIGHT}px`,
    padding: '32px 40px',
    fontFamily: NS_FONT,
    fontSize: '12px',
    color: '#1a1a1a',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  const cellLabel: React.CSSProperties = {
    fontFamily: NS_FONT, background: '#f5f0ef', fontWeight: 600, color: '#5a3a2e',
    fontSize: '11px', padding: '7px 10px', border: '1px solid #c8c0bc',
    width: '22%', verticalAlign: 'top',
  };
  const cellVal: React.CSSProperties = {
    fontFamily: NS_FONT, fontSize: '11px', color: '#1a1a1a',
    padding: '7px 10px', border: '1px solid #c8c0bc', width: '28%', verticalAlign: 'top',
  };
  const thStyle: React.CSSProperties = {
    fontFamily: NS_FONT, background: '#f5f0ef', fontWeight: 600, color: '#5a3a2e',
    fontSize: '11px', padding: '7px 10px', border: '1px solid #c8c0bc', textAlign: 'left',
  };
  const tdStyle: React.CSSProperties = {
    fontFamily: NS_FONT, fontSize: '11px', color: '#1a1a1a',
    padding: '7px 10px', border: '1px solid #c8c0bc', verticalAlign: 'top',
  };
  const sectionHeading: React.CSSProperties = {
    fontWeight: 700, fontSize: '12px', textDecoration: 'underline',
    marginBottom: '8px', marginTop: '20px', fontFamily: NS_FONT,
  };

  const nextLabel = nextMeetingDate
    ? `${nextMeetingType ? nextMeetingType + ' — ' : ''}${nextMeetingDate}`
    : '3rd GP General Body Meeting — 19/06/2026';

  const govtHeader = (
    <div style={{ textAlign: 'center', paddingBottom: '16px', borderBottom: '2px solid #b5a9a5', marginBottom: '4px' }}>
      <img
        src="/karnataka-emblem.png"
        alt="Karnataka Govt Emblem"
        style={{ width: '52px', height: '52px', objectFit: 'contain', display: 'block', margin: '0 auto 6px' }}
      />
      <p style={{ fontWeight: 700, fontSize: '13px', color: '#1a237e', margin: '0 0 2px', fontFamily: NS_FONT }}>
        {t('proceedings_preview_govt_name')}
      </p>
      <p style={{ fontSize: '11px', color: '#3b3b3b', margin: '0 0 8px', fontFamily: NS_FONT }}>
        {t('proceedings_preview_dept_name')}
      </p>
      <p style={{ fontWeight: 700, fontSize: '17px', textDecoration: 'underline', margin: '0 0 2px', fontFamily: NS_FONT }}>
        {t('proceedings_preview_title')}
      </p>
      <p style={{ fontSize: '11px', color: '#5a5a5a', fontStyle: 'italic', margin: 0, fontFamily: NS_FONT }}>
        {t('proceedings_preview_subtitle')}
      </p>
    </div>
  );

  if (activePage === 1) {
    return (
      <div style={page}>
        {govtHeader}

        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
          <tbody>
            <tr>
              <td style={cellLabel}>{t('proceedings_preview_col_district')}</td>
              <td style={cellVal}>{t('proceedings_preview_district_val')}</td>
              <td style={cellLabel}>{t('proceedings_preview_col_taluk')}</td>
              <td style={cellVal}>{t('proceedings_preview_taluk_val')}</td>
            </tr>
            <tr>
              <td style={cellLabel}>{t('proceedings_preview_col_gp')}</td>
              <td style={cellVal}>{t('proceedings_preview_gp_val')}</td>
              <td style={cellLabel}>{t('proceedings_preview_col_type')}</td>
              <td style={cellVal}>{meeting?.meetingType ?? '—'}</td>
            </tr>
            <tr>
              <td style={cellLabel}>{t('proceedings_preview_col_date')}</td>
              <td style={cellVal}>{meeting?.date ?? '—'}</td>
              <td style={cellLabel}>{t('proceedings_preview_col_time')}</td>
              <td style={cellVal}>{meeting?.time ?? '—'}</td>
            </tr>
            <tr>
              <td style={cellLabel}>{t('proceedings_preview_col_venue')}</td>
              <td style={cellVal}>{meeting?.venue ?? '—'}</td>
              <td style={cellLabel}>{t('proceedings_preview_col_chairperson')}</td>
              <td style={cellVal}>{meeting?.chairperson ?? '—'}</td>
            </tr>
            <tr>
              <td style={cellLabel}>{t('proceedings_preview_col_prev_meeting')}</td>
              <td style={cellVal}>{t('proceedings_preview_prev_meeting_val')}</td>
              <td style={cellLabel}>{t('proceedings_preview_col_quorum')}</td>
              <td style={cellVal}>{t('proceedings_preview_quorum_val')}</td>
            </tr>
            {meeting?.description && (
              <tr>
                <td style={cellLabel}>{t('proceedings_preview_col_description')}</td>
                <td style={{ ...cellVal, width: 'auto' }} colSpan={3}>{meeting.description}</td>
              </tr>
            )}
          </tbody>
        </table>

        <p style={sectionHeading}>{t('proceedings_preview_decisions_heading')}</p>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: '44px' }}>{t('proceedings_preview_col_sl')}</th>
              <th style={{ ...thStyle, width: '35%' }}>{t('proceedings_preview_col_agenda')}</th>
              <th style={thStyle}>{t('proceedings_preview_col_decisions')}</th>
            </tr>
          </thead>
          <tbody>
            {agendaItems.map((item, idx) => (
              <tr key={item.id}>
                <td style={{ ...tdStyle, textAlign: 'center' }}>{idx + 1}</td>
                <td style={tdStyle}>
                  <span style={{ fontWeight: 600 }}>{item.heading}</span>
                  {item.description && (
                    <span style={{ display: 'block', fontSize: '10px', color: '#5a5a5a', marginTop: '2px' }}>
                      {item.description}
                    </span>
                  )}
                </td>
                <td style={tdStyle}>
                  {item.proceedingsText
                    ? (typeof item.proceedingsText === 'object'
                        ? Object.entries(item.proceedingsText).filter(([, v]) => v.trim()).map(([k, v]) => `${k}: ${v}`).join('\n')
                        : item.proceedingsText)
                    : item.completed && summary
                    ? (idx === 0 ? summary : t('proceedings_preview_mock_summary'))
                    : <span style={{ color: '#9e9e9e', fontStyle: 'italic' }}>{t('proceedings_preview_no_proceedings')}</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div style={page}>
      {govtHeader}

      <p style={{ ...sectionHeading, marginTop: '16px' }}>{t('proceedings_preview_attendance_heading')}</p>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ ...thStyle, width: '40px' }}>{t('proceedings_preview_col_sl')}</th>
            <th style={thStyle}>{t('proceedings_preview_col_name_desig')}</th>
            <th style={{ ...thStyle, width: '110px' }}>{t('proceedings_preview_col_attendance')}</th>
          </tr>
        </thead>
        <tbody>
          {MOCK_ATTENDANCE.map((m, idx) => (
            <tr key={m.id}>
              <td style={{ ...tdStyle, textAlign: 'center' }}>{idx + 1}</td>
              <td style={tdStyle}>
                <span style={{ fontWeight: 600 }}>{m.name}</span>
                <span style={{ color: '#5a5a5a', marginLeft: '4px' }}>— {m.designation}</span>
              </td>
              <td style={{ ...tdStyle, color: m.status === 'present' ? '#2e7d32' : '#b71c1c', fontWeight: 500 }}>
                {m.status === 'present' ? t('proceedings_preview_present') : t('proceedings_preview_absent')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e0e0e0' }}>
        {summary && (
          <div style={{ marginBottom: '14px' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#5a3a2e', marginBottom: '6px', fontFamily: NS_FONT }}>
              {t('proceedings_preview_closing')}
            </p>
            <p style={{ fontSize: '11px', color: '#3b3b3b', lineHeight: '1.6', whiteSpace: 'pre-wrap', fontFamily: NS_FONT }}>
              {summary}
            </p>
          </div>
        )}
        <p style={{ fontSize: '11px', fontFamily: NS_FONT }}>
          <strong>{t('proceedings_preview_next_meeting_label')}</strong>{' '}{nextLabel}
        </p>
      </div>

      <div style={{ marginTop: 'auto', paddingTop: '40px', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '160px', borderBottom: '1px solid #1a1a1a', marginBottom: '4px' }} />
          <p style={{ fontSize: '11px', color: '#5a5a5a', fontFamily: NS_FONT }}>
            {t('proceedings_preview_chairperson_sig')}
          </p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '160px', borderBottom: '1px solid #1a1a1a', marginBottom: '4px' }} />
          <p style={{ fontSize: '11px', color: '#5a5a5a', fontFamily: NS_FONT }}>
            {t('proceedings_preview_pdo_sig')}
          </p>
        </div>
      </div>
    </div>
  );
}
