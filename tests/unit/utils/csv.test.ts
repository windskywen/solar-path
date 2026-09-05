import { describe, expect, it } from 'vitest';
import {
  escapeCsvCell,
  sanitizeCsvFilename,
  serializeCsv,
  type CsvDataset,
} from '@/lib/utils/csv';

describe('CSV utilities', () => {
  it('escapes commas, quotes, and newlines', () => {
    expect(escapeCsvCell('plain')).toBe('plain');
    expect(escapeCsvCell('Brisbane, Australia')).toBe('"Brisbane, Australia"');
    expect(escapeCsvCell('a "quoted" value')).toBe('"a ""quoted"" value"');
    expect(escapeCsvCell('line 1\nline 2')).toBe('"line 1\nline 2"');
  });

  it('serializes deterministic UTF-8 BOM and CRLF output', () => {
    const dataset: CsvDataset = {
      filename: 'solar-path.csv',
      metadata: [{ key: 'model_id', value: 'SPT-SUN-V1' }],
      columns: ['time', 'azimuth_deg'],
      rows: [['12:00', 180.5]],
    };

    expect(serializeCsv(dataset)).toBe(
      '\uFEFFmetadata_key,metadata_value\r\nmodel_id,SPT-SUN-V1\r\n\r\ntime,azimuth_deg\r\n12:00,180.5\r\n'
    );
  });

  it('rejects malformed row widths and creates safe deterministic filenames', () => {
    expect(() =>
      serializeCsv({ filename: 'x', columns: ['one', 'two'], rows: [['only one']] })
    ).toThrow(/1 cells but 2 columns/);
    expect(sanitizeCsvFilename('Brisbane Solar Path 2026-06-21')).toBe(
      'brisbane-solar-path-2026-06-21.csv'
    );
  });
});
