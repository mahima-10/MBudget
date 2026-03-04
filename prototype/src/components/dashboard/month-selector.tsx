"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatMonth, getCurrentMonthStr } from "@/lib/currency";

export function MonthSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const current = getCurrentMonthStr();
  const [year, m] = current.split("-").map(Number);
  
  // Generate last 12 months for selector
  const allMonths = Array.from({ length: 12 }).map((_, i) => {
    const d = new Date(year, m - 1 - i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  if (!allMonths.includes(value)) {
    allMonths.unshift(value);
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select month" />
      </SelectTrigger>
      <SelectContent>
        {allMonths.map((m) => (
          <SelectItem key={m} value={m}>
            {formatMonth(m)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
