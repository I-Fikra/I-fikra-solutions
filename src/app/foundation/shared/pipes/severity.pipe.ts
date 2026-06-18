import { Pipe, PipeTransform } from '@angular/core';

type TagSeverity =
    | 'success'
    | 'info'
    | 'warn'
    | 'danger'
    | 'secondary'
    | 'contrast';

@Pipe({
    name: 'severity',
    standalone: true
})
export class SeverityPipe implements PipeTransform {
    transform(status: string): TagSeverity {
        // Convert to lowercase for case-insensitive matching
        const lowerStatus = status?.toLowerCase() || '';

        switch (true) {
            // Success cases (green)
            case lowerStatus === 'active':
            case lowerStatus === 'مفعل':
            case lowerStatus === 'نشطة':
            case lowerStatus === 'نشط':
            case lowerStatus === 'delivered':
            case lowerStatus === 'تم التسليم':
            case lowerStatus === 'in port':
            case lowerStatus === 'في الميناء':
                return 'success';

            // Danger cases (red)
            case lowerStatus === 'inactive':
            case lowerStatus === 'غير نشط':
            case lowerStatus === 'error':
            case lowerStatus === 'خطأ':
            case lowerStatus === 'cancelled':
            case lowerStatus === 'ملغى':
            case lowerStatus === 'departed':
            case lowerStatus === 'مغادر':
                return 'danger';

            // Warn cases (orange/yellow)
            case lowerStatus === 'pending':
            case lowerStatus === 'قيد الانتظار':
            case lowerStatus === 'planned':
            case lowerStatus === 'مخطط':
            case lowerStatus === 'undefined':
                return 'warn';

            // Secondary cases (gray)
            case lowerStatus === 'new':
            case lowerStatus === 'جديد':
                return 'secondary';

            // Contrast cases (dark)
            case lowerStatus === 'blocked':
            case lowerStatus === 'محظور':
                return 'contrast';

            // Default
            default:
                return 'info';
        }
    }
}
