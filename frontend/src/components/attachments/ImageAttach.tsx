import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);

interface ImageAttachProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxSizeMB?: number;
}

export function ImageAttach({ images, onImagesChange, maxSizeMB = 10 }: ImageAttachProps) {
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    setError(null);

    const newImages: string[] = [];
    const readers: Promise<string>[] = [];

    for (const file of files) {
      if (!ALLOWED_TYPES.has(file.type)) {
        setError("Unsupported format. Use PNG, JPEG, GIF, or WebP");
        return;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`Image must be under ${maxSizeMB}MB`);
        return;
      }
      readers.push(
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        }),
      );
    }

    Promise.all(readers).then((results) => {
      newImages.push(...results);
      onImagesChange([...images, ...newImages]);
    });
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          "inline-flex items-center gap-1 rounded-md border border-dashed border-gray-400 px-3 py-1.5",
          "text-sm text-gray-600 hover:border-gray-300 hover:bg-gray-100",
          "dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:bg-gray-800",
        )}
      >
        + Add image
      </button>

      {error && (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      )}

      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((src, i) => (
            <div key={i} className="group relative h-20 w-20">
              <img
                src={src}
                alt={`attachment ${i + 1}`}
                className="h-full w-full rounded-md object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-700 opacity-0 transition-opacity group-hover:opacity-100 dark:bg-gray-700 dark:text-gray-300"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}