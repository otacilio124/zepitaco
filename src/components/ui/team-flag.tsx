import Image from "next/image";
import { getFlagUrl, getCountryCode } from "@/lib/country-codes";

type Props = {
  name: string;
  size?: number;
  className?: string;
};

export function TeamFlag({ name, size = 28, className = "" }: Props) {
  const code = getCountryCode(name);
  if (code === "un") {
    return (
      <div
        className={`rounded bg-surface-hover flex items-center justify-center text-[10px] text-muted font-bold shrink-0 ${className}`}
        style={{ width: size, height: Math.round(size * 0.7) }}
      >
        {name.slice(0, 3).toUpperCase()}
      </div>
    );
  }

  return (
    <Image
      src={getFlagUrl(name, size > 40 ? 80 : 40)}
      alt={name}
      width={size}
      height={Math.round(size * 0.7)}
      className={`rounded-sm object-cover shrink-0 ${className}`}
      unoptimized
    />
  );
}
