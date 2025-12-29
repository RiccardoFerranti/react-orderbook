interface IOrderbookBidAskPercentageProps {
  bidPercentage: number;
  askPercentage: number;
}

export default function OrderbookBidAskPercentage(props: IOrderbookBidAskPercentageProps) {
  const { bidPercentage, askPercentage } = props;

  return (
    <div className="w-full flex flex-col items-center pe-3">
      <div className="flex items-center justify-center gap-2 text-sm w-full">
        <span className="w-12">{bidPercentage.toFixed(2)}%</span>
        <div className="flex flex-1 h-2 rounded overflow-hidden bg-gray-200">
          {/* Bid part */}
          <div className="bg-green-500 h-full" style={{ flex: bidPercentage }} />
          {/* Ask part */}
          <div className="bg-red-500 h-full" style={{ flex: askPercentage }} />
        </div>
        <span className="w-12">{askPercentage.toFixed(2)}%</span>
      </div>
    </div>
  );
}
