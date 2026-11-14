// src/pages/AssistantPage.tsx: Интеллектуальный помощник (YandexGPT Lite)

import React, { useState, useRef, useEffect } from 'react';
import { dataService } from '../db/dataService';
import { Profile, Venue, AIIntent } from '../types';
import { LogoMark } from '../components/branding/LogoMark';
import {
  Bot, Send, Sparkles, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, MessageSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  intent?: AIIntent;
  timestamp: string;
  isApplied?: boolean;
}

interface AssistantPageProps {
  currentProfile: Profile;
  activeVenueId: string;
  venues: Venue[];
}

export const AssistantPage: React.FC<AssistantPageProps> = ({
  currentProfile,
  activeVenueId,
  venues
}) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-init',
      sender: 'assistant',
      text: `Здравствуйте, ${currentProfile.full_name}! Я старший бар-технолог сети «Мордовское подворье». Помогу рассчитать партию настойки, быстро оформить списание сырья, переместить напитки между заведениями или подготовить аналитический отчет. Напишите задачу свободной фразой или выберите быструю команду ниже:`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimitErr, setRateLimitErr] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputVal.trim();
    if (!text || isLoading) return;

    setRateLimitErr(null);
    const userMsg: Message = {
      id: 'm-' + Date.now(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputVal('');
    setIsLoading(true);

    try {
      const res = await dataService.callAiAssistant(text, activeVenueId);

      const assistantMsg: Message = {
        id: 'm-ai-' + Date.now(),
        sender: 'assistant',
        text: res.reply,
        intent: res.intent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      setRateLimitErr(err.message || 'Ошибка связи с AI-сервисом.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyIntent = async (msgId: string, intent: AIIntent) => {
    try {
      if (intent.action === 'showcase_create' && intent.showcase_item) {
        await dataService.addShowcaseItem(intent.showcase_item);
      } else if (intent.action === 'batch_create' && intent.suggested_recipe_id) {
        await dataService.createBatch(
          intent.suggested_recipe_id,
          activeVenueId,
          intent.volume_liters || 2,
          38
        );
      } else if (intent.action === 'transfer_item' && intent.target_venue) {
        // Перемещение первой доступной готовой настойки
        const infusions = await dataService.getInfusions();
        if (infusions.length > 0) {
          await dataService.transferInfusion(
            activeVenueId,
            intent.target_venue,
            infusions[0].id,
            1000
          );
        }
      }

      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isApplied: true } : m));
    } catch (err: any) {
      alert(`Ошибка выполнения действия: ${err.message}`);
    }
  };

  const quickPrompts = [
    'Придумай новую настойку для витрины',
    'Что можно настоять из того, что есть?',
    'Поставить 3 литра томатов на Подворье',
    'Отправить 2 литра смородины в Самовар'
  ];

  return (
    <div className="max-w-2xl mx-auto px-3 py-4 flex flex-col h-[calc(100vh-140px)]">
      {/* Шапка чата */}
      <div className="flex items-center gap-3 p-3 bg-white dark:bg-surface-dark-card rounded-2xl shadow-card border border-stone-200/60 dark:border-stone-800 mb-3">
        <LogoMark mode="pulse-on-tap" size={38} />
        <div>
          <h2 className="text-sm font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
            <span>Бар-технолог YandexGPT</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </h2>
          <p className="text-[11px] text-stone-500">
            Контекст: остатки складов, неудачные дегустации, заведения сети
          </p>
        </div>
      </div>

      {/* Быстрые чипсы-подсказки */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-2">
        {quickPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(p)}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-stone-200/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-brand-amber hover:text-brand-primary-dark shrink-0 transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Окно сообщений */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
                  isUser
                    ? 'bg-brand-primary text-white rounded-br-none'
                    : 'bg-white dark:bg-surface-dark-card text-stone-800 dark:text-stone-200 border border-stone-200/60 dark:border-stone-800 rounded-bl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>

                {/* Компактная карточка действия AI */}
                {m.intent && m.intent.action !== 'none' && (
                  <div className="mt-2.5 pt-2 border-t border-stone-200 dark:border-stone-700 space-y-2">
                    <div className="flex items-center gap-1 font-bold text-brand-primary dark:text-brand-amber">
                      <Sparkles size={13} />
                      <span>Предложенное действие:</span>
                    </div>

                    <div className="text-[11px] text-stone-600 dark:text-stone-300 bg-stone-50 dark:bg-stone-800/80 p-2 rounded-lg">
                      {m.intent.action === 'showcase_create' && m.intent.showcase_item && (
                        <div>
                          <div>Добавление на витрину: <strong>«{m.intent.showcase_item.title}»</strong></div>
                          <div className="text-[10px] text-stone-500 mt-0.5">
                            Крепость: {m.intent.showcase_item.abv}% • Выдержка: {m.intent.showcase_item.aging_text} • {m.intent.showcase_item.category}
                          </div>
                        </div>
                      )}
                      {m.intent.action === 'batch_create' && (
                        <span>Залив партии настойки на <strong>{m.intent.volume_liters} л</strong></span>
                      )}
                      {m.intent.action === 'transfer_item' && (
                        <span>Перемещение в заведение: <strong>{m.intent.target_venue}</strong></span>
                      )}
                      {m.intent.action === 'recipe_suggest' && (
                        <span>Открыть карточку рекомендованного рецепта</span>
                      )}
                    </div>

                    {!m.isApplied ? (
                      <button
                        onClick={() => handleApplyIntent(m.id, m.intent!)}
                        className="w-full py-1.5 px-3 bg-brand-primary hover:bg-brand-primary-light text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 shadow-sm transition-transform active:scale-98"
                      >
                        <CheckCircle2 size={14} />
                        <span>{m.intent.action === 'showcase_create' ? 'Добавить на витрину' : 'Применить действие'}</span>
                      </button>
                    ) : (
                      <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 size={13} /> Действие выполнено
                      </div>
                    )}
                  </div>
                )}

                <div className={`text-[9px] mt-1 text-right ${isUser ? 'text-amber-100/70' : 'text-stone-400'}`}>
                  {m.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-stone-500 p-2">
            <RefreshCw size={14} className="animate-spin text-brand-primary" />
            <span>Ассистент думает над рецептурой...</span>
          </div>
        )}

        {rateLimitErr && (
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-1.5">
            <AlertTriangle size={15} className="shrink-0 text-amber-600" />
            <span>{rateLimitErr}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Поле ввода */}
      <div className="mt-2 pt-2 border-t border-stone-200 dark:border-stone-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Например: залили 3 л томатов / что настоять?"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            disabled={isLoading}
            className="flex-1 p-2.5 text-xs sm:text-sm bg-white dark:bg-surface-dark-card border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputVal.trim() || isLoading}
            className="p-2.5 bg-brand-primary hover:bg-brand-primary-light text-white rounded-xl shadow-md disabled:opacity-50 transition-transform active:scale-95"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};
