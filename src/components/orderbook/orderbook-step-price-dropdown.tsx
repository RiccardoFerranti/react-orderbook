import { ChevronDown } from 'lucide-react';

import { STEP_PRICES } from '@/components/orderbook/consts';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { EPairs } from '@/types';

export interface IOrderbookDropdownProps {
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
        <Button variant="outline" className="text-foreground bg-transparent!">
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
