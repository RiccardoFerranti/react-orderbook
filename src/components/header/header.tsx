'use client';

import { Moon, Sun } from 'lucide-react';
import Link from 'next/link';

import { useTheme } from '@/components/providers/theme-provider';

export default function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="mx-auto px-4 py-4 flex justify-between items-center bg-background border-b border-border">
      <div className="max-w-7xl mx-auto flex justify-between items-center w-full">
        <Link href="/" className="text-3xl font-bold text-foreground">
          Order Book
        </Link>
        <button onClick={toggleTheme} className="px-4 py-2 bg-transparent text-foreground cursor-pointer">
          {theme === 'dark' ? <Sun /> : <Moon />}
        </button>
      </div>
    </div>
  );
}
