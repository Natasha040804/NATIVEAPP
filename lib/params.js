import { useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';

function coerceValue(v) {
  if (v === undefined || v === null) return v;
  // preserve actual booleans
  if (typeof v === 'boolean') return v;
  const s = String(v).trim();
  const lower = s.toLowerCase();
  if (lower === 'true') return true;
  if (lower === 'false') return false;
  if (lower === 'null') return null;
  if (lower === 'undefined') return undefined;
  // numbers
  if (/^-?\d+$/.test(s)) return Number(s);
  if (/^-?\d+\.\d+$/.test(s)) return Number(s);
  // JSON object/array
  if ((s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'))) {
    try {
      return JSON.parse(s);
    } catch (e) {
      // fallthrough
    }
  }
  return s;
}

export function useParsedLocalSearchParams() {
  const raw = useLocalSearchParams();
  return useMemo(() => {
    if (!raw) return raw;
    const out = {};
    for (const k of Object.keys(raw)) {
      out[k] = coerceValue(raw[k]);
    }
    return out;
  }, [JSON.stringify(raw)]);
}

export default useParsedLocalSearchParams;
