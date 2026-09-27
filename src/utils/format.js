export const formatDate = (date) => {
  if (!date) return '-';
  try {
    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
};

export const formatDateTime = (date) => {
  if (!date) return '-';
  try {
    return new Date(date).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '-';
  }
};

export const formatNumber = (num, decimals = 2) => {
  if (num === null || num === undefined || num === '') return '-';
  return Number(num).toLocaleString('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const formatPercent = (num) => {
  if (num === null || num === undefined || num === '') return '-';
  return `${Number(num).toFixed(2)}%`;
};

export const calculatePercentWorn = (otd, rtd) => {
  if (!otd || otd === 0) return 0;
  return ((otd - rtd) / otd) * 100;
};

export const calculateRTDAvg = (rtd1, rtd2) => {
  if (rtd1 === null || rtd1 === undefined) return 0;
  if (rtd2 === null || rtd2 === undefined) return rtd1;
  return (rtd1 + rtd2) / 2;
};

export const getRtdColor = (rtd) => {
  if (rtd === null || rtd === undefined) return '#94a3b8'; // gray-400
  if (rtd < 5)  return '#ef4444'; // red-500
  if (rtd < 10) return '#f97316'; // orange-500
  if (rtd < 20) return '#eab308'; // yellow-500
  return '#22c55e'; // green-500
};

export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const titleCase = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(/[\s_-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const formatDuration = (date) => {
  if (!date) return '-';
  try {
    const ms = new Date() - new Date(date);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days} Days, ${hours} Hours`;
  } catch {
    return '-';
  }
};