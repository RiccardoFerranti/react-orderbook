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
      <DropdownMenuTrigger asChild className="border-0 w-50 h-10">
        <Button variant="outline" className="bg-transparent! text-foreground border border-foreground">
          {value.toUpperCase()} <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-50">
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
