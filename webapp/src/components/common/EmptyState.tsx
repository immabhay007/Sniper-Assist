export default function EmptyState({ icon: Icon, title, description, action }) {
    return (
      <div className="text-center py-12 px-4">
        {Icon && (
          <div className="mx-auto size-11 grid place-items-center rounded-full bg-muted text-muted-foreground mb-3">
            <Icon className="size-5" />
          </div>
        )}
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{description}</p>}
        {action && <div className="mt-4">{action}</div>}
      </div>
    );
}
  