
import React from 'react';

export const GenerateIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 2L12 5" />
    <path d="M12 19L12 22" />
    <path d="M19 12L22 12" />
    <path d="M2 12L5 12" />
    <path d="M18 18L19.5 19.5" />
    <path d="M4.5 19.5L6 18" />
    <path d="M18 6L19.5 4.5" />
    <path d="M4.5 4.5L6 6" />
    <path d="M15 9.5C15 11.433 13.433 13 11.5 13C9.567 13 8 11.433 8 9.5C8 7.567 9.567 6 11.5 6C13.433 6 15 7.567 15 9.5Z" />
    <path d="M19 17L14 17" />
  </svg>
);
