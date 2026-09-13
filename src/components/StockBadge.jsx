import React from 'react';

export default function StockBadge({ stock }) {
  if (!Number.isInteger(stock) || stock < 0) return null;
  return <span className="absolute top-3 left-3 z-10 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900 shadow-sm dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
    {stock === 0 ? 'Out of stock' : `${stock} left`}
  </span>;
}
