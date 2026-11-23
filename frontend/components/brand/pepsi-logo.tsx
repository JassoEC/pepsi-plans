type Props = { className?: string; size?: number };

const logoUrl = "https://upload.wikimedia.org/wikipedia/commons/6/68/Pepsi_2023.svg";

export default function PepsiLogo({ className = "", size = 40 }: Props) {
  return (
    <img
      src={logoUrl}
      alt="Pepsi"
      width={size}
      height={size}
      className={`shrink-0 object-contain ${className}`}
    />
  );
}
