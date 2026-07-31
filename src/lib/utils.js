import { format, parseISO } from 'date-fns';

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(date, fmt = 'dd MMM yyyy') {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, fmt);
  } catch {
    return date;
  }
}

export function formatDateTime(date) {
  return formatDate(date, 'dd MMM yyyy HH:mm');
}

export function formatHM(meterValue) {
  if (meterValue == null || isNaN(meterValue)) return '-';
  return Number(meterValue).toLocaleString('en-US');
}

export function calculateRTDAvg(rtds = []) {
  if (!rtds || rtds.length === 0) return 0;
  const sum = rtds.reduce((acc, rtd) => acc + (parseFloat(rtd) || 0), 0);
  return (sum / rtds.length).toFixed(2);
}

export function calculateWorn(depthNew, depthCurrent) {
  if (!depthNew || !depthCurrent) return 0;
  const worn = ((depthNew - depthCurrent) / depthNew) * 100;
  return Math.max(0, Math.min(100, worn.toFixed(1)));
}

export function getTyreStatusBadge(status) {
  const map = {
    mounted: { label: 'Mounted', className: 'bg-blue-100 text-blue-800' },
    spare: { label: 'Spare', className: 'bg-yellow-100 text-yellow-800' },
    dismounted: { label: 'Dismounted', className: 'bg-gray-100 text-gray-800' },
    scrap: { label: 'Scrap', className: 'bg-red-100 text-red-800' },
    running: { label: 'Running', className: 'bg-green-100 text-green-800' },
    new_tyre: { label: 'New', className: 'bg-emerald-100 text-emerald-800' },
    repair: { label: 'Repair', className: 'bg-orange-100 text-orange-800' },
  };
  return map[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
}

export function truncate(str, len = 30) {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) + '...' : str;
}

export function debounce(fn, delay = 300) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
