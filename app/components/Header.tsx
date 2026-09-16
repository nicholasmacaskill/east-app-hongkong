'use client';

import { useTenant } from '@/app/providers/TenantProvider';

export default function Header() {
  const { tenant } = useTenant();
  return (
    <header className="header flex justify-center items-center py-4">
      {tenant.assets.logoUrl ? (
        <img src={tenant.assets.logoUrl} alt={tenant.assets.logoAlt} className="h-12 w-auto object-contain" />
      ) : (
        <div className="east-logo font-montserrat font-black italic">{tenant.shortName}</div>
      )}
    </header>
  );
}