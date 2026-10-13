export default function SelectInput({ label, required, error, children, className = "", ...props }) {
    return (
      <label className={`block ${className}`}>
        {label && (
          <span className="block text-[13px] font-medium mb-1.5">
            {label} {required && <span className="text-danger">*</span>}
          </span>
        )}
        <select className={`sniper-input ${error ? "!border-danger" : ""}`} {...props}>
          {children}
        </select>
        {error && <span className="block mt-1 text-xs text-danger">{error}</span>}
      </label>
    );
  }