/**
 * Image compressor utility to resize and compress photos on the client-side
 * before uploading them to Firestore, preventing document size overflows (1MB limit).
 */

export function compressImageBase64(
  base64Str: string,
  maxWidth = 1000,
  maxHeight = 1000,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve) => {
    if (!base64Str || !base64Str.startsWith("data:image/")) {
      resolve(base64Str);
      return;
    }

    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Handle scaling down
      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(base64Str);
        return;
      }

      // Fill with white background (useful for JPEG compression of transparent PNGs)
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);

      ctx.drawImage(img, 0, 0, width, height);
      
      // Compress to JPEG with the specified quality rating (0.0 to 1.0)
      const compressed = canvas.toDataURL("image/jpeg", quality);
      
      // Calculate sizes in KB (Base64 character count approximates actual bytes * 4/3)
      const origSizeKB = Math.round((base64Str.length * 3) / 4 / 1024);
      const compSizeKB = Math.round((compressed.length * 3) / 4 / 1024);
      const savingsPct = Math.round(((origSizeKB - compSizeKB) / Math.max(1, origSizeKB)) * 100);
      
      console.log(`[Image Compressor] Compressed successfully: ${origSizeKB}KB -> ${compSizeKB}KB (Saved ${savingsPct}% space, optimized document load time!) 🚀`);
      
      resolve(compressed);
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
}
