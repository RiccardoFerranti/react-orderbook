export interface IOrderbookBidAskPercentageProps {
  bidPercentage: number;
  askPercentage: number;
}

export default function OrderbookBidAskPercentage(props: IOrderbookBidAskPercentageProps) {
  const { bidPercentage, askPercentage } = props;

  return (
    <div className="flex w-full flex-col items-center">
      <div className="flex w-full items-center justify-center gap-2 text-sm">
        <span className="w-12">{bidPercentage.toFixed(2)}%</span>
        <div className="flex h-2 flex-1 overflow-hidden rounded bg-gray-200">
          {/* Bid part */}
          <div className="h-full bg-green-500" style={{ flex: bidPercentage }} />
          {/* Ask part */}
          <div className="h-full bg-red-500" style={{ flex: askPercentage }} />
        </div>
        <span className="w-12">{askPercentage.toFixed(2)}%</span>
      </div>
    </div>
  );
}
