import { defineStore } from 'pinia';
import type { Customer } from './analysis';

export interface CustomerRecord extends Customer {
  id: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const useCustomerStore = defineStore('customers', {
  state: () => ({
    list: [] as CustomerRecord[],
    current: null as null | { customer: CustomerRecord; interactions: any[] },
    loading: false,
    error: null as null | { code: string; message: string },
    backend: 'jsonl',
  }),
  actions: {
    async load(q = '') {
      const api = useApi();
      this.loading = true; this.error = null;
      try {
        const d = await api.get<any>(`/api/customers${q ? '?q=' + encodeURIComponent(q) : ''}`);
        this.list = d.items; this.backend = d.backend;
      } catch (e: any) { this.error = { code: e.code, message: e.message }; }
      finally { this.loading = false; }
    },
    async create(data: Partial<CustomerRecord>) {
      const api = useApi();
      try {
        const d = await api.post<any>('/api/customers', data);
        this.list.unshift(d.customer);
        return d.customer as CustomerRecord;
      } catch (e: any) { this.error = { code: e.code, message: e.message }; return null; }
    },
    async open(id: string) {
      const api = useApi();
      this.loading = true; this.error = null;
      try {
        this.current = await api.get<any>(`/api/customers/${id}`);
      } catch (e: any) { this.error = { code: e.code, message: e.message }; }
      finally { this.loading = false; }
    },
    async update(id: string, patch: Partial<CustomerRecord>) {
      const api = useApi();
      try {
        const d = await api.put<any>(`/api/customers/${id}`, patch);
        const i = this.list.findIndex((c) => c.id === id);
        if (i >= 0) this.list[i] = d.customer;
        return d.customer;
      } catch (e: any) { this.error = { code: e.code, message: e.message }; return null; }
    },
    async remove(id: string) {
      const api = useApi();
      try {
        await api.del(`/api/customers/${id}`);
        this.list = this.list.filter((c) => c.id !== id);
        if (this.current?.customer.id === id) this.current = null;
      } catch (e: any) { this.error = { code: e.code, message: e.message }; }
    },
  },
});
