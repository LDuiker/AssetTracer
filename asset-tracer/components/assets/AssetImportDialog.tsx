'use client';

import { useState, type ChangeEvent } from 'react';
import { Upload, FileDown, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';

interface ImportError {
  row: number;
  issues: string[];
}

interface ImportResult {
  imported: number;
  failed: number;
  errors: ImportError[];
}

interface AssetImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: (count: number) => void;
}

const TEMPLATE_PATH = '/templates/asset-import-template.csv';

const REQUIRED_COLUMNS = [
  'name',
  'purchase_cost',
  'current_value',
  'status',
];

const OPTIONAL_COLUMNS = [
  'description',
  'category',
  'purchase_date',
  'location',
  'serial_number',
  'asset_type',
  'quantity',
];

export function AssetImportDialog({ open, onOpenChange, onImported }: AssetImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setFile(null);
      setResult(null);
      setError(null);
      setIsImporting(false);
    }
    onOpenChange(nextOpen);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    setResult(null);
    setError(null);
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please choose a CSV file first.');
      return;
    }

    setIsImporting(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/assets/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Import failed. Please try again.');
        if (Array.isArray(data.details)) {
          setResult({ imported: 0, failed: data.details.length, errors: data.details });
        }
        return;
      }

      const importResult: ImportResult = {
        imported: data.imported ?? 0,
        failed: data.failed ?? 0,
        errors: data.errors ?? [],
      };

      setResult(importResult);
      toast.success('Assets imported successfully', {
        description: `${importResult.imported} asset${importResult.imported === 1 ? '' : 's'} added.`,
      });
      onImported(importResult.imported);
    } catch (importError) {
      console.error('Error importing assets:', importError);
      setError('Unexpected error while importing assets. Please try again later.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Assets from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV exported from Excel or Google Sheets using the provided template. Each row will create a new asset.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="rounded-md border border-dashed border-gray-300 dark:border-gray-700 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">CSV requirements</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Include a header row that matches the template columns.
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href={TEMPLATE_PATH} download>
                  <FileDown className="mr-2 h-4 w-4" />
                  Download template
                </a>
              </Button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Required columns</p>
                <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  {REQUIRED_COLUMNS.map((column) => (
                    <li key={column}>• {column}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Optional columns</p>
                <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  {OPTIONAL_COLUMNS.map((column) => (
                    <li key={column}>• {column}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
              Choose CSV file
            </label>
            <Input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              disabled={isImporting}
            />
            {file && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Selected file: <span className="font-medium text-gray-700 dark:text-gray-200">{file.name}</span>
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Tip: In Excel or Google Sheets, choose “Download as CSV” before uploading.
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Import failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <div className="space-y-3">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Import summary</AlertTitle>
                <AlertDescription>
                  <p>
                    {result.imported} asset{result.imported === 1 ? '' : 's'} imported successfully.
                  </p>
                  {result.failed > 0 && (
                    <p>{result.failed} row{result.failed === 1 ? '' : 's'} skipped due to validation errors.</p>
                  )}
                </AlertDescription>
              </Alert>

              {result.errors.length > 0 && (
                <div className="rounded-md border border-gray-200 dark:border-gray-700">
                  <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm font-medium text-gray-800 dark:text-gray-200">
                    Row issues
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                      {result.errors.map((issue) => (
                        <li key={issue.row} className="px-3 py-2">
                          <p className="font-medium text-gray-900 dark:text-gray-100">Row {issue.row}</p>
                          <ul className="mt-1 space-y-1 text-gray-600 dark:text-gray-400">
                            {issue.issues.map((message, idx) => (
                              <li key={idx}>• {message}</li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isImporting}
          >
            Close
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={!file || isImporting}
            className="bg-primary-blue hover:bg-blue-700"
          >
            <Upload className="mr-2 h-4 w-4" />
            {isImporting ? 'Importing...' : 'Import assets'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


