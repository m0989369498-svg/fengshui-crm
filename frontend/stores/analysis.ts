import { defineStore } from 'pinia';

export interface Customer {
  name?: string;
  gender?: 'male' | 'female';
  phone?: string;
  address?: string;
  birth?: {
    year?: number; month?: number; day?: number;
    hour?: number; minute?: number; city?: string;
  };
}

export interface Features {
  dataLevel: string;
  tags: string[];
  spatialTags: string[];
}

export interface AnalysisResult {
  features: Features;
  rag: { count: number };
  strategy: string;
  model: string;
  provider?: string;
}

export const useAnalysisStore = defineStore('analysis', {
  state: () => ({
    loading: false,
    streaming: false,
    error: null as null | { code: string; message: string },
    result: null as null | AnalysisResult,
    history: [] as any[],
  }),
  actions: {
    async generateStream(customer: Customer, salesQuestion: string, operator?: string) {
      const api = useApi();
      const { locale } = useLocale();
      this.loading = true; this.error = null; this.streaming = true;
      this.result = { features: { dataLevel: '', tags: [], spatialTags: [] }, rag: { count: 0 }, strategy: '', model: '' };
      let buf = '';
      const handle = (obj: any) => {
        if (!obj || !obj.type || !this.result) return;
        if (obj.type === 'features') { this.result.features = obj.features; if (obj.rag) this.result.rag = obj.rag; }
        else if (obj.type === 'token') { this.result.strategy += obj.content || ''; }
        else if (obj.type === 'meta') { this.result.model = obj.model; this.result.provider = obj.provider; }
        else if (obj.type === 'error') { this.error = { code: obj.error?.code || 'LLM', message: obj.error?.message || '生成失敗' }; }
      };
      const drain = (final = false) => {
        let nl;
        while ((nl = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line) continue;
          try { handle(JSON.parse(line)); } catch (e) { console.warn('[stream] bad frame', e, line.slice(0, 80)); }
        }
        if (final && buf.trim()) {
          try { handle(JSON.parse(buf.trim())); } catch (e) { console.warn('[stream] bad final frame', e); }
          buf = '';
        }
      };
      try {
        await api.postStream('/api/interaction/strategy-stream',
          { customer, salesQuestion, operator, lang: locale.value },
          (chunk) => { buf += chunk; drain(false); });
        drain(true);
      } catch (e: any) {
        this.error = { code: e.code, message: e.message };
        if (this.result && !this.result.strategy) this.result = null;
      } finally {
        this.loading = false; this.streaming = false;
      }
    },
    async generate(customer: Customer, salesQuestion: string, operator?: string) {
      const api = useApi();
      const { locale } = useLocale();
      this.loading = true;
      this.error = null;
      try {
        const data = await api.post<AnalysisResult>('/api/interaction/strategy', {
          customer,
          salesQuestion,
          operator,
          lang: locale.value,
        });
        this.result = data;
      } catch (e: any) {
        this.error = { code: e.code, message: e.message };
      } finally {
        this.loading = false;
      }
    },

    async generateFromVoice(customer: Customer, audio: File, operator?: string) {
      const api = useApi();
      const { locale } = useLocale();
      this.loading = true;
      this.error = null;
      try {
        const form = new FormData();
        form.append('audio', audio);
        form.append('customer', JSON.stringify(customer));
        form.append('lang', locale.value);
        if (operator) form.append('operator', operator);
        const data = await api.postForm<AnalysisResult & { transcript: string }>('/api/interaction/voice', form);
        this.result = data;
        return data.transcript;
      } catch (e: any) {
        this.error = { code: e.code, message: e.message };
      } finally {
        this.loading = false;
      }
    },

    async downloadPdf(operator?: string) {
      if (!this.result) return;
      const base = useRuntimeConfig().public.apiBase;
      const op = operator ? { id: operator, name: operator } : { id: 'A001', name: '業務' };
      const res = await fetch(`${base}/api/report/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown: this.result.strategy, operator: op, title: '客戶經營戰略報告' }),
      });
      if (!res.ok) { this.error = { code: 'PDF', message: '週報產製失敗' }; return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `策略報告_${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    },

    async loadHistory() {
      const api = useApi();
      try {
        const data = await api.get<{ items: any[] }>('/api/interaction/history?limit=20');
        this.history = data.items;
      } catch { /* 靜默 */ }
    },
  },
});
