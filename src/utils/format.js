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
    return new Date(date).toLocaleString('id-ID');
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
  if (rtd === null || rtd === undefined) return 'default';
  if (rtd < 5) return 'scrap';
  if (rtd < 10) return 'dismounted';
  if (rtd < 20) return 'warning';
  return 'spare';
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