export default function BuySellIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className={className}>
      <path
        className="fill-current text-green-500"
        d="M2.66663 2.66699L7.33329 2.66699L7.33329 13.3337L2.66663 13.3337L2.66663 2.66699Z"
      />
      <path
        className="fill-current text-slate-400"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.66663 2.66699L13.3333 2.66699L13.3333 5.33366L8.66663 5.33366L8.66663 2.66699ZM8.66663 6.66699L13.3333 
        6.66699L13.3333 9.33366L8.66663 9.33366L8.66663 6.66699ZM13.3333 10.667L8.66663 10.667L8.66663 13.3337L13.3333 
        13.3337L13.3333 10.667Z"
      />
    </svg>
  );
}
