
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PDFExporterProps {
  elementId: string;
  filename?: string;
  className?: string;
  children?: React.ReactNode;
}

export function PDFExporter({ 
  elementId, 
  filename = 'roteiro-viagem.pdf', 
  className = "",
  children 
}: PDFExporterProps) {
  const [isExporting, setIsExporting] = React.useState(false);

  const exportToPDF = async () => {
    setIsExporting(true);
    
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        console.error(`Elemento com ID '${elementId}' não encontrado`);
        return;
      }

      // Configurações para melhor qualidade
      const canvas = await html2canvas(element, {
        scale: 2, // Melhor qualidade
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Criar PDF
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      // Se a imagem for muito alta, adicionar páginas extras
      if (imgHeight * ratio > pdfHeight) {
        let position = pdfHeight;
        const pageHeight = pdfHeight;
        
        while (position < imgHeight * ratio) {
          pdf.addPage();
          const remainingHeight = imgHeight * ratio - position;
          const currentPageHeight = Math.min(pageHeight, remainingHeight);
          
          pdf.addImage(
            imgData, 
            'PNG', 
            imgX, 
            -position, 
            imgWidth * ratio, 
            imgHeight * ratio
          );
          
          position += pageHeight;
        }
      }

      // Download do arquivo
      pdf.save(filename);
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={exportToPDF}
      disabled={isExporting}
      className={`bg-[#667EEA] hover:bg-[#667EEA]/90 text-white ${className}`}
    >
      {isExporting ? (
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
      ) : (
        <Download className="w-4 h-4 mr-2" />
      )}
      {children || (isExporting ? 'Gerando PDF...' : 'Exportar como PDF')}
    </Button>
  );
}
