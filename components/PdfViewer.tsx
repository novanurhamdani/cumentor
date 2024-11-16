import React from "react";

type Props = {
  pdfUrl: string;
};

const PdfViewer = ({ pdfUrl }: Props) => {
  return (
    <iframe
      src={`https://docs.google.com/viewer?url=${pdfUrl}&embedded=true`}
      className="w-full h-full"
    >
      PdfViewer
    </iframe>
  );
};

export default PdfViewer;
