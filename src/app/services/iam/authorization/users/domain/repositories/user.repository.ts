import { Observable } from 'rxjs';
import { UserRecord } from '../entities/user.entity';
import { TableResponse } from '@/app/foundation/shared/services/table-builder.service';

// can't create an object of it
export abstract class UserRepository {
  abstract getAll(): Observable<TableResponse>;
  abstract getLoggedInUser(): Observable<UserRecord>;
  abstract updateLoggedInUser(user: UserRecord): Observable<UserRecord>;
}
