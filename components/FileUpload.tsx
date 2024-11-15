"use client";
import { uploadToS3 } from "@/lib/s3";
import { Inbox } from "lucide-react";
import React from "react";
import { useDropzone } from "react-dropzone";

const FileUpload = () => {
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0];

      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        return;
      }

      try {
        const data = await uploadToS3(file);
        console.log({ data });
      } catch (error) {
        console.log(error);
      }
    },
  });

  return (
    <div className="p-2 bg-white rounded-xl">
      <div
        {...getRootProps({
          className:
            "border-dashed border-2 border-gray-300 py-8 rounded-xl cursor-pointer flex items-center justify-center flex-col",
        })}
      >
        <input {...getInputProps()} />
        <>
          <Inbox className="w-10 h-10 text-teal-600" />
          <p className="mt-2 text-sm text-slate-600">Drop your PDF file here</p>
        </>
      </div>
    </div>
  );
};

export default FileUpload;
