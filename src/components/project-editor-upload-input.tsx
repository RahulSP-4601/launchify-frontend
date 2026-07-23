"use client";

export function EditorUploadInput({
  onFileChange,
  uploadInputRef,
}: {
  onFileChange: (file: File | null) => void;
  uploadInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <input
      accept="audio/*,video/*"
      className="hidden"
      onChange={(event) => {
        onFileChange(event.target.files?.[0] ?? null);
        event.currentTarget.value = "";
      }}
      ref={uploadInputRef}
      type="file"
    />
  );
}
