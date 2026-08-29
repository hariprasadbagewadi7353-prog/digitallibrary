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
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 md:p-6 shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              <ScanLine className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                Government Document OCR Digitization Desk
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Scan physical student membership admission forms and handwritten book accession cards via camera or image upload.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 transition-colors">
        <OCRScannerComponent
          onUseForMember={handleUseForMember}
          onUseForBook={handleUseForBook}
        />
      </div>
    </div>
  );
};
