/**
 * 與後端溝通的封裝。同源相對路徑 + 統一錯誤 + 存取密碼 header + 串流。
 */
export interface ApiError { code: string; message: string; detail?: string; }

export function useApi() {
  const base = useRuntimeConfig().public.apiBase;
  const pw = useCookie<string>('app_pw', { default: () => '', sameSite: 'lax' });

  const authHeaders = () => (pw.value ? { 'x-app-password': pw.value } : {});

  async function request<T>(path: string, opts: any): Promise<T> {
    try {
      const data = await $fetch<any>(`${base}${path}`, {
        ...opts,
        headers: { ...(opts.headers || {}), ...authHeaders() },
      });
      if (data && data.ok === false) throw normalizeErr(data.error);
      return data as T;
    } catch (e: any) {
      if (e?.data?.error) throw normalizeErr(e.data.error);
      if (e?.code && e?.message) throw e as ApiError;
      throw { code: 'NETWORK', message: '無法連線到後端服務。', detail: String(e?.message || e) } as ApiError;
    }
  }

  const post = <T = any>(path: string, body: unknown) => request<T>(path, { method: 'POST', body });
  const get = <T = any>(path: string) => request<T>(path, { method: 'GET' });
  const put = <T = any>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body });
  const del = <T = any>(path: string) => request<T>(path, { method: 'DELETE' });
  const postForm = <T = any>(path: string, form: FormData) => request<T>(path, { method: 'POST', body: form });

  /** 串流 POST：逐塊回呼 onChunk(text)。回傳完整文字。 */
  async function postStream(path: string, body: unknown, onChunk: (t: string) => void): Promise<string> {
    const res = await fetch(`${base}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    });
    if (!res.ok || !res.body) {
      let err: any = {};
      try { err = (await res.json())?.error; } catch { /* ignore */ }
      throw normalizeErr(err) as ApiError;
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let full = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = dec.decode(value, { stream: true });
      full += chunk;
      onChunk(chunk);
    }
    const tail = dec.decode(); // flush 殘留多位元組序列，避免末尾中文/emoji 遺失
    if (tail) { full += tail; onChunk(tail); }
    return full;
  }

  function normalizeErr(err: any): ApiError {
    return { code: err?.code || 'UNKNOWN', message: err?.message || '未知錯誤', detail: err?.detail };
  }

  return { post, get, put, del, postForm, postStream, base, pw };
}
