/**
 * Utility functions for downloading content as images or PDFs
 */

import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

/**
 * Download a DOM element as a PNG image
 * Uses html-to-image library which supports modern CSS (lab, lch, oklab)
 */
export async function downloadAsPNG(
  element: HTMLElement,
  filename: string = 'download.png'
): Promise<void> {
  try {
    const dataUrl = await toPng(element, {
      backgroundColor: '#000000',
      pixelRatio: 2, // Higher resolution (2x)
      cacheBust: true,
    });

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Failed to generate PNG:', error);
    throw error;
  }
}

/**
 * Download a DOM element as a PDF
 */
export async function downloadAsPDF(
  element: HTMLElement,
  filename: string = 'download.pdf',
  orientation: 'portrait' | 'landscape' = 'portrait'
): Promise<void> {
  try {
    const dataUrl = await toPng(element, {
      backgroundColor: '#000000',
      pixelRatio: 2,
      cacheBust: true,
    });

    // Create an image to get dimensions
    const img = new Image();
    img.src = dataUrl;
    await new Promise((resolve) => {
      img.onload = resolve;
    });

    const imgWidth = img.width;
    const imgHeight = img.height;

    // A4 dimensions in mm
    const pdfWidth = orientation === 'portrait' ? 210 : 297;
    const pdfHeight = orientation === 'portrait' ? 297 : 210;

    // Calculate scaling to fit image in PDF
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const scaledWidth = imgWidth * ratio;
    const scaledHeight = imgHeight * ratio;

    // Center the image
    const x = (pdfWidth - scaledWidth) / 2;
    const y = (pdfHeight - scaledHeight) / 2;

    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
    });

    pdf.addImage(dataUrl, 'PNG', x, y, scaledWidth, scaledHeight);
    pdf.save(filename);
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    throw error;
  }
}

/**
 * Download the graph canvas as PNG
 */
export async function downloadGraphCanvasAsPNG(
  canvas: HTMLCanvasElement,
  filename: string = 'graph.png'
): Promise<void> {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
