import { useState } from 'react';
import { HelpCircle, AlertCircle, Loader2, CheckCircle, Clock, MessageCircle } from 'lucide-react';

interface Question {
  id: string;
  content: string;
  askedBy: string;
  askedAt: Date;
  channelName: string;
  messageId: string;
}

type ViewState = 'loading' | 'error' | 'empty' | 'success';

export function UnansweredQuestions() {
  // For demo purposes, toggle between different states
  const [viewState, setViewState] = useState<ViewState>('success');
  const [questions] = useState<Question[]>([
    {
      id: 'q1',
      content: 'Does anyone know when the next team meeting is scheduled?',
      askedBy: 'Alex',
      askedAt: new Date(2026, 1, 18, 9, 30),
      channelName: 'general',
      messageId: 'm1',
    },
    {
      id: 'q2',
      content: 'Can someone help me with the deployment process?',
      askedBy: 'Jordan',
      askedAt: new Date(2026, 1, 18, 10, 15),
      channelName: 'random',
      messageId: 'm2',
    },
    {
      id: 'q3',
      content: 'What\'s the status of the Q1 roadmap?',
      askedBy: 'Sam',
      askedAt: new Date(2026, 1, 18, 11, 0),
      channelName: 'general',
      messageId: 'm3',
    },
  ]);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  // Loading State
  if (viewState === 'loading') {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#f5f5f5] rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-[#6264a7] animate-spin" />
          </div>
          <h3 className="text-sm font-semibold text-[#242424] mb-1">
            Analyzing messages...
          </h3>
          <p className="text-xs text-[#616161]">
            Detecting unanswered questions
          </p>
        </div>
      </div>
    );
  }

  // Error State
  if (viewState === 'error') {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#fef2f2] rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-[#dc2626]" />
          </div>
          <h3 className="text-sm font-semibold text-[#242424] mb-1">
            Failed to load questions
          </h3>
          <p className="text-xs text-[#616161] mb-4">
            Something went wrong. Please try again.
          </p>
          <button
            onClick={() => setViewState('success')}
            className="px-4 py-2 bg-[#6264a7] text-white text-sm rounded hover:bg-[#5b5fc7] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty State
  if (viewState === 'empty') {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#f0fdf4] rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-[#22c55e]" />
          </div>
          <h3 className="text-sm font-semibold text-[#242424] mb-1">
            All caught up!
          </h3>
          <p className="text-xs text-[#616161]">
            No unanswered questions at the moment
          </p>
        </div>
      </div>
    );
  }

  // Success State with Questions
  return (
    <div className="flex-1 flex flex-col">
      {/* Header with count */}
      <div className="px-5 py-3 border-b border-[#e0e0e0] bg-[#fefce8]">
        <div className="flex items-center gap-2 mb-1">
          <HelpCircle className="w-4 h-4 text-[#ca8a04]" />
          <span className="text-sm font-semibold text-[#713f12]">
            {questions.length} Unanswered {questions.length === 1 ? 'Question' : 'Questions'}
          </span>
        </div>
        <p className="text-xs text-[#854d0e]">
          These questions may need your attention
        </p>
      </div>

      {/* Questions List */}
      <div className="flex-1 overflow-y-auto">
        {questions.map((question) => (
          <div
            key={question.id}
            className="px-4 py-3 border-b border-[#f0f0f0] hover:bg-[#f5f5f5] cursor-pointer transition-colors group"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-[#fff7ed] rounded-full flex items-center justify-center mt-0.5">
                <HelpCircle className="w-4 h-4 text-[#ea580c]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#242424] mb-2 line-clamp-2">
                  {question.content}
                </p>
                <div className="flex items-center gap-2 text-xs text-[#616161]">
                  <span className="font-medium">{question.askedBy}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTimeAgo(question.askedAt)}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    #{question.channelName}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-2 ml-11 flex gap-2">
              <button className="px-3 py-1 text-xs bg-[#6264a7] text-white rounded hover:bg-[#5b5fc7] transition-colors">
                Answer
              </button>
              <button className="px-3 py-1 text-xs bg-white border border-[#e0e0e0] text-[#424242] rounded hover:bg-[#f5f5f5] transition-colors">
                Mark as answered
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* State Toggle Buttons (for demo purposes) */}
      <div className="px-4 py-3 border-t border-[#e0e0e0] bg-[#f9fafb]">
        <p className="text-xs text-[#616161] mb-2 font-medium">Demo States:</p>
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setViewState('loading')}
            className="px-2 py-1 text-xs bg-white border border-[#e0e0e0] rounded hover:bg-[#f5f5f5]"
          >
            Loading
          </button>
          <button
            onClick={() => setViewState('error')}
            className="px-2 py-1 text-xs bg-white border border-[#e0e0e0] rounded hover:bg-[#f5f5f5]"
          >
            Error
          </button>
          <button
            onClick={() => setViewState('empty')}
            className="px-2 py-1 text-xs bg-white border border-[#e0e0e0] rounded hover:bg-[#f5f5f5]"
          >
            Empty
          </button>
          <button
            onClick={() => setViewState('success')}
            className="px-2 py-1 text-xs bg-white border border-[#e0e0e0] rounded hover:bg-[#f5f5f5]"
          >
            Success
          </button>
        </div>
      </div>
    </div>
  );
}
