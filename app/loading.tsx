// app/loading.tsx
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[70vh] w-full">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-12 h-12 border-4 border-emerald-100 dark:border-emerald-900/50 rounded-full"></div>
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-500" />
        </div>
        <p className="text-sm font-semibold animate-pulse tracking-wide">
          Memuat data keuangan...
        </p>
      </div>
    </div>
  );
}