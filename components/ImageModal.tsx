"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import Image from "next/image";

type ImageModalProps = {
  imageUrl: string;
  onClose: () => void;
};

export default function ImageModal({ imageUrl, onClose }: ImageModalProps) {
  return (
    <Dialog open={!!imageUrl} onOpenChange={onClose}>
      <DialogContent className='flex flex-col items-center justify-center max-w-[500px]'>
        <h2 className='text-lg font-bold mb-2'>Installation Image</h2>
        <Image
          src={imageUrl}
          alt='Installation Image'
          width={450}
          height={300}
          className='rounded-lg shadow-lg'
        />
      </DialogContent>
    </Dialog>
  );
}
