import { Wallet } from 'lucide-react';

export function Logo() {
  return (
    <span className="logo">
      <span className="logo-mark">
        <Wallet size={18} />
      </span>
      <span>Expense Tracker</span>
    </span>
  );
}
