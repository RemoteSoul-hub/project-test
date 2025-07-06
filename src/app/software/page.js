'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SoftwarePage() {
  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold mb-6">Software</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/software/trackatrader">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer">
            <h2 className="text-xl font-semibold mb-2">TrackATrader</h2>
            <p className="text-gray-500">Manage your TrackATrader software.</p>
          </div>
        </Link>
      </div>
    </div>
  );
} 