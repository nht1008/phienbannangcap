import type { SVGProps } from 'react';

export function WarehouseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 1.1.9 2 2 2h12a2 2 0 002-2V7M16 7V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v3M12 12h.01" />
    </svg>
  );
}
