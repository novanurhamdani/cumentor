"use client";
import React, { useState } from "react";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import { Loader2 } from "lucide-react";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

type Props = {
  pdfUrl: string;
};

const PdfViewer = ({ pdfUrl }: Props) => {
  const [isLoading, setIsLoading] = useState(true);
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  if (!pdfUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-popover">
        <p className="text-muted-foreground text-sm">No PDF selected</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-popover">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Loading PDF...</p>
          </div>
        </div>
      )}
      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
        <div className="w-full h-full">
          <Viewer
            fileUrl={pdfUrl}
            plugins={[defaultLayoutPluginInstance]}
            onDocumentLoad={() => setIsLoading(false)}
          />
        </div>
      </Worker>
    </div>
  );
};

export default PdfViewer;
