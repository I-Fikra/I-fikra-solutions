import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'readableDateTime'
})
export class ReadableDateTimePipe implements PipeTransform {
    transform(value: string): string {
        // Handle empty / invalid placeholders
        if (!value || value === '_' || value.trim() === '') {
            return '-'; // or '' depending on your UI
        }

        // Remove extra microseconds (keep 3 digits only)
        const cleaned = value.replace(/\.(\d{3})\d+/, '.$1');

        const date = new Date(cleaned);

        // If parsing fails, return fallback
        if (isNaN(date.getTime())) {
            return '-';
        }

        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
}
