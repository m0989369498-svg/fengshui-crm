<script setup lang="ts">
const props = defineProps<{ customerContext?: string }>();
const { t, locale } = useLocale();
const api = useApi();

interface Msg { role: 'user' | 'assistant'; content: string; }
const messages = ref<Msg[]>([]);
const input = ref('');
const busy = ref(false);

async function send() {
  const q = input.value.trim();
  if (!q || busy.value) return;
  messages.value.push({ role: 'user', content: q });
  input.value = '';
  busy.value = true;
  try {
    const history = messages.value.slice(0, -1).map((m) => ({ role: m.role, content: m.content }));
    const d = await api.post<any>('/api/interaction/followup', {
      history, userMessage: q, customerContext: props.customerContext || '', lang: locale.value,
    });
    messages.value.push({ role: 'assistant', content: d.strategy || '' });
  } catch (e: any) {
    messages.value.push({ role: 'assistant', content: t('追問失敗：') + (e.message || '') });
  } finally { busy.value = false; }
}
</script>

<template>
  <section class="card p-5">
    <h3 class="heading text-sm mb-2">{{ t('追問 AI（針對此客戶）') }}</h3>

    <div v-if="messages.length" class="space-y-2 mb-3 max-h-72 overflow-auto">
      <div v-for="(m, i) in messages" :key="i"
        :class="m.role === 'user' ? 'text-right' : 'text-left'">
        <span class="inline-block rounded-lg px-3 py-2 text-sm max-w-[85%] whitespace-pre-line"
          :class="m.role === 'user' ? 'bg-gold-500/15 text-gold-100' : 'bg-ink-700/60 text-gold-50/90'">
          {{ t(m.content) }}
        </span>
      </div>
    </div>

    <div class="flex gap-2">
      <input v-model="input" class="field flex-1" :placeholder="t('例：如果他說沒預算怎麼接？')"
        @keyup.enter="send" :disabled="busy" />
      <button class="btn-gold px-4" :disabled="busy || !input.trim()" @click="send">
        {{ busy ? t('思考中…') : t('問') }}
      </button>
    </div>
  </section>
</template>
