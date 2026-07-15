"use client";

export type UploadOverlayState = {
  active: boolean;
  fileName: string;
  phase: "uploading" | "processing";
  progress: number;
};

export const initialUploadOverlayState: UploadOverlayState = {
  active: false,
  fileName: "",
  phase: "uploading",
  progress: 0,
};

export function UploadProgressModal({ uploadOverlay }: { uploadOverlay: UploadOverlayState }) {
  const progressWidth = `${uploadOverlay.progress}%`;
  const caption = uploadOverlay.phase === "uploading"
    ? "Uploading your raw walkthrough to Launchify storage."
    : "Upload complete. The AI pipeline is now transcribing, scripting, and preparing renders.";
  const label = uploadOverlay.phase === "uploading" ? "Uploading raw video" : "Processing started";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[rgba(15,23,42,0.32)] px-4 backdrop-blur-md">
      <section className="w-full max-w-xl rounded-[32px] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.96)_0%,rgba(248,250,252,0.94)_100%)] p-7 shadow-[0_30px_80px_rgba(15,23,42,0.22)]">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--launchify-accent)]">{label}</p>
        <h3 className="mt-4 text-3xl font-black tracking-[-0.05em] text-slate-950">
          {uploadOverlay.phase === "uploading" ? "Sending your source file" : "Launch pipeline is in motion"}
        </h3>
        <p className="mt-4 text-sm leading-8 text-slate-500">{caption}</p>
        <div className="mt-8 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-4 rounded-full bg-[linear-gradient(90deg,#ef233c_0%,#ff6b6b_45%,#111827_100%)] transition-[width] duration-300 ease-out"
            style={{ width: progressWidth }}
          />
        </div>
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="font-semibold text-slate-950">{uploadOverlay.fileName}</span>
          <span className="font-semibold text-slate-500">{uploadOverlay.progress}%</span>
        </div>
        <div className="mt-6 flex gap-2">
          <div className={`h-2 flex-1 rounded-full ${uploadOverlay.progress >= 34 ? "bg-slate-950" : "bg-slate-200"}`} />
          <div className={`h-2 flex-1 rounded-full ${uploadOverlay.progress >= 67 ? "bg-slate-950" : "bg-slate-200"}`} />
          <div className={`h-2 flex-1 rounded-full ${uploadOverlay.progress >= 100 ? "bg-slate-950" : "bg-slate-200"}`} />
        </div>
      </section>
    </div>
  );
}
