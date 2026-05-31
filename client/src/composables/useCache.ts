import { ref, watch } from 'vue';
import type { Ref } from 'vue';

export function useCache<T>(key: string, initialValue: T): Ref<T> {
  const readValue = (): T => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  };

  const data = ref(readValue()) as Ref<T>;

  watch(
    data,
    (newValue) => {
      try {
        window.localStorage.setItem(key, JSON.stringify(newValue));
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    { deep: true }
  );

  return data;
}
