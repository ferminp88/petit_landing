import React from 'react';

interface AnnouncementBarProps {
  messages: string[];
  speedSeconds: number;
}

export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({ messages, speedSeconds }) => {
  if (!messages || messages.length === 0) return null;

  const SEP = '     •     ';
  const joined = messages.join(SEP);
  const duration = Math.max(5, Math.min(600, speedSeconds || 30));

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-8 bg-petit text-white overflow-hidden flex items-center">
      <div
        className="marquee-track whitespace-nowrap text-[11px] uppercase tracking-[0.22em] font-bold"
        style={{ ['--marquee-duration' as any]: `${duration}s` }}
      >
        <span className="pr-24">{joined}</span>
        <span className="pr-24" aria-hidden="true">{joined}</span>
      </div>
    </div>
  );
};
