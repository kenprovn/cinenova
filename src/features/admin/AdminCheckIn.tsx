import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  Camera,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Clock,
  RotateCcw,
  CameraOff
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { bookingService } from '../../services/bookingService';
import { CheckInResult } from '../../types';

export const AdminCheckIn: React.FC = () => {
  const [manualCode, setManualCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [recentScans, setRecentScans] = useState<any[]>([]);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'cinenova-qr-reader';

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleScanSuccess = async (decodedText: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    // Pause or beep if needed
    const res = await bookingService.checkInTicket(decodedText);
    setIsProcessing(false);
    setResult(res);

    if (res.ticket) {
      setRecentScans((prev) => [
        { ...res.ticket, timestamp: new Date().toLocaleTimeString('vi-VN'), success: res.success },
        ...prev.slice(0, 9),
      ]);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(readerElementId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
      }

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        handleScanSuccess,
        () => {
          // Ignore scanning frames without QR
        }
      );
      setIsCameraActive(true);
    } catch (err: any) {
      setCameraError(
        'Không thể mở camera. Vui lòng cấp quyền truy cập máy ảnh cho trình duyệt hoặc nhập mã vé thủ công.'
      );
      setIsCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsCameraActive(false);
  };

  const handleManualCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = manualCode.trim();
    if (!trimmed) return;

    setIsProcessing(true);
    setResult(null);

    // If starts with CNQR- it is a QR token, else treat as ticket code
    const res = trimmed.startsWith('CNQR-')
      ? await bookingService.checkInTicket(trimmed)
      : await bookingService.checkInTicketByCode(trimmed);

    setIsProcessing(false);
    setResult(res);

    if (res.ticket) {
      setRecentScans((prev) => [
        { ...res.ticket, timestamp: new Date().toLocaleTimeString('vi-VN'), success: res.success },
        ...prev.slice(0, 9),
      ]);
    }
    setManualCode('');
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div>
        <h1 className="heading-font text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
          <QrCode className="w-8 h-8 text-primary" />
          <span>Soát Vé QR Điện Tử (Gate Check-In)</span>
        </h1>
        <p className="text-xs sm:text-sm text-cinetext-secondary mt-1">
          Hệ thống quét mã QR thời gian thực tại cửa phòng chiếu dành cho Quản trị viên & Nhân viên soát vé
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Camera Scanner & Manual Input */}
        <div className="space-y-6">
          {/* Camera Scanner Box */}
          <div className="bg-surface rounded-2xl border border-surface-border p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-gold" />
                <span>Máy Quét Camera</span>
              </span>
              {isCameraActive ? (
                <button
                  onClick={stopCamera}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold hover:bg-rose-500/30 transition-colors"
                >
                  <CameraOff className="w-3.5 h-3.5" />
                  <span>Tắt Camera</span>
                </button>
              ) : (
                <button
                  onClick={startCamera}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-glow-primary transition-all active:scale-95"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Bật Camera Quét</span>
                </button>
              )}
            </div>

            {/* Camera Viewport Element */}
            <div className="relative w-full aspect-square max-w-sm mx-auto bg-black rounded-xl overflow-hidden border border-surface-border flex items-center justify-center">
              <div id={readerElementId} className="w-full h-full" />
              {!isCameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-surface-light/80">
                  <QrCode className="w-16 h-16 text-cinetext-muted opacity-40 animate-pulse" />
                  <p className="text-xs text-cinetext-secondary">
                    Camera đang tắt. Bấm nút <strong>"Bật Camera Quét"</strong> hoặc nhập mã vé thủ công bên dưới.
                  </p>
                </div>
              )}
              {isProcessing && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                  <div className="flex items-center gap-2 bg-surface px-4 py-2 rounded-xl border border-gold text-gold text-xs font-bold animate-pulse">
                    <span>Đang xác thực với PostgreSQL...</span>
                  </div>
                </div>
              )}
            </div>

            {cameraError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}
          </div>

          {/* Manual Code Form */}
          <div className="bg-surface rounded-2xl border border-surface-border p-5 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-cinetext-muted">
              Nhập Mã Vé Thủ Công Để Kiểm Thử
            </h2>

            <form onSubmit={handleManualCheckIn} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cinetext-muted" />
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Ví dụ: TKT-A8F2 hoặc CNQR-..."
                  className="w-full bg-surface-light border border-surface-border text-white text-xs rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-primary placeholder:text-cinetext-muted font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing || !manualCode.trim()}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                  manualCode.trim()
                    ? 'bg-primary hover:bg-primary-hover text-white shadow-glow-primary active:scale-95'
                    : 'bg-surface-light text-cinetext-muted cursor-not-allowed'
                }`}
              >
                Kiểm tra
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Scan Result & Session History */}
        <div className="space-y-6">
          {/* Result Card */}
          {result && (
            <div
              className={`rounded-2xl border p-6 space-y-5 animate-fade-in ${
                result.success
                  ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300'
                  : result.code === 'ALREADY_USED'
                  ? 'bg-amber-950/30 border-amber-500/50 text-amber-300'
                  : 'bg-rose-950/30 border-rose-500/50 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-3">
                {result.success ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                ) : result.code === 'ALREADY_USED' ? (
                  <Clock className="w-8 h-8 text-amber-400 shrink-0" />
                ) : (
                  <XCircle className="w-8 h-8 text-rose-400 shrink-0" />
                )}
                <div>
                  <h3 className="font-bold text-lg text-white">
                    {result.success
                      ? 'SOÁT VÉ THÀNH CÔNG!'
                      : result.code === 'ALREADY_USED'
                      ? 'VÉ ĐÃ ĐƯỢC CHECK-IN TRƯỚC ĐÓ!'
                      : 'VÉ KHÔNG HỢP LỆ!'}
                  </h3>
                  <p className="text-xs">{result.message}</p>
                </div>
              </div>

              {/* Ticket Details when available */}
              {result.ticket && (
                <div className="bg-surface/80 rounded-xl p-4 border border-surface-border text-xs text-cinetext-secondary space-y-3">
                  <div className="flex items-center justify-between border-b border-surface-border pb-2">
                    <span className="font-bold text-white text-sm">{result.ticket.movie_title}</span>
                    <span className="bg-primary/20 text-white border border-primary/40 px-2 py-0.5 rounded text-[11px] font-bold">
                      Ghế {result.ticket.seat_number}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-cinetext-muted block">Rạp & Phòng:</span>
                      <span className="text-white font-medium">{result.ticket.cinema_name} ({result.ticket.hall_name})</span>
                    </div>
                    <div>
                      <span className="text-cinetext-muted block">Mã vé / Đơn:</span>
                      <span className="text-gold font-mono font-bold">{result.ticket.ticket_code} ({result.ticket.booking_code})</span>
                    </div>
                    {result.ticket.customer_name && (
                      <div>
                        <span className="text-cinetext-muted block">Khách hàng:</span>
                        <span className="text-white font-medium">{result.ticket.customer_name}</span>
                      </div>
                    )}
                    {result.ticket.customer_phone && (
                      <div>
                        <span className="text-cinetext-muted block">Điện thoại:</span>
                        <span className="text-white font-medium">{result.ticket.customer_phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Session History */}
          <div className="bg-surface rounded-2xl border border-surface-border p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cinetext-muted flex items-center justify-between">
              <span>Lịch Sử Soát Vé Trong Phiên ({recentScans.length})</span>
              {recentScans.length > 0 && (
                <button
                  onClick={() => setRecentScans([])}
                  className="text-[11px] text-cinetext-muted hover:text-white flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Xóa</span>
                </button>
              )}
            </h3>

            {recentScans.length === 0 ? (
              <p className="text-xs text-cinetext-muted italic py-6 text-center">
                Chưa có vé nào được quét trong phiên làm việc này.
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto divide-y divide-surface-border">
                {recentScans.map((scan, idx) => (
                  <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-white">
                        {scan.movie_title} – Ghế {scan.seat_number}
                      </p>
                      <p className="text-[11px] text-cinetext-muted">
                        Mã: <span className="font-mono">{scan.ticket_code}</span> • Lúc: {scan.timestamp}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        scan.success
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {scan.success ? 'Hợp lệ' : 'Đã check-in'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
