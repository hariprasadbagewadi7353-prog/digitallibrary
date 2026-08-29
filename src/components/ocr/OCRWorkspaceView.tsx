import React from 'react';
import { ScanLine, ArrowLeft } from 'lucide-react';
import { OCRScannerComponent } from './OCRScannerComponent';
import { ExtractedMemberData, ExtractedBookData } from '../../types';

interface OCRWorkspaceViewProps {
  onNavigate: (route: string, id?: string, extraData?: any) => void;
}

export const OCRWorkspaceView: React.FC<OCRWorkspaceViewProps> = ({ onNavigate }) => {
  const handleUseForMember = (data: ExtractedMemberData) => {
    onNavigate('members/add', undefined, { initialMemberData: data });
  };

  const handleUseForBook = (data: ExtractedBookData) => {
    onNavigate('books/add', undefined, { initialBookData: data });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-5 md:p-6 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <ScanLine className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">
                Government Document OCR Digitization Desk
              </h1>
              <p className="text-xs text-slate-500">
                Scan physical student membership admission forms and handwritten book accession cards via camera or image upload.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
        <OCRScannerComponent
          onUseForMember={handleUseForMember}
          onUseForBook={handleUseForBook}
        />
      </div>
    </div>
  );
};
