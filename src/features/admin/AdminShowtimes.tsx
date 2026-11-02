import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, X, AlertCircle, CheckCircle2, Clock, Sparkles, RotateCcw } from 'lucide-react';
import { MOCK_SHOWTIMES, MOCK_MOVIES, MOCK_CINEMAS } from '../../data/mockData';
import { formatCurrency } from '../../lib/utils';
import { showtimeService } from '../../services/showtimeService';
import { movieService } from '../../services/movieService';
import { cinemaService } from '../../services/cinemaService';
import { Showtime, Movie, Cinema, Room } from '../../types';

// Helper: Calculate end time from start time and movie duration
export function calculateEndTime(
  startTime: string,
  durationMinutes: number
): { endTime: string; isNextDay: boolean; duration: number } {
  if (!startTime || !durationMinutes || durationMinutes <= 0) {
    return { endTime: startTime || '00:00', isNextDay: false, duration: 0 };
  }

  const [hours, minutes] = startTime.split(':').map((v) => parseInt(v, 10) || 0);
  const totalStartMinutes = hours * 60 + minutes;
  const totalEndMinutes = totalStartMinutes + durationMinutes;

  const normalizedEndMinutes = totalEndMinutes % (24 * 60);
  const endHours = Math.floor(normalizedEndMinutes / 60);
  const endMins = normalizedEndMinutes % 60;

  const isNextDay = totalEndMinutes >= 24 * 60;
  const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;

  return { endTime, isNextDay, duration: durationMinutes };
}

// Helper: Build ISO strings with Asia/Ho_Chi_Minh (+07:00) handling midnight crossover
export function buildIsoTimestamps(
  date: string,
  startTime: string,
  endTime: string
): { startsAt: string; endsAt: string; durationMinutes: number; nextDay: boolean } {
  const [sh, sm] = startTime.split(':').map((v) => parseInt(v, 10) || 0);
  const [eh, em] = endTime.split(':').map((v) => parseInt(v, 10) || 0);

  const startTotal = sh * 60 + sm;
  let endTotal = eh * 60 + em;
  let nextDay = false;

  if (endTotal <= startTotal) {
    endTotal += 24 * 60;
    nextDay = true;
  }

  const durationMinutes = endTotal - startTotal;
  const startsAt = `${date}T${startTime}:00+07:00`;

  let endsAt: string;
  if (!nextDay) {
    endsAt = `${date}T${endTime}:00+07:00`;
  } else {
    const [year, month, day] = date.split('-').map(Number);
    const d = new Date(Date.UTC(year, month - 1, day));
    d.setUTCDate(d.getUTCDate() + 1);
    const nextYear = d.getUTCFullYear();
    const nextMonth = String(d.getUTCMonth() + 1).padStart(2, '0');
    const nextDayStr = String(d.getUTCDate()).padStart(2, '0');
    endsAt = `${nextYear}-${nextMonth}-${nextDayStr}T${endTime}:00+07:00`;
  }

  return { startsAt, endsAt, durationMinutes, nextDay };
}

