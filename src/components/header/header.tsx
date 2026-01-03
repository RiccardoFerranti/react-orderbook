'use client';

import { Moon, Sun } from 'lucide-react';
import Link from 'next/link';

import { useTheme } from '@/components/providers/theme-provider';

export default function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="bg-background border-border mx-auto flex items-center justify-between border-b px-4 py-4">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
        <Link href="/" className="text-foreground text-3xl font-bold">
          Order Book
        </Link>
        <button onClick={toggleTheme} className="text-foreground cursor-pointer bg-transparent px-4 py-2">
          {theme === 'dark' ? <Sun /> : <Moon />}
        </button>
      </div>
    </div>
  );
}
