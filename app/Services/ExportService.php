<?php

namespace App\Services;

use Illuminate\Support\Collection;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportService
{
    /**
     * Export data to CSV file
     */
    public function exportToCsv(Collection|array $data, array $headers, string $filename): StreamedResponse
    {
        $data = $data instanceof Collection ? $data->toArray() : $data;

        return response()->streamDownload(function () use ($data, $headers) {
            $handle = fopen('php://output', 'w');

            // Add UTF-8 BOM for Excel compatibility
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF));

            // Write headers
            fputcsv($handle, array_values($headers));

            // Write data rows
            foreach ($data as $row) {
                $rowData = [];
                foreach (array_keys($headers) as $key) {
                    $rowData[] = $this->getNestedValue($row, $key);
                }
                fputcsv($handle, $rowData);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * Get nested value from array using dot notation
     */
    private function getNestedValue($array, string $key): string
    {
        $keys = explode('.', $key);
        $value = $array;

        foreach ($keys as $k) {
            if (is_array($value) && array_key_exists($k, $value)) {
                $value = $value[$k];
            } elseif (is_object($value) && property_exists($value, $k)) {
                $value = $value->$k;
            } else {
                return '';
            }
        }

        if (is_null($value)) {
            return '';
        }

        return (string) $value;
    }
}
