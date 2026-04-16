/**
 * Image Codec - Encoder & Decoder for base64 data URI format
 * Format: { key: "data:image/[type];base64,[base64data]" }
 */

// ============================================
// ENCODER: Convert files/data to IMAGES format
// ============================================

class ImageEncoder {
  /**
   * Encode a single image file to base64 data URI
   * @param {File|Blob} file - Image file
   * @param {string} key - Property key name
   * @returns {Promise<Object>} { key: dataURI }
   */
  static async encodeFile(file, key) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          [key]: e.target.result, // Already in "data:image/...;base64,..." format
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Encode multiple image files to IMAGES object
   * @param {Object} files - { key: File, key2: File, ... }
   * @returns {Promise<Object>} Complete IMAGES object
   */
  static async encodeFiles(files) {
    const result = {};
    for (const [key, file] of Object.entries(files)) {
      const encoded = await this.encodeFile(file, key);
      Object.assign(result, encoded);
    }
    return result;
  }

  /**
   * Convert raw base64 string to data URI
   * @param {string} base64 - Raw base64 string (without data: prefix)
   * @param {string} mimeType - MIME type (e.g., "image/jpeg", "image/png")
   * @returns {string} Complete data URI
   */
  static toDataURI(base64, mimeType = "image/jpeg") {
    return `data:${mimeType};base64,${base64}`;
  }

  /**
   * Convert IMAGES object to JavaScript export string
   * @param {Object} imagesObj - { jelly: "data:...", ... }
   * @returns {string} JavaScript code string
   */
  static toJavaScript(imagesObj) {
    const entries = Object.entries(imagesObj)
      .map(([key, dataURI]) => {
        return `  ${key}: "${dataURI}"`;
      })
      .join(",\n");

    return `const IMAGES = {\n${entries}\n};`;
  }

  /**
   * Create downloadable JSON of IMAGES object
   * @param {Object} imagesObj - The IMAGES object
   * @param {string} filename - Output filename (default: "images.json")
   */
  static downloadJSON(imagesObj, filename = "images.json") {
    const json = JSON.stringify(imagesObj, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Create downloadable JS file of IMAGES object
   * @param {Object} imagesObj - The IMAGES object
   * @param {string} filename - Output filename (default: "images.js")
   */
  static downloadJS(imagesObj, filename = "images.js") {
    const jsCode = this.toJavaScript(imagesObj);
    const blob = new Blob([jsCode], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// ============================================
// DECODER: Convert IMAGES format to usable data
// ============================================

class ImageDecoder {
  /**
   * Extract base64 from data URI
   * @param {string} dataURI - Data URI string
   * @returns {string} Raw base64 string (without prefix)
   */
  static extractBase64(dataURI) {
    const match = dataURI.match(/base64,(.*)$/);
    return match ? match[1] : "";
  }

  /**
   * Extract MIME type from data URI
   * @param {string} dataURI - Data URI string
   * @returns {string} MIME type (e.g., "image/jpeg")
   */
  static extractMimeType(dataURI) {
    const match = dataURI.match(/data:(.+?);/);
    return match ? match[1] : "image/jpeg";
  }

  /**
   * Convert data URI to Blob
   * @param {string} dataURI - Data URI string
   * @returns {Blob} Image blob
   */
  static toBlob(dataURI) {
    const base64 = this.extractBase64(dataURI);
    const mimeType = this.extractMimeType(dataURI);
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeType });
  }

  /**
   * Convert data URI to downloadable file
   * @param {string} dataURI - Data URI string
   * @param {string} filename - Output filename
   */
  static downloadImage(dataURI, filename) {
    const blob = this.toBlob(dataURI);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Convert data URI to HTMLImageElement
   * @param {string} dataURI - Data URI string
   * @returns {HTMLImageElement} Image element
   */
  static toImageElement(dataURI) {
    const img = document.createElement("img");
    img.src = dataURI;
    return img;
  }

  /**
   * Convert IMAGES object to individual downloads
   * @param {Object} imagesObj - The IMAGES object
   * @param {string} prefix - Filename prefix (default: "image_")
   */
  static downloadAll(imagesObj, prefix = "image_") {
    Object.entries(imagesObj).forEach(([key, dataURI], index) => {
      const mimeType = this.extractMimeType(dataURI);
      const ext = mimeType.split("/")[1] || "jpg";
      const filename = `${prefix}${key}.${ext}`;
      this.downloadImage(dataURI, filename);
    });
  }

  /**
   * Convert IMAGES object to ObjectURL map
   * @param {Object} imagesObj - The IMAGES object
   * @returns {Object} { key: objectURL, ... }
   */
  static toObjectURLs(imagesObj) {
    const urls = {};
    Object.entries(imagesObj).forEach(([key, dataURI]) => {
      const blob = this.toBlob(dataURI);
      urls[key] = URL.createObjectURL(blob);
    });
    return urls;
  }

  /**
   * Validate IMAGES format
   * @param {Object} imagesObj - The IMAGES object to validate
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  static validate(imagesObj) {
    const errors = [];

    if (!imagesObj || typeof imagesObj !== "object") {
      errors.push("IMAGES must be an object");
      return { valid: false, errors };
    }

    Object.entries(imagesObj).forEach(([key, value]) => {
      if (typeof value !== "string") {
        errors.push(`Property "${key}" must be a string`);
      }
      if (!value.startsWith("data:image/")) {
        errors.push(`Property "${key}" must start with "data:image/"`);
      }
      if (!value.includes(";base64,")) {
        errors.push(`Property "${key}" must contain ";base64,"`);
      }
    });

    return { valid: errors.length === 0, errors };
  }
}

// ============================================
// EXPORT (for Node.js / bundlers)
// ============================================
if (typeof module !== "undefined" && module.exports) {
  module.exports = { ImageEncoder, ImageDecoder };
}
