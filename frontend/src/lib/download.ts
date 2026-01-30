/**
 * Utility functions for downloading content as images or PDFs
 */

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Download a DOM element as a PNG image
 */
export async function downloadAsPNG(
  element: HTMLElement,
  filename: string = 'download.png'
): Promise<void> {
  // Suppress console errors from html2canvas about lab() colors
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    if (!message.includes('lab') && !message.includes('color function')) {
      originalError(...args);
    }
  };

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#000000',
      scale: 2, // Higher resolution
      logging: false,
      useCORS: true,
    });

    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } finally {
    // Restore original console.error
    console.error = originalError;
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
  // Suppress console errors from html2canvas about lab() colors
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    if (!message.includes('lab') && !message.includes('color function')) {
      originalError(...args);
    }
  };

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#000000',
      scale: 2,
      logging: false,
      useCORS: true,
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

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

    pdf.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight);
    pdf.save(filename);
  } finally {
    // Restore original console.error
    console.error = originalError;
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
