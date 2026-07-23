"use client";

import { EditorSceneDraft } from "@/components/project-editor-draft";

export function ReferencePreviewMock({
  detail,
  scene,
}: {
  detail: string;
  scene: EditorSceneDraft | null;
}) {
  return (
    <div className="grid h-full w-full place-items-center bg-[radial-gradient(circle_at_50%_0%,rgba(155,121,48,0.16),transparent_38%),linear-gradient(180deg,#081011,#06090b)] p-8 text-left">
      <div className="w-full rounded-[18px] border border-white/6 bg-[linear-gradient(180deg,rgba(13,17,18,0.98),rgba(8,12,12,0.98))] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
        <PreviewHeader scene={scene} />
        <div className="mt-6 grid grid-cols-[minmax(0,1.08fr)_322px] gap-8">
          <PreviewHero detail={detail} scene={scene} />
          <PreviewSidebar scene={scene} />
        </div>
        <PreviewFooter />
      </div>
    </div>
  );
}

function PreviewHeader({ scene }: { scene: EditorSceneDraft | null }) {
  return (
    <div className="flex items-center justify-between rounded-full border border-white/6 bg-[linear-gradient(90deg,rgba(35,40,41,0.86),rgba(58,46,25,0.82),rgba(22,28,29,0.86))] px-4 py-3">
      <span className="text-[10px] uppercase tracking-[0.42em] text-[#c7ab54]">
        {scene?.title?.slice(0, 10).toUpperCase() || "PRONOUNCLY"}
      </span>
      <div className="flex items-center gap-4 text-[9px] text-[#8f938f]">
        <span>Courses</span>
        <span className="rounded-full border border-white/8 px-3 py-1 text-[#a1a6a1]">Google Login</span>
      </div>
    </div>
  );
}

function PreviewHero({
  detail,
  scene,
}: {
  detail: string;
  scene: EditorSceneDraft | null;
}) {
  return (
    <div className="pt-4">
      <span className="inline-flex rounded-full bg-[#2d2818] px-4 py-2 text-[10px] text-[#d0a954]">
        Preview pending
      </span>
      <h2 className="mt-5 max-w-[470px] text-[36px] font-semibold leading-[1.02] tracking-[-0.045em] text-white">
        {previewHeadline(scene)}
      </h2>
      <p className="mt-5 max-w-[470px] text-[13px] leading-7 text-[#9a9f9a]">
        {detail || `Launchify is still preparing media for ${scene?.title || "the selected scene"}. This layout mirrors the target composition while rendered assets are unavailable.`}
      </p>
      <div className="mt-6 flex items-center gap-3">
        <span className="rounded-full bg-[linear-gradient(90deg,#f2b35f,#ff8b63)] px-5 py-3 text-[12px] font-medium text-white">Rendering</span>
        <span className="rounded-full border border-white/8 bg-[#202525] px-5 py-3 text-[12px] font-medium text-[#d9dbd9]">Awaiting media</span>
      </div>
    </div>
  );
}

function PreviewSidebar({ scene }: { scene: EditorSceneDraft | null }) {
  return (
    <div className="rounded-[28px] border border-white/6 bg-[linear-gradient(180deg,rgba(40,42,40,0.96),rgba(22,26,24,0.96))] p-4 shadow-[0_18px_34px_rgba(0,0,0,0.22)]">
      <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.28em] text-[#96804f]">
        <span>Preview Status</span>
        <span className="rounded-full bg-[#21352c] px-3 py-1 text-[8px] tracking-normal text-[#6ec59a]">Placeholder</span>
      </div>
      <h3 className="mt-4 text-[15px] font-semibold text-[#f4f5f4]">{scene?.title || "Media generation in progress"}</h3>
      <p className="mt-2 text-[11px] leading-6 text-[#9ba09a]">
        The final frame, captions, and rendered scene layout will replace this placeholder automatically when assets are available.
      </p>
      <PreviewInfoCard label="Video asset" value="Not ready yet" />
      <PreviewInfoCard label="Rendered state" value="Showing placeholder preview only" />
      <div className="mt-4 grid grid-cols-3 gap-3">
        <PreviewStatCard label="Scene data" value="Loaded" />
        <PreviewStatCard label="Media file" value="Pending" />
        <PreviewStatCard label="Preview" value="Mock" />
      </div>
    </div>
  );
}

function PreviewFooter() {
  return (
    <div className="mt-4 grid grid-cols-[repeat(3,minmax(0,1fr))_1.28fr] gap-3">
      <PreviewFeatureCard title="Scene" body="Selected scene metadata is available for layout preview." />
      <PreviewFeatureCard title="Captions" body="Caption overlays will appear once the final timing is rendered." />
      <PreviewFeatureCard title="Media" body="Video and image assets are still being processed." />
      <div className="rounded-[16px] border border-[#29373b] bg-[linear-gradient(90deg,rgba(34,28,49,0.78),rgba(22,35,47,0.82))] p-4">
        <p className="text-[9px] uppercase tracking-[0.28em] text-[#8887cf]">Placeholder Notice</p>
        <p className="mt-2 max-w-[220px] text-[11px] leading-5 text-[#aeb3c8]">
          This panel mirrors the target composition style only. It is not the final rendered preview.
        </p>
      </div>
    </div>
  );
}

function PreviewInfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-4 rounded-[14px] border border-white/6 bg-[#111918] p-4">
      <p className="text-[9px] uppercase tracking-[0.28em] text-[#66716d]">{label}</p>
      <p className="mt-2 text-[12px] text-[#dfe3df]">{value}</p>
    </div>
  );
}

function PreviewStatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] border border-white/6 bg-[#1d2121] p-3">
      <p className="text-[8px] uppercase tracking-[0.22em] text-[#6f7470]">{label}</p>
      <p className="mt-2 text-[15px] font-semibold text-white">{value}</p>
    </div>
  );
}

function PreviewFeatureCard({ body, title }: { body: string; title: string }) {
  return (
    <div className="rounded-[16px] border border-white/6 bg-[#171c1c] p-4">
      <p className="text-[12px] font-semibold text-white">{title}</p>
      <p className="mt-3 text-[10px] leading-5 text-[#909693]">{body}</p>
    </div>
  );
}

function previewHeadline(scene: EditorSceneDraft | null) {
  if (!scene?.spokenLine) return "Rendered preview will appear here when this scene is ready.";
  const words = scene.spokenLine.trim().split(/\s+/).slice(0, 10).join(" ");
  return words.length > 58 ? `${words.slice(0, 58)}...` : words;
}
