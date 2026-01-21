export const resizeImageFile = (
  file,
  { maxWidth = 980, maxHeight = 980, quality = 0.8 } = {}
) =>
  new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith("image/")) {
      resolve(file);
      return;
    }

    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      const widthRatio = maxWidth / image.width;
      const heightRatio = maxHeight / image.height;
      const scale = Math.min(1, widthRatio, heightRatio);

      const targetWidth = Math.round(image.width * scale);
      const targetHeight = Math.round(image.height * scale);

      if (scale >= 1) {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
        return;
      }
      ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (!blob) {
            reject(new Error("이미지 변환에 실패했습니다."));
            return;
          }
          resolve(
            new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            })
          );
        },
        "image/jpeg",
        quality
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("이미지 로딩에 실패했습니다."));
    };

    image.src = objectUrl;
  });
