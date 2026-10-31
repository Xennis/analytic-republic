import { FileUp, ShieldCheck } from "lucide-react";
import { useState, type DragEvent } from "react";
import { cn } from "@/lib/utils";

type Props = {
  onFile: (file: File) => void;
};

export function CsvDropzone({ onFile }: Props) {
  const [dragging, setDragging] = useState(false);

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) onFile(file);
  }

  return (
    <label
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "flex cursor-pointer flex-col items-center gap-4 rounded-xl border-2 border-dashed px-6 py-16 text-center transition-colors",
        dragging ? "border-primary bg-muted" : "border-border hover:bg-muted/50",
      )}
    >
      <FileUp className="size-10 text-muted-foreground" aria-hidden />
      <div className="space-y-1">
        <p className="text-lg font-medium">Trade-Republic-Export hier ablegen</p>
        <p className="text-sm text-muted-foreground">
          oder klicken, um die CSV-Datei („Transaktionsexport“) auszuwählen.
        </p>
      </div>
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <ShieldCheck className="size-4" aria-hidden />
        Die Datei wird nur in deinem Browser ausgewertet und nirgendwohin hochgeladen.
      </p>
      <input
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = "";
        }}
      />
    </label>
  );
}
