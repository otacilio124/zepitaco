import Image from "next/image";
import { getFlagUrl, getCountryCode, getCountryName } from "@/lib/country-codes";

type Props = {
  name: string;
  size?: number;
  showName?: boolean;
  className?: string;
};

export function TeamFlag({ name, size = 28, showName = false, className = "" }: Props) {
  const code = getCountryCode(name);
  const ptName = getCountryName(name);
  const url = getFlagUrl(name, size > 40 ? 80 : 40);

  if (code === "un" || !url) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div
          className="rounded bg-surface-2 flex items-center justify-center text-[10px] text-muted font-bold shrink-0"
          style={{ width: size, height: Math.round(size * 0.7) }}
        >
          {name.slice(0, 3).toUpperCase()}
        </div>
        {showName && <span className="text-sm text-white truncate">{ptName}</span>}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image
        src={url}
        alt={ptName}
        width={size}
        height={Math.round(size * 0.7)}
        className="rounded-sm object-cover shrink-0"
        unoptimized
      />
      {showName && <span className="text-sm text-white truncate">{ptName}</span>}
    </div>
  );
}

export function TeamName({ name, className = "" }: { name: string; className?: string }) {
  return <span className={className}>{getCountryName(name)}</span>;
}
