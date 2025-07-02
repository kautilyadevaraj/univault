"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState("");

  const upload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (res.ok) {
      setFileKey(data.fileKey);
    } else {
      alert(data.error);
    }
  };

  return (
    <div className="space-y-4 max-w-md mx-auto mt-10">
      <Input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      <Button onClick={upload}>Upload File</Button>
      {fileKey && (
        <p className="text-sm break-all">
          Uploaded successfully: <code>{fileKey}</code>
        </p>
      )}
    </div>
  );
}
