import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';

import { AuthCardComponent } from '../../login/components/auth-card/auth-card.component';

/** Cross-field validator: password === confirmPassword */
function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return password && confirmPassword && password !== confirmPassword
        ? { passwordMismatch: true }
        : null;
}

@Component({
    selector: 'app-reset-password',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        ButtonModule,
        PasswordModule,
        RouterModule,
        AuthCardComponent,   // ✅ replaces AppFloatingConfigurator + layout boilerplate
    ],
    templateUrl: './reset-password.html',
    styleUrls: ['./reset-password.scss']
})
export class ResetPassword {

    resetForm: FormGroup;

    constructor(private fb: FormBuilder) {
        this.resetForm = this.fb.group(
            {
                password: ['', [Validators.required, Validators.minLength(6)]],
                confirmPassword: ['', Validators.required],
            },
            { validators: passwordMatchValidator }
        );
    }

    submit() {
        if (this.resetForm.invalid) {
            this.resetForm.markAllAsTouched();
            return;
        }

        console.log('NEW PASSWORD:', this.resetForm.value.password);

        // TODO: call API to persist new password
    }

    get f() {
        return this.resetForm.controls;
    }
}