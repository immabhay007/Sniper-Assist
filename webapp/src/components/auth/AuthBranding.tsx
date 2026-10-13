import { getSniperLogoUrl } from "@/utils/azureStorage";

export default function AuthBranding({ title, subtitle }) {
  return (
    <div className="text-center mb-6">
      <img
        src={getSniperLogoUrl()}
        alt="Sniper"
        className="h-14 w-auto max-w-[220px] mx-auto object-contain"
      />
      {title ? (
        <h1 className="mt-4 text-[22px] font-semibold tracking-tight text-foreground">{title}</h1>
      ) : null}
      {subtitle ? (
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      ) : null}
    </div>
  );
}
