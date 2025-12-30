import { ChevronDown } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { STEP_PRICES } from './consts';

import type { EPairs } from '@/types';

interface IOrderbookDropdownProps {
  value: string;
  handleSetPriceStep: (value: string) => void;
  pair: EPairs;
}

export default function OrderbookStepPriceDropdown(props: IOrderbookDropdownProps) {
  const { value, handleSetPriceStep, pair } = props;

  const dropdownOptions = STEP_PRICES[pair];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="border-0">
        <Button variant="outline" className="bg-transparent! text-foreground border">
          {value} <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-30">
        <DropdownMenuRadioGroup value={value} onValueChange={handleSetPriceStep}>
          {dropdownOptions.map((dropdownOption) => (
            <DropdownMenuRadioItem key={dropdownOption} value={dropdownOption}>
              {dropdownOption}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
