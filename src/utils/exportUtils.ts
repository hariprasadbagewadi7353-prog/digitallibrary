export const exportToCSV = (data: any[], filename: string, headers?: { key: string; label: string }[]) => {
  if (!data || data.length === 0) {
    alert('No data available to export.');
    return;
  }

  let csvContent = '';

  if (headers && headers.length > 0) {
    csvContent += headers.map(h => `"${h.label.replace(/"/g, '""')}"`).join(',') + '\r\n';
    data.forEach(row => {
      const line = headers
        .map(h => {
          const val = row[h.key] !== undefined && row[h.key] !== null ? String(row[h.key]) : '';
          return `"${val.replace(/"/g, '""')}"`;
        })
        .join(',');
      csvContent += line + '\r\n';
    });
  } else {
    const keys = Object.keys(data[0]);
    csvContent += keys.map(k => `"${k.replace(/"/g, '""')}"`).join(',') + '\r\n';
    data.forEach(row => {
      const line = keys
        .map(k => {
          const val = row[k] !== undefined && row[k] !== null ? String(row[k]) : '';
          return `"${val.replace(/"/g, '""')}"`;
        })
        .join(',');
      csvContent += line + '\r\n';
    });
  }

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToJSON = (data: any[], filename: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
