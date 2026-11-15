import React from 'react';

export const KolamPattern: React.FC<{ className?: string }> = ({ className = 'h-4 w-full text-terracotta opacity-25' }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 400 20"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d="M0,10 Q10,0 20,10 T40,10 T60,10 T80,10 T100,10 T120,10 T140,10 T160,10 T180,10 T200,10 T220,10 T240,10 T260,10 T280,10 T300,10 T320,10 T340,10 T360,10 T380,10 T400,10" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="10" cy="10" r="2.5" />
      <circle cx="30" cy="10" r="2.5" />
      <circle cx="50" cy="10" r="2.5" />
      <circle cx="70" cy="10" r="2.5" />
      <circle cx="90" cy="10" r="2.5" />
      <circle cx="110" cy="10" r="2.5" />
      <circle cx="130" cy="10" r="2.5" />
      <circle cx="150" cy="10" r="2.5" />
      <circle cx="170" cy="10" r="2.5" />
      <circle cx="190" cy="10" r="2.5" />
      <circle cx="210" cy="10" r="2.5" />
      <circle cx="230" cy="10" r="2.5" />
      <circle cx="250" cy="10" r="2.5" />
      <circle cx="270" cy="10" r="2.5" />
      <circle cx="290" cy="10" r="2.5" />
      <circle cx="310" cy="10" r="2.5" />
      <circle cx="330" cy="10" r="2.5" />
      <circle cx="350" cy="10" r="2.5" />
      <circle cx="370" cy="10" r="2.5" />
      <circle cx="390" cy="10" r="2.5" />
    </svg>
  );
};
