import { HiOutlineCloudUpload } from "react-icons/hi";
import { useRef, useState } from "react";

export default function FileUpload({
  label = "Proof of deposit",
  hint = "Click to attach — PDF, JPG, PNG (max 10 MB)",
  onChange,
  multiple = false,
  accept = ".pdf,.jpg,.jpeg,.png,.webp,.gif",
}) {
  const ref = useRef(null);
  const [names, setNames] = useState([]);

  const handle = (e) => {
    const files = Array.from(e.target.files || []);
    setNames(files.map((f) => f.name));
    onChange?.(files);
  };

  return (
    <div>
      {label && <div className="text-[13px] font-medium mb-1.5">{label}</div>}
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="w-full border border-dashed border-warning/40 bg-warning-soft/40 rounded-xl py-7 px-4 flex flex-col items-center justify-center text-center hover:bg-warning-soft/60 transition"
      >
        <HiOutlineCloudUpload className="size-6 text-warning/80 mb-2" />
        <p className="text-sm text-foreground/80">{names.length ? names.join(", ") : hint}</p>
      </button>
      <input
        ref={ref}
        type="file"
        multiple={multiple}
        accept={accept}
        onChange={handle}
        className="hidden"
      />
    </div>
  );
}
