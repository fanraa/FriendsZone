import { addAuditLog } from "../lib/firebaseCache";

/**
 * Analyzes pixel values of an image for skin-tone distribution density.
 * Uses a classic skin color segmentation model optimized for high-speed client-side execution.
 * @param base64Str The Base64 encoded image string.
 * @param threshold The warning threshold percentage (default 40%)
 */
export async function scanImageSkinDensity(
  base64Str: string,
  threshold: number = 40
): Promise<{ isSuspicious: boolean; skinPercentage: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Scale down image to 100x100 for blistering performance (<5ms)
      const canvas = document.createElement("canvas");
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext("2d");
      
      if (!ctx) {
        resolve({ isSuspicious: false, skinPercentage: 0 });
        return;
      }

      ctx.drawImage(img, 0, 0, 100, 100);
      let imgData;
      try {
        imgData = ctx.getImageData(0, 0, 100, 100);
      } catch (e) {
        // Fallback for secure cross-origin issues
        resolve({ isSuspicious: false, skinPercentage: 0 });
        return;
      }

      const data = imgData.data;
      let skinPixels = 0;
      const totalPixels = 100 * 100;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];     // Red
        const g = data[i + 1]; // Green
        const b = data[i + 2]; // Blue
        // alpha: data[i+3]

        // Rule-based Skin Detection standard RGB formulation (Kovac et al.)
        // R > 95 and G > 40 and B > 20
        // max(R,G,B) - min(R,G,B) > 15
        // |R-G| > 15
        // R > G and R > B
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);

        const isSkin = 
          r > 95 && 
          g > 40 && 
          b > 30 && 
          (max - min > 15) && 
          Math.abs(r - g) > 15 && 
          r > g && 
          r > b;

        if (isSkin) {
          skinPixels++;
        }
      }

      const skinPercentage = Math.round((skinPixels / totalPixels) * 100);
      const isSuspicious = skinPercentage >= threshold;

      // Register the event in our memory-based administrator audit log!
      addAuditLog(
        "scan",
        `Canvas skin-tone scan completed: density ${skinPercentage}% (${isSuspicious ? "⚠ SUSPICIOUS" : "✓ PASS"}).`,
        { skinPercentage, isSuspicious }
      );

      resolve({ isSuspicious, skinPercentage });
    };

    img.onerror = () => {
      resolve({ isSuspicious: false, skinPercentage: 0 });
    };

    img.src = base64Str;
  });
}
