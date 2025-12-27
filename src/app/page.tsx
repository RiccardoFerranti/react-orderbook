import OrderBook from '@/components/orderbook/orderbook';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center font-sans bg-(--background)/30">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 sm:items-start ">
        <OrderBook />
      </main>
    </div>
  );
}
