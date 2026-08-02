"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Eye,
  EyeOff,
  FileText,
  Image as ImageIcon,
  Upload,
} from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { FILES_BUCKET, MAX_UPLOAD_BYTES } from "@/lib/supabase/config";
import {
  registerFile,
  deleteFile,
  toggleFileVisibility,
} from "@/lib/workspace/actions/content";
import { formatBytes, relativeTime } from "@/lib/workspace/format";
import type { FileRow } from "@/lib/workspace/database.types";
import { Badge, Button, Card, EmptyState } from "./ui/Primitives";
import { QuickForm } from "./ui/Form";

/**
 * Deliverables. Bytes go browser → Storage directly (keeps them off the Server
 * Action body limit and off our bandwidth), then a server action writes the
 * metadata row so RLS and the audit trigger still see every file.
 */
export default function FileManager({
  projectId,
  files,
  isStaff,
  canUpload = true,
}: {
  projectId: string;
  files: FileRow[];
  isStaff: boolean;
  canUpload?: boolean;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [zipping, setZipping] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function upload(fileList: FileList | null) {
    if (!fileList?.length) return;
    setError(null);

    for (const file of Array.from(fileList)) {
      if (file.size > MAX_UPLOAD_BYTES) {
        setError(
          `${file.name} is ${formatBytes(file.size)} — the cap is ${formatBytes(MAX_UPLOAD_BYTES)}. Link to Drive or GitHub for anything bigger.`,
        );
        continue;
      }

      setBusy(file.name);
      const key = `${projectId}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;

      const { error: uploadError } = await supabaseBrowser()
        .storage.from(FILES_BUCKET)
        .upload(key, file, { contentType: file.type || undefined });

      if (uploadError) {
        setError(`${file.name}: ${uploadError.message}`);
        setBusy(null);
        continue;
      }

      const form = new FormData();
      form.set("project_id", projectId);
      form.set("name", file.name);
      form.set("storage_path", key);
      form.set("size_bytes", String(file.size));
      form.set("mime_type", file.type);
      form.set("client_visible", "true");

      const result = await registerFile({}, form);
      if (result?.error) {
        // Roll the object back so Storage doesn't accumulate orphans.
        await supabaseBrowser().storage.from(FILES_BUCKET).remove([key]);
        setError(`${file.name}: ${result.error}`);
      }
      setBusy(null);
    }

    if (input.current) input.current.value = "";
    router.refresh();
  }

  async function open(file: FileRow) {
    const { data } = await supabaseBrowser()
      .storage.from(FILES_BUCKET)
      .createSignedUrl(file.storage_path, 600);

    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener");
    else setError("Could not generate a download link. Try again.");
  }

  async function downloadAll() {
    if (files.length === 0) return;
    setZipping(true);
    setError(null);

    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();

      for (const file of files) {
        const { data } = await supabaseBrowser()
          .storage.from(FILES_BUCKET)
          .download(file.storage_path);
        if (data) zip.file(file.name, data);
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "deliverables.zip";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Could not build the zip. Download files individually instead.");
    } finally {
      setZipping(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {canUpload ? (
          <>
            <input
              ref={input}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => upload(e.target.files)}
            />
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => input.current?.click()}
              disabled={busy !== null}
            >
              <Upload size={13} />
              {busy ? `Uploading ${busy}…` : "Upload"}
            </Button>
            <span className="text-[11px] text-[var(--ws-faint)]">
              Max {formatBytes(MAX_UPLOAD_BYTES)} per file
            </span>
          </>
        ) : null}

        {files.length > 0 ? (
          <Button
            type="button"
            size="sm"
            onClick={downloadAll}
            disabled={zipping}
            className="ml-auto"
          >
            <Download size={13} />
            {zipping ? "Zipping…" : "Download all"}
          </Button>
        ) : null}
      </div>

      {error ? (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-[var(--ws-red)]/40 bg-[var(--ws-red)]/10 px-3 py-2 text-xs text-[var(--ws-red)]"
        >
          {error}
        </p>
      ) : null}

      {files.length === 0 ? (
        <EmptyState title="No deliverables yet">
          Designs, exports, reports and screenshots land here. Anything over{" "}
          {formatBytes(MAX_UPLOAD_BYTES)} should live in Drive or GitHub with a
          link posted in the update feed.
        </EmptyState>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {files.map((file) => (
            <Card key={file.id} className="flex flex-col p-4">
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 text-[var(--ws-faint)]">
                  {file.mime_type?.startsWith("image/") ? (
                    <ImageIcon size={16} />
                  ) : (
                    <FileText size={16} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium" title={file.name}>
                    {file.name}
                  </p>
                  <p className="mono mt-0.5 text-[11px] text-[var(--ws-faint)]">
                    {formatBytes(file.size_bytes)} · {relativeTime(file.created_at)}
                  </p>
                </div>
                {isStaff && !file.client_visible ? (
                  <Badge tone="amber">Internal</Badge>
                ) : null}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-[var(--ws-line)] pt-3">
                <Button type="button" size="sm" onClick={() => open(file)}>
                  <Download size={12} /> Open
                </Button>

                {isStaff ? (
                  <>
                    <QuickForm
                      action={toggleFileVisibility}
                      fields={{ id: file.id, client_visible: !file.client_visible }}
                      variant="ghost"
                      size="sm"
                    >
                      {file.client_visible ? (
                        <>
                          <EyeOff size={12} /> Hide
                        </>
                      ) : (
                        <>
                          <Eye size={12} /> Show client
                        </>
                      )}
                    </QuickForm>
                    <span className="ml-auto">
                      <QuickForm
                        action={deleteFile}
                        fields={{ id: file.id }}
                        variant="ghost"
                        size="sm"
                        confirm={`Delete ${file.name}?`}
                        className="text-[var(--ws-faint)]"
                      >
                        Delete
                      </QuickForm>
                    </span>
                  </>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
