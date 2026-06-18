import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { TranslocoService } from '@jsverse/transloco';
import {
  TableBuilderService,
  TableResponse
} from '@/app/foundation/shared/services/table-builder.service';
import { UserRepository } from '../../domain/repositories/user.repository';
import { UserRecord } from '../../domain/entities/user.entity';

interface LoggedInUserApiWrapper {
  success: number;
  result: { user: UserRecord };
}

@Injectable()
export class UserRepositoryImpl extends UserRepository {
  private readonly http = inject(HttpClient);
  private readonly t = inject(TranslocoService);
  private readonly tableBuilder = inject(TableBuilderService);

  getAll(): Observable<TableResponse> {
    const lang = this.t.getActiveLang();
    const file = lang === 'ar' ? 'api/users-ar.json' : 'api/users-en.json';

    return this.http.get<any>(file).pipe(
      map((res) =>
        this.tableBuilder.build(res, {
          itemsPath: 'result.items',
          metaPath: 'result.meta_data',
          titlePath: 'result.paging.page_title'
        })
      )
    );
  }

  getLoggedInUser(): Observable<UserRecord> {
    return this.http
      .get<LoggedInUserApiWrapper>('api/me.json')
      .pipe(map((res) => res.result.user));
  }

  updateLoggedInUser(user: UserRecord): Observable<UserRecord> {
    return this.http
      .put<LoggedInUserApiWrapper>('api/me.json', user)
      .pipe(map((res) => res.result.user));
  }
}
