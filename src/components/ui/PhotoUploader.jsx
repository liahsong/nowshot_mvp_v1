import { useRef } from "react";
import { X } from "lucide-react";
import { resizeImageFile } from "../../utils/resizeImage";

export default function PhotoUploader({
  photos,
  onPhotosChange,
  maxPhotos = 3,
  label,
  accept = "image/*",
}) {
  const inputRef = useRef(null);

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    const limit = Math.max(0, maxPhotos - photos.length);
    const resizedFiles = await Promise.all(
      files.slice(0, limit).map((file) => resizeImageFile(file))
    );

    const newItems = resizedFiles.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }));

    if (newItems.length) {
      onPhotosChange([...photos, ...newItems]);
    }
  };

  const removePhoto = (item) => {
    URL.revokeObjectURL(item.previewUrl);
    onPhotosChange(photos.filter((photo) => photo !== item));
  };

  return (
    <div className="space-y-3">
      {label && <div className="text-sm font-medium text-gray-900">{label}</div>}
      <div className="grid grid-cols-3 gap-3">
        {photos.map((item) => (
          <div
            key={item.previewUrl}
            className="relative rounded-xl overflow-hidden"
          >
            <img
              src={item.previewUrl}
              alt=""
              className="w-full h-24 object-cover"
            />
            <button
              type="button"
              onClick={() => removePhoto(item)}
              className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        {photos.length < maxPhotos && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="h-24 rounded-xl border border-dashed border-gray-300 flex items-center justify-center text-gray-400"
          >
            +
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
