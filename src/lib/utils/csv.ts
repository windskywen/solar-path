export type CsvValue = string | number | boolean | null | undefined;

export interface CsvMetadataEntry {
  key: string;
  value: CsvValue;
}
export interface CsvDataset {
  filename: string;
  metadata?: readonly CsvMetadataEntry[];
  columns: readonly string[];
  rows: readonly (readonly CsvValue[])[];
}

export function escapeCsvCell(value: CsvValue): string {
  const normalized = value === null || value === undefined ? '' : String(value);
  if (!/[",\r\n]/.test(normalized)) {
    return normalized;
  }
  return `"${normalized.replaceAll('"', '""')}"`;
}

function serializeRow(values: readonly CsvValue[]): string {
  return values.map(escapeCsvCell).join(',');
}

export function serializeCsv(dataset: CsvDataset): string {
  const lines: string[] = [];

  if (dataset.metadata?.length) {
    lines.push(serializeRow(['metadata_key', 'metadata_value']));
    for (const entry of dataset.metadata) {
      lines.push(serializeRow([entry.key, entry.value]));
    }
    lines.push('');
  }

  lines.push(serializeRow(dataset.columns));
  for (const row of dataset.rows) {
    if (row.length !== dataset.columns.length) {
      throw new Error(
        `CSV row has ${row.length} cells but ${dataset.columns.length} columns were declared.`
      );
    }
    lines.push(serializeRow(row));
  }

  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

export function sanitizeCsvFilename(value: string): string {
  const base = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
  return `${base || 'solar-path-data'}.csv`;
}
