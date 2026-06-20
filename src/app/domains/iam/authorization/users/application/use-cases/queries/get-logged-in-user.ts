import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { UserRepository } from '../../../domain/repositories/user.repository';
import { UserRecord } from '../../../domain/entities/user.entity';

@Injectable({ providedIn: 'root' })
export class GetLoggedInUserUseCase {
  private readonly repo = inject(UserRepository);

  execute(): Observable<UserRecord> {
    return this.repo.getLoggedInUser();
  }
}