export const AdminShowtimes: React.FC = () => {
  const [showtimes, setShowtimes] = useState<Showtime[]>(MOCK_SHOWTIMES);
  const [movies, setMovies] = useState<Movie[]>(MOCK_MOVIES);
  const [cinemas, setCinemas] = useState<Cinema[]>(MOCK_CINEMAS);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState<boolean>(false);
  const [roomError, setRoomError] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEndTimeManual, setIsEndTimeManual] = useState(false);

  // New showtime form state
  const [formData, setFormData] = useState({
    movieId: MOCK_MOVIES[0]?.id || '',
    cinemaId: MOCK_CINEMAS[0]?.id || '',
    roomId: '',
    hallName: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '19:00',
    endTime: '21:30',
    format: 'IMAX Laser' as '2D Digital' | '3D' | 'IMAX Laser',
    priceRegular: 140000,
    priceVip: 180000,
  });

  const loadData = () => {
    showtimeService.getShowtimes().then((res) => {
      if (res.data.length > 0) setShowtimes(res.data);
    });
    movieService.getMovies().then((res) => {
      if (res.data.length > 0) {
        setMovies(res.data);
      }
    });
    cinemaService.getCinemas().then((res) => {
      if (res.data.length > 0) {
        setCinemas(res.data);
      }
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerNotice = (text: string, type: 'success' | 'error' = 'success') => {
    setNotice({ text, type });
    setTimeout(() => setNotice(null), 3500);
  };

  const getMovieTitle = (movieId: string) => {
    return movies.find((m) => m.id === movieId)?.title || 'Phim đang cập nhật';
  };

  // Fetch rooms dynamically for a chosen cinema
  const fetchRoomsForCinema = async (cinemaId: string) => {
    if (!cinemaId) {
      setRooms([]);
      return;
    }
    setIsLoadingRooms(true);
    setRoomError(null);
    try {
      const res = await cinemaService.getRoomsByCinema(cinemaId);
      setRooms(res.data);
      if (res.data.length > 0) {
        const firstRoom = res.data[0];
        setFormData((prev) => ({
          ...prev,
          roomId: firstRoom.id,
          hallName: firstRoom.name,
          format: firstRoom.roomType === 'imax_laser' ? prev.format : (prev.format === 'IMAX Laser' ? '2D Digital' : prev.format),
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          roomId: '',
          hallName: '',
        }));
        setRoomError('Cụm rạp này hiện chưa có phòng chiếu hoạt động.');
      }
      if (res.error) {
        setRoomError(res.error);
      }
    } catch (err: any) {
      setRoomError(err.message || 'Lỗi khi tải danh sách phòng chiếu.');
      setRooms([]);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  // Open modal with smart default calculation and dynamic rooms
  const handleOpenAddModal = () => {
    const activeMovie = movies[0] || MOCK_MOVIES[0];
    const activeCinema = cinemas[0] || MOCK_CINEMAS[0];
    const defaultStartTime = '19:00';
    const duration = activeMovie?.duration || 120;
    const { endTime } = calculateEndTime(defaultStartTime, duration);

    const todayStr = new Date().toISOString().split('T')[0];

    setFormData({
      movieId: activeMovie?.id || '',
      cinemaId: activeCinema?.id || '',
      roomId: '',
      hallName: '',
      date: todayStr,
      startTime: defaultStartTime,
      endTime: endTime,
      format: 'IMAX Laser',
      priceRegular: 140000,
      priceVip: 180000,
    });
    setIsEndTimeManual(false);
    setShowAddModal(true);

    if (activeCinema?.id) {
      fetchRoomsForCinema(activeCinema.id);
    }
  };

  // Change Cinema -> reset & fetch rooms
  const handleCinemaChange = (newCinemaId: string) => {
    setFormData((prev) => ({
      ...prev,
      cinemaId: newCinemaId,
      roomId: '',
      hallName: '',
    }));
    fetchRoomsForCinema(newCinemaId);
  };

  // Change Movie -> auto calculate end time
  const handleMovieChange = (newMovieId: string) => {
    const movieObj = movies.find((m) => m.id === newMovieId);
    const duration = movieObj?.duration || 120;
    const { endTime } = calculateEndTime(formData.startTime, duration);

    setFormData((prev) => ({
      ...prev,
      movieId: newMovieId,
      endTime,
    }));
    setIsEndTimeManual(false);
  };

  // Change Start Time -> auto calculate end time
  const handleStartTimeChange = (newStartTime: string) => {
    const movieObj = movies.find((m) => m.id === formData.movieId) || movies[0];
    const duration = movieObj?.duration || 120;
    const { endTime } = calculateEndTime(newStartTime, duration);

    setFormData((prev) => ({
      ...prev,
      startTime: newStartTime,
      endTime,
    }));
    setIsEndTimeManual(false);
  };

  // Manual End Time modification
  const handleEndTimeChange = (newEndTime: string) => {
    setIsEndTimeManual(true);
    setFormData((prev) => ({
      ...prev,
      endTime: newEndTime,
    }));
  };

  // Reset End Time back to auto calculation
  const handleResetEndTimeAuto = () => {
    const movieObj = movies.find((m) => m.id === formData.movieId) || movies[0];
    const duration = movieObj?.duration || 120;
    const { endTime } = calculateEndTime(formData.startTime, duration);
    setFormData((prev) => ({ ...prev, endTime }));
    setIsEndTimeManual(false);
  };

  const handleCreateShowtime = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // 1. Room validation
    if (!formData.roomId) {
      setIsSubmitting(false);
      triggerNotice('Vui lòng chọn phòng chiếu hợp lệ trước khi tạo!', 'error');
      return;
    }

    // 2. Build full timestamps and calculate duration
    const selectedMovie = movies.find((m) => m.id === formData.movieId);
    const movieDuration = selectedMovie?.duration || 0;

    const { startsAt, endsAt, durationMinutes } = buildIsoTimestamps(
      formData.date,
      formData.startTime,
      formData.endTime
    );

    // 3. Start vs End time validation
    if (formData.endTime === formData.startTime) {
      setIsSubmitting(false);
      triggerNotice('Giờ kết thúc không được trùng với giờ bắt đầu chiếu!', 'error');
      return;
    }

    // 4. Movie duration validation
    if (movieDuration > 0 && durationMinutes < movieDuration) {
      setIsSubmitting(false);
      triggerNotice(
        `Thời lượng suất chiếu (${durationMinutes} phút) không được ngắn hơn thời lượng phim (${movieDuration} phút)!`,
        'error'
      );
      return;
    }

    // 5. Past showtime validation (allow 5-min grace buffer for clock skew)
    const startDateTimeMs = new Date(startsAt).getTime();
    const nowMs = Date.now();
    if (startDateTimeMs < nowMs - 5 * 60 * 1000) {
      setIsSubmitting(false);
      triggerNotice('Không thể tạo suất chiếu trong quá khứ! Vui lòng chọn ngày và giờ chiếu hợp lệ.', 'error');
      return;
    }

    // 5.1 Room & Format compatibility validation
    const chosenRoom = rooms.find((r) => r.id === formData.roomId);
    if (formData.format === 'IMAX Laser' && chosenRoom?.roomType !== 'imax_laser') {
      setIsSubmitting(false);
      triggerNotice(
        `Phòng "${chosenRoom?.name || 'được chọn'}" (loại: ${chosenRoom?.roomType || 'standard'}) không hỗ trợ định dạng IMAX Laser! Vui lòng chọn định dạng 2D Digital hoặc 3D.`,
        'error'
      );
      return;
    }

    // 6. Overlap validation & DB submission
    const res = await showtimeService.createShowtime({
      movieId: formData.movieId,
      roomId: formData.roomId,
      startsAt,
      endsAt,
      format: formData.format,
      priceRegular: Number(formData.priceRegular),
      priceVip: Number(formData.priceVip),
    });

    setIsSubmitting(false);

    if (res.error) {
      if (res.error.includes('trùng')) {
        triggerNotice(res.error, 'error');
        return;
      }
      // If DB error (e.g. offline), add to local state
      const selectedCinema = cinemas.find((c) => c.id === formData.cinemaId);
      const newLocalShowtime: Showtime = {
        id: `st-local-${Date.now()}`,
        movieId: formData.movieId,
        cinemaId: formData.cinemaId,
        cinemaName: selectedCinema?.name || 'CINENOVA Cinema',
        hallId: formData.roomId,
        hallName: formData.hallName,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        format: formData.format,
        priceRegular: Number(formData.priceRegular),
        priceVip: Number(formData.priceVip),
      };
      setShowtimes((prev) => [newLocalShowtime, ...prev]);
      setShowAddModal(false);
      triggerNotice(`Đã tạo suất chiếu (Bộ nhớ tạm: ${res.error})`, 'success');
    } else {
      setShowAddModal(false);
      triggerNotice('Tạo suất chiếu thành công trên PostgreSQL!', 'success');
      loadData();
    }
  };

  const handleCancelShowtime = async (st: Showtime) => {
    if (!confirm(`Bạn có chắc chắn muốn hủy suất chiếu lúc ${st.startTime} ngày ${st.date}?`)) return;

    const res = await showtimeService.cancelShowtime(st.id);
    if (res.error) {
      setShowtimes((prev) => prev.filter((s) => s.id !== st.id));
      triggerNotice('Đã hủy suất chiếu khỏi danh sách hiển thị', 'success');
    } else {
      triggerNotice('Hủy suất chiếu thành công trên Supabase!', 'success');
      loadData();
    }
  };

  // Compute live duration information for the modal
  const activeMovieObj = movies.find((m) => m.id === formData.movieId);
  const activeMovieDuration = activeMovieObj?.duration || 120;
  const currentCalc = buildIsoTimestamps(formData.date, formData.startTime, formData.endTime);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="heading-font text-2xl sm:text-3xl font-extrabold text-white">
            Quản Lý Suất Chiếu
          </h1>
          <p className="text-xs sm:text-sm text-cinetext-secondary mt-1">
            Điều phối lịch chiếu phim có kiểm tra chống trùng lịch tự động (Exclusion Constraint)
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-glow-primary transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo suất chiếu mới</span>
        </button>
      </div>

      {notice && (
        <div
          className={`px-4 py-3 rounded-xl border text-xs font-medium flex items-center gap-2 animate-fadeIn ${
            notice.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
              : 'bg-rose-500/15 border-rose-500/40 text-rose-400'
          }`}
        >
          {notice.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{notice.text}</span>
        </div>
      )}

      {/* Showtimes Table */}
      <div className="bg-surface rounded-2xl border border-surface-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-light text-cinetext-muted uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Phim</th>
                <th className="px-4 py-3">Cụm rạp</th>
                <th className="px-4 py-3">Phòng chiếu</th>
                <th className="px-4 py-3">Định dạng</th>
                <th className="px-4 py-3">Khung giờ</th>
                <th className="px-4 py-3">Giá vé (Thường / VIP)</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border text-cinetext-secondary">
              {showtimes.map((st) => (
                <tr key={st.id} className="hover:bg-surface-light/40 transition-colors">
                  <td className="px-4 py-3 font-bold text-white max-w-[200px] truncate">
                    {getMovieTitle(st.movieId)}
                  </td>
                  <td className="px-4 py-3">{st.cinemaName}</td>
                  <td className="px-4 py-3 text-cinetext-primary font-medium">{st.hallName}</td>
                  <td className="px-4 py-3">
                    <span className="bg-primary/20 text-primary border border-primary/40 px-2 py-0.5 rounded text-[10px] font-bold">
                      {st.format}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-gold">{st.startTime}</span>
                    <span className="text-cinetext-muted text-[11px]"> ~ {st.endTime} ({st.date})</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-white font-medium">{formatCurrency(st.priceRegular)}</span>
                    <span className="text-cinetext-muted"> / </span>
                    <span className="text-gold font-medium">{formatCurrency(st.priceVip)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleCancelShowtime(st)}
                      className="p-1.5 rounded-lg bg-surface-light hover:bg-rose-500/20 border border-surface-border text-cinetext-secondary hover:text-rose-400"
                      title="Hủy suất chiếu"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Showtime */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-surface-border p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Tạo Suất Chiếu Mới
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-cinetext-muted hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateShowtime} className="space-y-3.5 text-xs">
              <div>
                <label className="text-cinetext-secondary block font-medium mb-1">Chọn phim chiếu *</label>
                <select
                  value={formData.movieId}
                  onChange={(e) => handleMovieChange(e.target.value)}
                  className="w-full bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                >
                  {movies.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.duration} phút)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-cinetext-secondary block font-medium mb-1">Cụm rạp *</label>
                  <select
                    value={formData.cinemaId}
                    onChange={(e) => handleCinemaChange(e.target.value)}
                    className="w-full bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                  >
                    {cinemas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-cinetext-secondary block font-medium mb-1">Phòng chiếu *</label>
                  {isLoadingRooms ? (
                    <div className="w-full bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-cinetext-muted flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-[11px]">Đang tải...</span>
                    </div>
                  ) : (
                    <select
                      value={formData.roomId}
                      onChange={(e) => {
                        const selected = rooms.find((r) => r.id === e.target.value);
                        const isImax = selected?.roomType === 'imax_laser';
                        setFormData({
                          ...formData,
                          roomId: e.target.value,
                          hallName: selected?.name || formData.hallName,
                          format: !isImax && formData.format === 'IMAX Laser' ? '2D Digital' : formData.format,
                        });
                      }}
                      className="w-full bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                    >
                      {rooms.length > 0 ? (
                        rooms.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name} ({r.roomType})
                          </option>
                        ))
                      ) : (
                        <option value="">(Chưa có phòng chiếu)</option>
                      )}
                    </select>
                  )}
                  {roomError && !isLoadingRooms && (
                    <p className="text-[10px] text-rose-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{roomError}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-cinetext-secondary block font-medium mb-1">
                    Định dạng {rooms.find((r) => r.id === formData.roomId)?.roomType !== 'imax_laser' && (
                      <span className="text-[10px] text-cinetext-muted font-normal">(Phòng tiêu chuẩn)</span>
                    )}
                  </label>
                  <select
                    value={formData.format}
                    onChange={(e) => setFormData({ ...formData, format: e.target.value as any })}
                    className="w-full bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                  >
                    <option value="2D Digital">2D Digital</option>
                    <option value="3D">3D</option>
                    {rooms.find((r) => r.id === formData.roomId)?.roomType === 'imax_laser' && (
                      <option value="IMAX Laser">IMAX Laser</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-cinetext-secondary block font-medium mb-1">Ngày chiếu</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-cinetext-secondary block font-medium mb-1 flex items-center justify-between">
                    <span>Bắt đầu (Giờ:Phút)</span>
                    <Clock className="w-3 h-3 text-cinetext-muted" />
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleStartTimeChange(e.target.value)}
                    className="w-full bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary font-mono text-center"
                  />
                </div>
                <div>
                  <label className="text-cinetext-secondary block font-medium mb-1 flex items-center justify-between">
                    <span>Kết thúc (Giờ:Phút)</span>
                    <Clock className="w-3 h-3 text-cinetext-muted" />
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => handleEndTimeChange(e.target.value)}
                    className="w-full bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary font-mono text-center"
                  />
                </div>
              </div>

              {/* Smart Auto-calculation status hint */}
              <div className="bg-surface-light/60 border border-surface-border/70 rounded-xl px-3 py-2 text-[11px]">
                <div className="flex items-center justify-between flex-wrap gap-1.5">
                  <div className="flex items-center gap-1.5">
                    {isEndTimeManual ? (
                      <span className="text-amber-400 font-medium flex items-center gap-1">
                        <span>✏️ Đã chỉnh thủ công:</span>
                        <strong className="text-white">{currentCalc.durationMinutes} phút</strong>
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-medium flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Tự động tính theo thời lượng phim:</span>
                        <strong className="text-white">{activeMovieDuration} phút</strong>
                      </span>
                    )}

                    {currentCalc.nextDay && (
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded text-[10px] font-bold">
                        🌙 Qua nửa đêm (+1 ngày)
                      </span>
                    )}
                  </div>

                  {isEndTimeManual && (
                    <button
                      type="button"
                      onClick={handleResetEndTimeAuto}
                      className="text-primary hover:underline font-semibold flex items-center gap-1 text-[11px] active:scale-95"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Tự động tính lại</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-cinetext-secondary block font-medium mb-1">Giá vé ghế Thường (VNĐ)</label>
                  <input
                    type="number"
                    step="5000"
                    value={formData.priceRegular}
                    onChange={(e) => setFormData({ ...formData, priceRegular: Number(e.target.value) })}
                    className="w-full bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-cinetext-secondary block font-medium mb-1">Giá vé ghế VIP (VNĐ)</label>
                  <input
                    type="number"
                    step="5000"
                    value={formData.priceVip}
                    onChange={(e) => setFormData({ ...formData, priceVip: Number(e.target.value) })}
                    className="w-full bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-surface-light hover:bg-surface border border-surface-border rounded-lg text-xs text-cinetext-secondary"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isLoadingRooms || !formData.roomId}
                  className="px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-glow-primary active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Đang kiểm tra...' : 'Xác nhận tạo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
