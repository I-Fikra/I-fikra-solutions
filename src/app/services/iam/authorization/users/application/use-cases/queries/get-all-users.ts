import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { UserRepository } from '../../../domain/repositories/user.repository';
import { TableResponse } from '@/app/foundation/shared/services/table-builder.service';

@Injectable({ providedIn: 'root' })
export class GetAllUsersUseCase {
  private readonly repo = inject(UserRepository);

  execute(): Observable<TableResponse> {
    return this.repo.getAll();
  }
}
