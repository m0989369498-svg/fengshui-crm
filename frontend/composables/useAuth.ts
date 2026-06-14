/**
 * 存取密碼登入狀態。密碼存 cookie（useApi 會自動帶 x-app-password）。
 */
export function useAuth() {
  const pw = useCookie<string>('app_pw', { default: () => '', sameSite: 'lax' });
  const enabled = useState<boolean>('auth_enabled', () => false);
  const checked = useState<boolean>('auth_checked', () => false);

  const authed = computed(() => !enabled.value || !!pw.value);

  async function checkStatus() {
    const api = useApi();
    try {
      const d = await api.get<any>('/api/auth/status');
      enabled.value = !!d.enabled;
    } catch { /* 後端不可達時不擋 */ }
    checked.value = true;
  }

  async function login(password: string): Promise<boolean> {
    const api = useApi();
    try {
      const d = await api.post<any>('/api/auth/login', { password });
      pw.value = d.token || password;
      return true;
    } catch { return false; }
  }

  function logout() { pw.value = ''; }

  return { enabled, authed, checked, pw, checkStatus, login, logout };
}
