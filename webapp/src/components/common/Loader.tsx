export default function Loader({ label = "Loading…" }) {
    return (
      <div className="flex items-center gap-3 text-sm text-muted-foreground py-10 justify-center">
        <span className="size-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        {label}
      </div>
    );
  }
  