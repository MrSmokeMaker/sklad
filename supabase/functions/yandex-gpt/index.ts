// supabase/functions/yandex-gpt/index.ts
// Supabase Edge Function: Интеграция с YandexGPT Lite для сети «Мордовское подворье»

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestPayload {
  mode: "intent" | "monthly_report";
  message?: string;
  context?: {
    stock?: Array<{ name: string; quantity: number; unit: string }>;
    recipes?: Array<{ title: string; category: string; days: number }>;
    poorRatings?: Array<{ title: string; rating: number; notes: string }>;
    venues?: Array<{ id: string; name: string }>;
    salesSummary?: {
      period: string;
      totalCost: number;
      totalRevenue: number;
      totalPortions: number;
      topInfusion: string;
      topSet: string;
      venues: Array<{ name: string; cost: number; revenue: number; margin: number }>;
    };
  };
}

const SYSTEM_PROMPT = `Ты — старший бар-технолог и шеф-дистиллятор сети ресторанов «Мордовское подворье» (г. Саранск).
Сеть состоит из:
1. «Подворье - Бар» — центральное производство настоек.
2. «Самовар» — ресторан традиционной русской и мордовской кухни.
3. «Мордовское подворье» — флагманский национальный ресторан.
4. «Ева» — современное городское кафе/бар.

Твоя задача — помогать барменам, управляющим и шефу с настойками:
1. Разбирать свободные команды пользователя по расходу, заливу или перемещению настоек/сырья в строго структурированный JSON с намерением (action).
2. Подбирать и рекомендовать рецепты из имеющегося на складе сырья («Что можно настоять?»).
3. При рекомендациях СТРОГО учитывать неудачные дегустации (оценки 1-2 с заметками) и предупреждать: "В прошлый раз партия с оценкой N не удалась из-за...".
4. Если пользователь задает вопросы не по теме (не о настойках, баре, сырье, рецептах или продажах заведений), вежливо и мягко верни его к делам сети «Мордовское подворье».

Ты ВСЕГДА возвращаешь ответ строго в формате JSON:
{
  "reply": "Твой естественный вежливый ответ на русском языке",
  "intent": {
    "action": "batch_create" | "transfer_item" | "stock_consume" | "recipe_suggest" | "none",
    "target_venue": "Название или ID заведения, если указано",
    "items": [
      { "name": "название сырья или настойки", "qty": число, "unit": "г"|"мл"|"кг"|"л"|"шт" }
    ],
    "volume_liters": число или null,
    "confidence": 0.0 - 1.0,
    "suggested_recipe_id": "id если найдено"
  }
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("YANDEX_API_KEY");
    const folderId = Deno.env.get("YANDEX_FOLDER_ID");

    if (!apiKey || !folderId) {
      return new Response(
        JSON.stringify({
          error: "Yandex credentials not configured on server (YANDEX_API_KEY / YANDEX_FOLDER_ID).",
          fallback: true
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const payload: RequestPayload = await req.json();

    let userPromptText = "";

    if (payload.mode === "monthly_report") {
      const s = payload.context?.salesSummary;
      userPromptText = `Сгенерируй профессиональный краткий аналитический отчёт шеф-бармена за период ${s?.period || "прошлый месяц"}.
Данные отчёта (числа бери строго отсюда):
- Суммарная выручка сети: ${s?.totalRevenue.toFixed(2)} руб.
- Суммарная себестоимость: ${s?.totalCost.toFixed(2)} руб.
- Маржа сети: ${(Number(s?.totalRevenue || 0) - Number(s?.totalCost || 0)).toFixed(2)} руб.
- Всего продано порций: ${s?.totalPortions}
- Топ-настойка сети: ${s?.topInfusion || "нет данных"}
- Топ-сет сети: ${s?.topSet || "нет данных"}
- Показатели по заведениям: ${JSON.stringify(s?.venues || [])}

Формат ответа: краткий анализ (выручка, маржа по заведениям, лидеры продаж, рекомендации по закупке сырья). Ответ оформи в JSON:
{
  "reply": "Текст отчета с выделением ключевых цифр",
  "intent": { "action": "none" }
}`;
    } else {
      userPromptText = `Сообщение пользователя: "${payload.message}".
Контекст остатков склада: ${JSON.stringify(payload.context?.stock?.slice(0, 15) || [])}
Неудачные дегустации (оценки 1-2): ${JSON.stringify(payload.context?.poorRatings || [])}
Доступные заведения: ${JSON.stringify(payload.context?.venues || [])}`;
    }

    const yandexUrl = "https://llm.api.cloud.yandex.net/foundationModels/v1/completion";
    const yandexBody = {
      modelUri: `gpt://${folderId}/yandexgpt-lite/latest`,
      completionOptions: {
        stream: false,
        temperature: 0.2,
        maxTokens: 1500
      },
      messages: [
        { role: "system", text: SYSTEM_PROMPT },
        { role: "user", text: userPromptText }
      ]
    };

    const res = await fetch(yandexUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Api-Key ${apiKey}`,
        "x-folder-id": folderId
      },
      body: JSON.stringify(yandexBody)
    });

    if (!res.ok) {
      const errText = await res.text();
      return new Response(
        JSON.stringify({ error: `Yandex API error: ${res.status}`, details: errText }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: res.status }
      );
    }

    const data = await res.json();
    const rawResultText = data.result?.alternatives?.[0]?.message?.text || "{}";

    let parsedJson;
    try {
      const cleaned = rawResultText.replace(/```json\n?|\n?```/g, "").trim();
      parsedJson = JSON.parse(cleaned);
    } catch {
      parsedJson = {
        reply: rawResultText,
        intent: { action: "none" }
      };
    }

    return new Response(JSON.stringify(parsedJson), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});
