import Image from "next/image";

export function Logo({ size = "default" }: { size?: "small" | "default" | "large" }) {
  const dimensions = {
    small: { width: 120, height: 52 },
    default: { width: 180, height: 78 },
    large: { width: 260, height: 113 },
  }[size];

  return (
    <Image
      src="/logo.png"
      alt="Zé Pitaco"
      width={dimensions.width}
      height={dimensions.height}
      className="object-contain"
      priority
    />
  );
}
