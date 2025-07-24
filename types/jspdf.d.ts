import 'jspdf';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: {
      head: string[][];
      body: string[][];
      startY?: number;
      styles?: {
        font: string;
        fontSize: number;
        cellPadding: number;
        lineColor: number[];
        lineWidth: number;
      };
      headStyles?: {
        fillColor: number[];
      };
    }) => void;
  }
}
