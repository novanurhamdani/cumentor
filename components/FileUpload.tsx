"use client";
import { uploadToS3 } from "@/lib/s3";
import { useMutation } from "@tanstack/react-query";
import { Inbox, Loader2 } from "lucide-react";
import React from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const FileUpload = () => {
  const router = useRouter();
  const [uploading, setUploading] = React.useState(false);
  const { mutate, isPending } = useMutation({
    mutationFn: async ({
      file_key,
      file_name,
    }: {
      file_key: string;
      file_name: string;
    }) => {
      const response = await axios.post("/api/create-chat", {
        file_key,
        file_name,
      });

      return response.data;
    },
  });

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0];

      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }

      try {
        setUploading(true);

        const data = await uploadToS3(file);

        if (!data?.file_key || !data?.file_name) {
          toast.error("Something went wrong");
          return;
        }

        mutate(data, {
          onSuccess: ({ chat_id }) => {
            toast.success("Chat created successfully");
            router.push(`/chat/${chat_id}`);
          },
          onError: (error) => {
            toast.error("Error creating chat");
            console.error(error);
          },
        });
      } catch (error) {
        console.error(error);
      } finally {
        setUploading(false);
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
        {uploading || isPending ? (
          <>
            <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
            <p className="mt-2 text-sm text-slate-600">Spilling Tea to GPT</p>
          </>
        ) : (
          <>
            <Inbox className="w-10 h-10 text-teal-600" />
            <p className="mt-2 text-sm text-slate-600">
              Drop your PDF file here
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
