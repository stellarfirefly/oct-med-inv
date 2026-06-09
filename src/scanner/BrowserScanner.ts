import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import type { Scanner } from "./Scanner";
import { normalizeProductCode } from "../database/repositories/inventoryRepository";

export class BrowserScanner implements Scanner {
  async scan() {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Camera access is not available in this browser.");
    }

    const overlay = document.createElement("div");
    overlay.className = "scanner-overlay";
    overlay.innerHTML = `
      <div class="scanner-dialog">
        <video class="scanner-video" muted autoplay playsinline></video>
        <button class="scanner-cancel" type="button">Cancel</button>
      </div>
    `;
    document.body.appendChild(overlay);

    const video = overlay.querySelector("video");
    const cancel = overlay.querySelector("button");
    if (!(video instanceof HTMLVideoElement) || !(cancel instanceof HTMLButtonElement)) {
      overlay.remove();
      throw new Error("Scanner view could not be created.");
    }

    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.EAN_13,
      BarcodeFormat.CODE_128
    ]);
    const reader = new BrowserMultiFormatReader(hints);

    return new Promise<string>((resolve, reject) => {
      let controls: { stop: () => void } | undefined;

      const cleanup = () => {
        controls?.stop();
        overlay.remove();
      };

      cancel.addEventListener("click", () => {
        cleanup();
        reject(new Error("Scan cancelled."));
      });

      reader
        .decodeFromVideoDevice(undefined, video, (result) => {
          if (!result) return;

          const productCode = normalizeProductCode(result.getText());
          cleanup();
          resolve(productCode);
        })
        .then((nextControls) => {
          controls = nextControls;
        })
        .catch((error) => {
          cleanup();
          reject(error);
        });
    });
  }
}
