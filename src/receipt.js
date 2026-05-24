/* ========================================
   RECEIPT — Image compression & helpers
   ======================================== */

const MAX_DIM = 800;
const QUALITY = 0.7;

export function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.onload = () => {
            const img = new Image();
            img.onerror = () => reject(new Error('Failed to load image'));
            img.onload = () => {
                let { width, height } = img;
                if (width > MAX_DIM || height > MAX_DIM) {
                    if (width > height) {
                        height = Math.round((height / width) * MAX_DIM);
                        width = MAX_DIM;
                    } else {
                        width = Math.round((width / height) * MAX_DIM);
                        height = MAX_DIM;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', QUALITY));
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    });
}
