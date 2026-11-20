import type { WorkspaceArtifact } from './integration';

/** Serialize the separate, always-fitted SVG, never the zoomed/panned editor. */
export function serializePlan(svg: SVGSVGElement): string {
  const copy = svg.cloneNode(true) as SVGSVGElement;
  copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  copy.setAttribute('width', '1600');
  copy.setAttribute('height', '1200');
  copy.removeAttribute('aria-hidden');
  copy.removeAttribute('data-testid');
  return new XMLSerializer().serializeToString(copy);
}
export async function capturePlan(
  svg: SVGSVGElement
): Promise<WorkspaceArtifact> {
  const source = serializePlan(svg);
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    const timer = setTimeout(
      () =>
        reject(
          new Error(
            'The floor plan image took too long to render. Please try exporting again.'
          )
        ),
      10000
    );
    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error('The floor plan could not be rendered as an image.'));
    };
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;
  });
  const canvas = document.createElement('canvas');
  canvas.width = 1600;
  canvas.height = 1200;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Image export is unavailable in this browser.');
  context.fillStyle = '#fcfdfd';
  context.fillRect(0, 0, 1600, 1200);
  context.drawImage(image, 0, 0, 1600, 1200);
  return {
    dataUrl: canvas.toDataURL('image/png'),
    mimeType: 'image/png',
    width: 1600,
    height: 1200,
  };
}
export function downloadPlan(
  filename: string,
  data: string,
  mimeType?: string
) {
  const href = mimeType
    ? URL.createObjectURL(new Blob([data], { type: mimeType }))
    : data;
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  link.click();
  if (mimeType) setTimeout(() => URL.revokeObjectURL(href), 1000);
}
