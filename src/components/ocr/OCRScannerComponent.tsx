import React, { useState, useRef, useEffect } from 'react';
import { createWorker } from 'tesseract.js';
import {
  Camera,
  Upload,
  RotateCw,
  Sliders,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  UserPlus,
  BookPlus,
  FileText,
  Copy,
  ScanLine,
  Eye,
  Trash2,
  Layers,
  Image as ImageIcon
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { ExtractedMemberData, ExtractedBookData } from '../../types';

interface OCRScannerComponentProps {
  initialMode?: 'GENERAL' | 'MEMBER' | 'BOOK';
  onUseForMember?: (data: ExtractedMemberData) => void;
  onUseForBook?: (data: ExtractedBookData) => void;
}

export const OCRScannerComponent: React.FC<OCRScannerComponentProps> = ({
  initialMode = 'GENERAL',
  onUseForMember,
  onUseForBook,
}) => {
  const { showToast } = useToast();

  // Mode: GENERAL | MEMBER | BOOK
  const [docType, setDocType] = useState<'MEMBER' | 'BOOK' | 'GENERAL'>(initialMode);
  const [ocrLanguage, setOcrLanguage] = useState<'eng' | 'kan' | 'eng+kan'>('eng+kan');

  // Input states: File vs Camera
  const [activeSource, setActiveSource] = useState<'upload' | 'camera'>('upload');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Image editing adjustments
  const [rotation, setRotation] = useState(0);
  const [grayscale, setGrayscale] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [inverted, setInverted] = useState(false);

  // OCR Processing
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatusText, setOcrStatusText] = useState('');
  const [rawOcrText, setRawOcrText] = useState('');

  // Extracted Entities (Editable)
  const [memberData, setMemberData] = useState<ExtractedMemberData>({
    student_name: '',
    registration_number: '',
    village: '',
    pincode: '',
    mobile: '',
    email: ''
  });

  const [bookData, setBookData] = useState<ExtractedBookData>({
    book_number: '',
    book_name: '',
    author: '',
    publisher: '',
    category: '',
    language: 'English',
    publication_year: '',
    isbn: '',
    description: ''
  });

  const [activeTab, setActiveTab] = useState<'extracted' | 'raw'>('extracted');

  // DOM Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera when unmounting or switching source
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setCameraError(null);
      stopCamera();

      // Check if browser supports mediaDevices
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported on this browser/environment. Please use file upload.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Prefer rear camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
      setActiveSource('camera');
    } catch (err: any) {
      console.warn('Camera stream request error:', err);
      const errMsg = err.name === 'NotAllowedError'
        ? 'Camera permission denied by browser. Please enable camera permission or use the file upload option.'
        : (err.message || 'Unable to access camera device.');
      setCameraError(errMsg);
      showToast('warning', 'Camera Note', errMsg);
      setActiveSource('upload');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      setImageSrc(dataUrl);
      stopCamera();
      setActiveSource('upload');
      showToast('info', 'Photo Captured', 'Image ready for preprocessing and OCR scan.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Invalid File', 'Please upload a valid image file (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      showToast('error', 'File Too Large', 'Please select an image smaller than 15MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImageSrc(event.target?.result as string);
      stopCamera();
      resetAdjustments();
      showToast('success', 'Image Uploaded', `${file.name} ready for OCR processing.`);
    };
    reader.readAsDataURL(file);
  };

  // Sample Old Government Library Records for Instant Testing
  const loadSampleRecord = (type: 'MEMBER' | 'BOOK') => {
    stopCamera();
    resetAdjustments();

    // Create a high-contrast simulated government catalog ledger card on canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 700;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background paper
    ctx.fillStyle = '#fbf8ee';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

    // Inner seal & header
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 26px serif';
    ctx.textAlign = 'center';
    ctx.fillText('GOVERNMENT OF KARNATAKA - DEPARTMENT OF PUBLIC LIBRARIES', canvas.width / 2, 80);

    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('CITY CENTRAL DIGITAL REPOSITORY & REGISTER ENTRY (ಗ್ರಾಮೀಣ ಗ್ರಂಥಾಲಯ)', canvas.width / 2, 115);

    ctx.beginPath();
    ctx.moveTo(60, 135);
    ctx.lineTo(canvas.width - 60, 135);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'left';

    if (type === 'MEMBER') {
      setDocType('MEMBER');
      ctx.font = 'bold 22px sans-serif';
      ctx.fillStyle = '#0f172a';

      ctx.fillText('MEMBERSHIP REGISTRATION RECORD / ಸದಸ್ಯತ್ವ ನೋಂದಣಿ', 70, 180);

      ctx.font = '20px monospace';
      ctx.fillStyle = '#1e293b';
      ctx.fillText('Registration No  : LIB-2026-00125', 80, 240);
      ctx.fillText('Student Name     : Ramesh Patil (ರಮೇಶ್ ಪಾಟೀಲ್)', 80, 300);
      ctx.fillText('Village / Town   : Gokak (ಗೋಕಾಕ್)', 80, 360);
      ctx.fillText('Pincode          : 591307', 80, 420);
      ctx.fillText('Mobile Number    : 9845123456', 80, 480);
      ctx.fillText('Email Address    : ramesh.patil2026@gmail.com', 80, 540);
      ctx.fillText('Date of Entry    : 12-01-2026', 80, 600);
    } else {
      setDocType('BOOK');
      ctx.font = 'bold 22px sans-serif';
      ctx.fillStyle = '#0f172a';

      ctx.fillText('BOOK ACCESSION & CATALOG REGISTER / ಗ್ರಂಥ ದಾಖಲಾತಿ', 70, 180);

      ctx.font = '20px monospace';
      ctx.fillStyle = '#1e293b';
      ctx.fillText('Book Number      : B-001549', 80, 240);
      ctx.fillText('Book Title       : UPSC & KPSC General Studies Manual', 80, 300);
      ctx.fillText('Author           : Spectrum Editorial Board', 80, 360);
      ctx.fillText('Publisher        : Spectrum Books New Delhi', 80, 420);
      ctx.fillText('Category         : Competitive Exams', 80, 480);
      ctx.fillText('Language         : English', 80, 530);
      ctx.fillText('Publication Year : 2025', 80, 580);
      ctx.fillText('ISBN             : 978-8179308123', 80, 630);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setImageSrc(dataUrl);
    showToast('info', 'Sample Loaded', `Loaded sample physical library ${type.toLowerCase()} record for testing.`);
  };

  const resetAdjustments = () => {
    setRotation(0);
    setGrayscale(false);
    setHighContrast(false);
    setInverted(false);
  };

  // Get adjusted image canvas for OCR
  const getProcessedCanvas = (): Promise<HTMLCanvasElement> => {
    return new Promise((resolve, reject) => {
      if (!imageSrc) return reject(new Error('No image loaded'));

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const isRotated90or270 = rotation === 90 || rotation === 270;
        canvas.width = isRotated90or270 ? img.height : img.width;
        canvas.height = isRotated90or270 ? img.width : img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context error'));

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        ctx.restore();

        // Pixel filters: Grayscale, High-Contrast Binarization, Invert
        if (grayscale || highContrast || inverted) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          for (let i = 0; i < data.length; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];

            // Grayscale
            let gray = 0.299 * r + 0.587 * g + 0.114 * b;

            // High contrast thresholding
            if (highContrast) {
              gray = gray > 128 ? 255 : 0;
            }

            // Invert
            if (inverted) {
              gray = 255 - gray;
            }

            data[i] = gray;
            data[i + 1] = gray;
            data[i + 2] = gray;
          }
          ctx.putImageData(imageData, 0, 0);
        }

        resolve(canvas);
      };
      img.onerror = reject;
      img.src = imageSrc;
    });
  };

  // Run Tesseract.js OCR
  const runOCR = async () => {
    if (!imageSrc) {
      showToast('warning', 'No Image', 'Please capture a photo or upload an image to scan.');
      return;
    }

    setIsProcessing(true);
    setOcrProgress(5);
    setOcrStatusText('Initializing OCR Neural Worker...');

    try {
      const processedCanvas = await getProcessedCanvas();
      setOcrProgress(20);
      setOcrStatusText(`Loading OCR model (${ocrLanguage})...`);

      // Initialize Tesseract worker
      const worker = await createWorker(ocrLanguage);

      setOcrProgress(40);
      setOcrStatusText('Scanning characters and layout text...');

      const ret = await worker.recognize(processedCanvas);
      const text = ret.data.text || '';
      setRawOcrText(text);

      setOcrProgress(80);
      setOcrStatusText('Extracting fields & validating patterns...');

      await worker.terminate();

      // Post text to backend parser to extract structured entities
      const parseRes = await fetch('/api/ocr/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          type: docType === 'GENERAL' ? 'MEMBER' : docType,
        })
      });

      const parseData = await parseRes.json();
      const extracted = parseData.extracted_data || {};

      if (docType === 'MEMBER' || (docType === 'GENERAL' && (extracted.registration_number || extracted.student_name))) {
        setDocType('MEMBER');
        setMemberData({
          student_name: extracted.student_name || '',
          registration_number: extracted.registration_number || '',
          village: extracted.village || '',
          pincode: extracted.pincode || '',
          mobile: extracted.mobile || '',
          email: extracted.email || ''
        });
      } else {
        setDocType('BOOK');
        setBookData({
          book_number: extracted.book_number || '',
          book_name: extracted.book_name || '',
          author: extracted.author || '',
          publisher: extracted.publisher || '',
          category: extracted.category || '',
          language: extracted.language || 'English',
          publication_year: extracted.publication_year || '',
          isbn: extracted.isbn || '',
          description: extracted.description || ''
        });
      }

      // Log OCR scan in audit system
      fetch('/api/ocr/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ocr_text: text,
          document_type: docType === 'BOOK' ? 'BOOK_RECORD' : 'MEMBER_RECORD',
          extracted_data: extracted,
          verified: false
        })
      }).catch(console.error);

      setOcrProgress(100);
      setOcrStatusText('OCR Extraction Completed!');
      setActiveTab('extracted');
      showToast('success', 'OCR Scan Succeeded', 'Extracted fields are ready for librarian review and edits.');
    } catch (err: any) {
      console.error('OCR Error:', err);
      showToast('error', 'OCR Error', err.message || 'Failed to complete OCR recognition.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUseForMemberAction = () => {
    if (onUseForMember) {
      onUseForMember(memberData);
    } else {
      showToast('info', 'Member Fields Ready', 'Please proceed to Member Registration to save.');
    }
  };

  const handleUseForBookAction = () => {
    if (onUseForBook) {
      onUseForBook(bookData);
    } else {
      showToast('info', 'Book Fields Ready', 'Please proceed to Book Cataloging to save.');
    }
  };

  return (
    <div id="ocr-scanner-root" className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white rounded-2xl p-5 md:p-6 shadow-xs border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                <ScanLine className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 leading-snug">
                  Digital Document OCR Scanner
                </h2>
                <p className="text-xs text-slate-500">
                  Digitize physical ledgers, membership registers & book accession records (Kannada + English).
                </p>
              </div>
            </div>
          </div>

          {/* Preset Samples for Fast Testing */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Quick Test:</span>
            <button
              onClick={() => loadSampleRecord('MEMBER')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-colors"
            >
              📄 Sample Member Ledger
            </button>
            <button
              onClick={() => loadSampleRecord('BOOK')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-colors"
            >
              📚 Sample Book Card
            </button>
          </div>
        </div>

        {/* Mode Selector & OCR Language */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Target Record Type
            </label>
            <div className="flex rounded-lg border border-slate-200 p-1 bg-slate-50">
              <button
                type="button"
                onClick={() => setDocType('MEMBER')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  docType === 'MEMBER' ? 'bg-white text-amber-700 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Member Card
              </button>
              <button
                type="button"
                onClick={() => setDocType('BOOK')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  docType === 'BOOK' ? 'bg-white text-amber-700 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Book Catalog
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              OCR Engine Language
            </label>
            <select
              value={ocrLanguage}
              onChange={(e) => setOcrLanguage(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-amber-500"
            >
              <option value="eng+kan">Kannada + English (ಕನ್ನಡ + ಇಂಗ್ಲಿಷ್)</option>
              <option value="eng">English Only</option>
              <option value="kan">Kannada Only (ಕನ್ನಡ ಮಾತ್ರ)</option>
            </select>
          </div>

          <div className="sm:col-span-2 flex items-end gap-2">
            <button
              onClick={runOCR}
              disabled={!imageSrc || isProcessing}
              className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Processing OCR...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>Start OCR Extraction</span>
                </>
              )}
            </button>

            {imageSrc && (
              <button
                onClick={() => { setImageSrc(null); setRawOcrText(''); }}
                className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 transition-colors"
                title="Clear Image"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Workspace: Capture/Preview on Left, Extracted Fields on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image Capture & Preprocessing (5 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200">
            {/* Source Tab: Camera vs Upload */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-slate-500" />
                <span>Document Input</span>
              </h3>

              <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-100">
                <button
                  type="button"
                  onClick={() => { stopCamera(); setActiveSource('upload'); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    activeSource === 'upload' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload File</span>
                </button>

                <button
                  type="button"
                  onClick={startCamera}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    activeSource === 'camera' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Use Camera</span>
                </button>
              </div>
            </div>

            {/* Live Camera View */}
            {activeSource === 'camera' && isCameraActive && (
              <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Document alignment frame guide */}
                <div className="absolute inset-4 border-2 border-dashed border-amber-400/70 rounded-lg pointer-events-none flex flex-col justify-between p-3">
                  <span className="text-[11px] bg-slate-900/80 text-amber-300 px-2 py-0.5 rounded font-mono self-start">
                    Align document text inside this frame
                  </span>
                  <span className="text-[10px] text-white/70 text-center">
                    Hold camera still with adequate lighting
                  </span>
                </div>

                {/* Capture button overlay */}
                <button
                  onClick={capturePhoto}
                  className="absolute bottom-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5 rounded-full text-xs shadow-lg active:scale-95 transition-all flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capture Photo</span>
                </button>
              </div>
            )}

            {/* Camera Error Message */}
            {cameraError && activeSource === 'camera' && !isCameraActive && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-semibold">Camera Access Note:</p>
                  <p className="mt-0.5">{cameraError}</p>
                  <p className="mt-2 text-slate-600 font-medium">
                    You can simply upload a photo or use the "Sample Member/Book" buttons above.
                  </p>
                </div>
              </div>
            )}

            {/* Upload Area / Image Preview */}
            {(!isCameraActive || activeSource === 'upload') && (
              <div>
                {!imageSrc ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-xl p-8 text-center cursor-pointer bg-slate-50/50 hover:bg-amber-50/20 transition-all group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="font-bold text-sm text-slate-800">
                      Click to upload or drag & drop document image
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Supports JPG, PNG, WEBP up to 15MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative bg-slate-900 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center max-h-[380px]">
                      <img
                        src={imageSrc}
                        alt="Document Preview"
                        className={`max-h-[380px] w-auto object-contain transition-transform duration-200 ${
                          grayscale ? 'grayscale' : ''
                        } ${highContrast ? 'contrast-200 brightness-90' : ''} ${
                          inverted ? 'invert' : ''
                        }`}
                        style={{ transform: `rotate(${rotation}deg)` }}
                      />
                    </div>

                    {/* Preprocessing Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setRotation((prev) => (prev + 90) % 360)}
                          className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-lg border border-slate-200 flex items-center gap-1.5 transition-colors"
                          title="Rotate 90 degrees"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                          <span>Rotate</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setGrayscale(!grayscale)}
                          className={`px-2.5 py-1.5 font-semibold rounded-lg border transition-colors ${
                            grayscale ? 'bg-slate-800 text-white border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          Grayscale
                        </button>

                        <button
                          type="button"
                          onClick={() => setHighContrast(!highContrast)}
                          className={`px-2.5 py-1.5 font-semibold rounded-lg border transition-colors ${
                            highContrast ? 'bg-slate-800 text-white border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          High Contrast
                        </button>

                        <button
                          type="button"
                          onClick={() => setInverted(!inverted)}
                          className={`px-2.5 py-1.5 font-semibold rounded-lg border transition-colors ${
                            inverted ? 'bg-slate-800 text-white border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          Invert
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={resetAdjustments}
                        className="text-slate-500 hover:text-slate-800 text-[11px] font-medium"
                      >
                        Reset Filters
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* OCR Progress Bar */}
          {isProcessing && (
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-amber-200 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
                <span className="flex items-center gap-1.5 text-amber-700">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  {ocrStatusText}
                </span>
                <span>{ocrProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${ocrProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Editable Verified Result Form (7 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200">
            {/* View Tabs */}
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('extracted')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    activeTab === 'extracted'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300/60'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Structured Editable Fields
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('raw')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    activeTab === 'raw'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300/60'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Raw OCR Text
                </button>
              </div>

              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                Librarian Verification Mandate
              </span>
            </div>

            {/* Warning / Verification notice */}
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-amber-900 text-xs mb-4 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">OCR Assistant Mode: </span>
                <span>
                  Please verify each field before saving. You can edit any field if handwriting or print was unclear.
                </span>
              </div>
            </div>

            {/* TAB 1: EXTRACTED STRUCTURED FIELDS */}
            {activeTab === 'extracted' && (
              <div>
                {docType === 'MEMBER' ? (
                  /* MEMBER FORM FIELDS */
                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Student / Patron Full Name *
                      </label>
                      <input
                        type="text"
                        value={memberData.student_name}
                        onChange={(e) => setMemberData({ ...memberData, student_name: e.target.value })}
                        placeholder="Could not confidently recognize this field. Please enter manually."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Registration Number *
                        </label>
                        <input
                          type="text"
                          value={memberData.registration_number}
                          onChange={(e) => setMemberData({ ...memberData, registration_number: e.target.value })}
                          placeholder="e.g. LIB-2026-00125"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Village / Town *
                        </label>
                        <input
                          type="text"
                          value={memberData.village}
                          onChange={(e) => setMemberData({ ...memberData, village: e.target.value })}
                          placeholder="e.g. Gokak / Konnur"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Pincode (6 digits)
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          value={memberData.pincode}
                          onChange={(e) => setMemberData({ ...memberData, pincode: e.target.value })}
                          placeholder="591307"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 font-mono"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Mobile Number (10 digits)
                        </label>
                        <input
                          type="text"
                          maxLength={10}
                          value={memberData.mobile}
                          onChange={(e) => setMemberData({ ...memberData, mobile: e.target.value })}
                          placeholder="9845123456"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={memberData.email}
                        onChange={(e) => setMemberData({ ...memberData, email: e.target.value })}
                        placeholder="example@domain.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    {/* Action Bar for Member Save */}
                    <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setMemberData({ student_name: '', registration_number: '', village: '', pincode: '', mobile: '', email: '' })}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 py-2 px-3 rounded-lg hover:bg-slate-100"
                      >
                        Clear Fields
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleUseForMemberAction}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs shadow-xs transition-colors flex items-center gap-2"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>Use for Member Registration</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* BOOK FORM FIELDS */
                  <div className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Book / Accession Number *
                        </label>
                        <input
                          type="text"
                          value={bookData.book_number}
                          onChange={(e) => setBookData({ ...bookData, book_number: e.target.value })}
                          placeholder="e.g. B-001549"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Language
                        </label>
                        <select
                          value={bookData.language}
                          onChange={(e) => setBookData({ ...bookData, language: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500"
                        >
                          <option value="English">English</option>
                          <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                          <option value="Hindi">Hindi</option>
                          <option value="Sanskrit">Sanskrit</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Book Title / Name *
                      </label>
                      <input
                        type="text"
                        value={bookData.book_name}
                        onChange={(e) => setBookData({ ...bookData, book_name: e.target.value })}
                        placeholder="Could not confidently recognize this field. Please enter manually."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Author *
                        </label>
                        <input
                          type="text"
                          value={bookData.author}
                          onChange={(e) => setBookData({ ...bookData, author: e.target.value })}
                          placeholder="Author Name"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Publisher
                        </label>
                        <input
                          type="text"
                          value={bookData.publisher}
                          onChange={(e) => setBookData({ ...bookData, publisher: e.target.value })}
                          placeholder="Publisher Name"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Publication Year
                        </label>
                        <input
                          type="text"
                          value={bookData.publication_year}
                          onChange={(e) => setBookData({ ...bookData, publication_year: e.target.value })}
                          placeholder="e.g. 2025"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          ISBN
                        </label>
                        <input
                          type="text"
                          value={bookData.isbn}
                          onChange={(e) => setBookData({ ...bookData, isbn: e.target.value })}
                          placeholder="978-..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 font-mono"
                        />
                      </div>
                    </div>

                    {/* Action Bar for Book Save */}
                    <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setBookData({ book_number: '', book_name: '', author: '', publisher: '', category: '', language: 'English', publication_year: '', isbn: '', description: '' })}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 py-2 px-3 rounded-lg hover:bg-slate-100"
                      >
                        Clear Fields
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleUseForBookAction}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs shadow-xs transition-colors flex items-center gap-2"
                        >
                          <BookPlus className="w-4 h-4" />
                          <span>Use for Book Cataloging</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: RAW OCR TEXT */}
            {activeTab === 'raw' && (
              <div className="space-y-3">
                <div className="relative">
                  <textarea
                    rows={12}
                    value={rawOcrText}
                    onChange={(e) => setRawOcrText(e.target.value)}
                    placeholder="Raw OCR extracted characters and lines will appear here..."
                    className="w-full bg-slate-950 text-emerald-400 font-mono text-xs p-4 rounded-xl border border-slate-800 focus:ring-2 focus:ring-amber-500 leading-relaxed"
                  />
                  {rawOcrText && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(rawOcrText);
                        showToast('info', 'Copied', 'OCR text copied to clipboard.');
                      }}
                      className="absolute top-3 right-3 bg-slate-800/80 hover:bg-slate-700 text-slate-300 p-1.5 rounded-md border border-slate-700 text-xs flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Tip: You can re-parse the raw text after fixing any character misrecognitions.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
