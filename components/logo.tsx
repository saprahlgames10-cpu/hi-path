import Link from "next/link";

interface LogoProps {
  href?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: { icon: 20, text: "text-base" },
  md: { icon: 28, text: "text-xl" },
  lg: { icon: 36, text: "text-2xl" },
};

function LogoIcon({ size }: { size: number }) {
  const gradientId = `logo-grad-${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="32" x2="32" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6C63FF" />
          <stop offset="1" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      <path d="M4 26 L12 20 L20 22 L28 8" stroke={`url(#${gradientId})`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="4" cy="26" r="2.5" fill="#6C63FF" />
      <circle cx="12" cy="20" r="2" fill="#6C63FF" />
      <circle cx="20" cy="22" r="2" fill="#6C63FF" />
      <circle cx="28" cy="8" r="3" fill={`url(#${gradientId})`} />
    </svg>
  );
}

export function Logo({ href, showText = true, size = "md", className = "" }: LogoProps) {
  const s = sizes[size];
  const content = (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoIcon size={s.icon} />
      {showText && <span className={`font-bold text-primary ${s.text}`}>HiPath</span>}
    </span>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
