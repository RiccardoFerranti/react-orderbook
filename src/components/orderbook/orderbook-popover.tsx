import { Ellipsis } from 'lucide-react';

import type { IPopoverFields, popoverFieldsInitialState } from '@/components/orderbook/orderbook';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface IOrderbookPopoverProps {
  onCheckedChange: (value: boolean, field: keyof typeof popoverFieldsInitialState) => void;
  popoverFields: IPopoverFields;
}

export default function OrderbookPopover(props: IOrderbookPopoverProps) {
  const { onCheckedChange, popoverFields } = props;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button className="text-foreground/30 hover:text-foreground/80 cursor-pointer bg-transparent hover:bg-transparent">
          <Ellipsis className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60">
        <div className="flex flex-col gap-6">
          <span className="text-foreground text-xs">Order Book Display Options</span>
          <div>
            <div className="flex items-center justify-start gap-3">
              <Checkbox
                id="rounding"
                name="rounding"
                checked={popoverFields.rounding}
                onCheckedChange={(value: boolean) => onCheckedChange(value, 'rounding')}
              />
              <Label htmlFor="rounding">Rounding</Label>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
