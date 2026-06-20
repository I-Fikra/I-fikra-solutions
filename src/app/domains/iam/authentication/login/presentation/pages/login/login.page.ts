import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    // AbstractControl,
    FormBuilder,
    ReactiveFormsModule,
    // ValidationErrors,
    // Validators
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';

import { LoginUseCase } from '../../../application/login.usecase';
import { AuthCardComponent } from '../../../components/auth-card/auth-card.component';
import { TokenStorageService } from '../../../infrastructure/token-storage.service';
import { AUTH_REPOSITORY } from '../../../domain/ports/auth.repository';
import { AuthApiService } from '../../../infrastructure/auth-api.service';

@Component({
    selector: 'app-login-page',
    standalone: true,
    imports: [
        CommonModule,
        ButtonModule,
        CheckboxModule,
        InputTextModule,
        PasswordModule,
        ReactiveFormsModule,
        RouterModule,
        RippleModule,
        AuthCardComponent,
    ],
       providers: [
        { provide: AUTH_REPOSITORY, useClass: AuthApiService },
        TokenStorageService,
        LoginUseCase,
    ],
    templateUrl: './login.page.html',
    styleUrls: ['./login.page.scss']
})
export class LoginPage {

    private readonly fb = inject(FormBuilder);
    private readonly router = inject(Router);
    private readonly loginUseCase = inject(LoginUseCase);

    readonly isLoading = signal(false);
    readonly loginError = signal<string | null>(null);

    readonly loginForm = this.fb.group({
        username: [''/*, [Validators.required, Validators.minLength(3), Validators.maxLength(50), this.usernameValidator()]*/],
        password: [''/*, [Validators.required, Validators.minLength(6)]*/],
        rememberMe: [false]
    });

    get f() { return this.loginForm.controls; }

    submit(): void {
        if (this.loginForm.invalid) {
            this.loginForm.markAllAsTouched();
            return;
        }

        this.isLoading.set(true);
        this.loginError.set(null);

        this.loginUseCase.execute({
            username: this.loginForm.value.username!,
            password: this.loginForm.value.password!
        }).subscribe({
            next: () => {
                this.isLoading.set(false);
                this.router.navigate(['/']);
            },
            error: () => {
                this.isLoading.set(false);
                this.loginError.set('Invalid username or password.');
            }
        });
    }

    // private usernameValidator() {
    //     return (control: AbstractControl): ValidationErrors | null => {
    //         const value = control.value;
    //         if (!value) return null;
    //
    //         if (!/^[a-zA-Z0-9._-]+$/.test(value))
    //             return { invalidUsername: 'Username can only contain letters, numbers, dots, hyphens, and underscores' };
    //
    //         if (/^[.-]|[.-]$/.test(value))
    //             return { invalidUsername: 'Username cannot start or end with a dot or hyphen' };
    //
    //         if (/[._-]{2,}/.test(value))
    //             return { invalidUsername: 'Username cannot have consecutive special characters' };
    //
    //         return null;
    //     };
    // }
}