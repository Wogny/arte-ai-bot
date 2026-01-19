import { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Trash2, Edit2, Plus } from 'lucide-react';
import { trpc } from '../lib/trpc';

interface ScheduledPost {
  id: string;
  title: string;
  date: Date;
  time: string;
  platforms: string[];
  status: 'pending' | 'published' | 'failed';
  imageUrl?: string;
}

export default function ScheduleVisual() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);

  const getScheduledQuery = trpc.socialPublishing.getScheduled.useQuery();

  // Get days in month
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  // Get first day of month
  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Get posts for date
  const getPostsForDate = (date: Date) => {
    return scheduledPosts.filter(post => {
      const postDate = new Date(post.date);
      return (
        postDate.getFullYear() === date.getFullYear() &&
        postDate.getMonth() === date.getMonth() &&
        postDate.getDate() === date.getDate()
      );
    });
  };

  // Render calendar
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2 bg-white/5 rounded"></div>);
    }

    // Days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const posts = getPostsForDate(date);
      const isToday = new Date().toDateString() === date.toDateString();
      const isSelected = selectedDate?.toDateString() === date.toDateString();

      days.push(
        <button
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`p-2 rounded-lg text-sm font-medium transition relative ${
            isSelected
              ? 'bg-purple-600 text-white'
              : isToday
              ? 'bg-cyan-600/50 text-white border border-cyan-400'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          <div>{day}</div>
          {posts.length > 0 && (
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-1">
              {posts.map((_, i) => (
                <div key={i} className="w-1 h-1 bg-pink-400 rounded-full"></div>
              ))}
            </div>
          )}
        </button>
      );
    }

    return days;
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDeletePost = (id: string) => {
    setScheduledPosts(scheduledPosts.filter(post => post.id !== id));
  };

  const selectedDatePosts = selectedDate ? getPostsForDate(selectedDate) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-2">
            <Clock className="w-8 h-8 text-purple-400" />
            Agendador Visual
          </h1>
          <p className="text-gray-400">Visualize e gerencie seus posts agendados</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
              {/* Month Header */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={handlePreviousMonth}
                  className="p-2 hover:bg-white/20 rounded-lg transition"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>

                <h2 className="text-xl font-semibold text-white">
                  {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </h2>

                <button
                  onClick={handleNextMonth}
                  className="p-2 hover:bg-white/20 rounded-lg transition"
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Weekdays */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map(day => (
                  <div key={day} className="text-center text-sm font-semibold text-gray-400">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-2">
                {renderCalendar()}
              </div>

              {/* Legend */}
              <div className="mt-6 pt-6 border-t border-white/20 space-y-2 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-cyan-600 rounded"></div>
                  <span>Hoje</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-pink-400 rounded-full"></div>
                  <span>Posts agendados</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Selected Date Posts */}
          <div className="space-y-6">
            {selectedDate ? (
              <>
                {/* Date Header */}
                <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-2">
                    {formatDate(selectedDate)}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {selectedDatePosts.length} post{selectedDatePosts.length !== 1 ? 's' : ''} agendado{selectedDatePosts.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Posts List */}
                {selectedDatePosts.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDatePosts.map(post => (
                      <div key={post.id} className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg p-4">
                        {post.imageUrl && (
                          <img
                            src={post.imageUrl}
                            alt={post.title}
                            className="w-full h-32 object-cover rounded-lg mb-3"
                          />
                        )}

                        <div className="mb-3">
                          <p className="text-sm font-medium text-white">{post.title}</p>
                          <p className="text-xs text-gray-400 mt-1">{post.time}</p>
                        </div>

                        <div className="flex flex-wrap gap-1 mb-3">
                          {post.platforms.map(platform => (
                            <span
                              key={platform}
                              className="px-2 py-1 bg-purple-600/50 text-purple-200 text-xs rounded"
                            >
                              {platform}
                            </span>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingPost(post)}
                            className="flex-1 px-3 py-2 bg-blue-600/50 hover:bg-blue-600 text-blue-200 text-xs rounded transition flex items-center justify-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" />
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="flex-1 px-3 py-2 bg-red-600/50 hover:bg-red-600 text-red-200 text-xs rounded transition flex items-center justify-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            Deletar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 text-center">
                    <p className="text-gray-400 mb-4">Nenhum post agendado para este dia</p>
                    <button
                      onClick={() => setShowModal(true)}
                      className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Agendar Post
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 text-center">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">Selecione uma data para ver os posts agendados</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
