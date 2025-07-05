import React, { useRef } from 'react';
import { CameraIcon, UploadIcon } from './common/Icons';

interface ReceiptScannerProps {
  onScan: (imageData: string) => void;
  onManualEntry: () => void;
}

export const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ onScan, onManualEntry }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          onScan(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="text-center p-8 bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-2 text-text-primary-light dark:text-text-primary-dark">Dividir una cuenta</h2>
      <p className="text-text-secondary-light dark:text-text-secondary-dark mb-8">Escanea un recibo para empezar o introduce los artículos manualmente.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleFileChange} className="hidden" />
        <button
          onClick={() => cameraInputRef.current?.click()}
          className="flex flex-col items-center justify-center p-6 bg-primary-light text-white rounded-lg shadow-md hover:bg-primary-light/90 dark:bg-primary-dark dark:hover:bg-primary-dark/90 transition-all duration-300 transform hover:scale-105 hover:shadow-neon-primary"
        >
          <CameraIcon className="w-12 h-12 mb-2" />
          <span className="font-semibold">Usar cámara</span>
        </button>
        
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center p-6 bg-secondary-light text-background-dark rounded-lg shadow-md hover:bg-secondary-light/90 dark:bg-secondary-dark dark:hover:bg-secondary-dark/90 transition-all duration-300 transform hover:scale-105 hover:shadow-neon-secondary"
        >
          <UploadIcon className="w-12 h-12 mb-2" />
          <span className="font-semibold">Subir imagen</span>
        </button>
      </div>

      <div className="mt-8">
        <button
          onClick={onManualEntry}
          className="text-primary-light dark:text-primary-dark hover:underline"
        >
          O introducir los artículos manualmente
        </button>
      </div>
    </div>
  );
};