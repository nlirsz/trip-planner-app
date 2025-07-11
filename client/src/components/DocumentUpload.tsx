import { useState, useRef } from "react";
import { Upload, File, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface DocumentUploadProps {
  onUpload: (file: File, type: string) => void;
  tripId?: number;
}

export function DocumentUpload({ onUpload, tripId }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      const validSize = file.size <= 10 * 1024 * 1024; // 10MB
      
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported file type.`,
          variant: "destructive",
        });
        return false;
      }
      
      if (!validSize) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 10MB.`,
          variant: "destructive",
        });
        return false;
      }
      
      return true;
    });
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', getDocumentType(file.name));
        if (tripId) {
          formData.append('tripId', tripId.toString());
        }

        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }
      }

      toast({
        title: "Upload successful",
        description: `${selectedFiles.length} file(s) uploaded successfully.`,
      });

      setSelectedFiles([]);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload files. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getDocumentType = (filename: string): string => {
    const name = filename.toLowerCase();
    if (name.includes('passport')) return 'passport';
    if (name.includes('visa')) return 'visa';
    if (name.includes('insurance')) return 'insurance';
    if (name.includes('booking') || name.includes('reservation')) return 'booking';
    if (name.includes('flight')) return 'flight';
    return 'other';
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          isDragging
            ? 'border-[#667EEA]/50 bg-[#667EEA]/5'
            : 'border-white/30 hover:border-[#667EEA]/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="mb-4">
          <Upload className="w-12 h-12 text-[#1A202C]/40 mx-auto" />
        </div>
        <p className="text-[#1A202C]/60 mb-2">Drag and drop files here or click to browse</p>
        <p className="text-[#1A202C]/40 text-sm">Supports PDF, JPG, PNG files up to 10MB</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          className="mt-4 bg-[#667EEA] hover:bg-[#667EEA]/90"
        >
          Choose Files
        </Button>
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-[#1A202C]">Selected Files</h4>
          {selectedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-white/30 rounded-lg">
              <div className="flex items-center">
                <File className="w-5 h-5 text-[#667EEA] mr-3" />
                <div>
                  <p className="font-medium text-[#1A202C]">{file.name}</p>
                  <p className="text-sm text-[#1A202C]/60">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            onClick={handleUpload}
            className="w-full bg-[#667EEA] hover:bg-[#667EEA]/90"
          >
            Upload {selectedFiles.length} File(s)
          </Button>
        </div>
      )}
    </div>
  );
}
