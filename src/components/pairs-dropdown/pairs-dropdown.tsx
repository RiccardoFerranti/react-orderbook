import { ChevronDown } from 'lucide-react';

import { PAIRS_DROPDOWN_OPTIONS } from './consts';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { EPairs } from '@/types';

export interface IOrderbookPairsDropdownProps {
  value: EPairs;
  handleSetPair: (value: string) => void;
}

export default function PairsDropdown(props: IOrderbookPairsDropdownProps) {
  const { value, handleSetPair } = props;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="h-10 w-35 border-0">
        <Button variant="outline" className="text-foreground border-foreground border bg-transparent!">
          {value.toUpperCase()} <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-35">
        <DropdownMenuRadioGroup value={value} onValueChange={handleSetPair}>
          {PAIRS_DROPDOWN_OPTIONS.map((dropdownOption) => (
            <DropdownMenuRadioItem key={dropdownOption} value={dropdownOption}>
              {dropdownOption.toUpperCase()}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
