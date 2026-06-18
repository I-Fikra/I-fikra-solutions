# Users Module — Clean Architecture

This module was refactored to follow **Clean Architecture** principles.
Each layer has a single responsibility and dependencies only flow **inward** — outer layers know about inner layers, never the reverse.

---

## Folder Structure

```
users/
├── domain/                         ← innermost layer, zero dependencies
│   ├── entities/
│   │   └── user.entity.ts          ← UserRecord type
│   └── repositories/
│       └── user.repository.ts      ← abstract class defining the data contract
│
├── application/                    ← orchestrates domain, no framework code
│   └── use-cases/
|       |── commands                ← action that we will take
|       |     |── update-logged-in-user.ts
|       └── queries                 ← data that we want to get
|             |── get-all-users.ts
|             └── get-logged-in-user.ts
│
├── infrastructure/                 ← implements domain contracts using HTTP
│   └── repositories/
│       └── user.repository.impl.ts ← concrete HTTP implementation
│
└── presentation/                   ← Angular components and pages
    ├── components/
    │   └── user-details/
    │       ├── user-details.ts
    │       ├── user-details.html
    │       └── user-details.scss
    └── pages/
        └── users/
            ├── users.ts
            ├── users.html
            └── users.scss
```

---

## Layer Responsibilities

### Domain
The core of the module. Contains business types and the **abstract** `UserRepository` class that declares what data operations exist — without knowing how they are implemented.

> No Angular, no HTTP, no UI — pure TypeScript.

### Application
Contains **use cases**, each representing a single operation the app can perform (e.g. "get the logged-in user"). They depend only on the domain layer and are the entry point for the presentation layer.

> If you need to add business logic before or after a data operation, do it here.

### Infrastructure
The concrete HTTP implementation of `UserRepository`. This is the only layer allowed to use `HttpClient`. It maps raw API responses to domain types.

> Swapping the backend (e.g. REST → GraphQL) means only touching this layer.

### Presentation
Angular components and pages. They call **use cases**, never repositories or HTTP services directly.

> `UserDetailsComponent` and `UsersPage` live here.

---

## Dependency Injection

`UserRepository` is an abstract class used as the DI token.
The binding is registered once in `src/app.config.ts`:

```typescript
{ provide: UserRepository, useClass: UserRepositoryImpl }
```

Use cases inject `UserRepository` (the abstraction). Angular resolves it to `UserRepositoryImpl` at runtime. If you ever need a mock for testing, you only replace this one line.

---

## How to Add a New Use Case

1. Add the method signature to `domain/repositories/user.repository.ts`.
2. Implement it in `infrastructure/repositories/user.repository.impl.ts`.
3. Create a new file under `application/use-cases/`.
4. Inject and call the use case from the relevant component in `presentation/`.

---

## Files Changed Outside This Module

| File | What changed |
|---|---|
| `src/app.config.ts` | Added `UserRepository` → `UserRepositoryImpl` provider |
| `src/app/foundation/core/layout/component/ProfileMenu.ts` | Replaced `UserService` injection with `GetLoggedInUserUseCase` |
| `src/app/services/iam/iam-management.routes.ts` | Updated lazy-load path to `presentation/pages/users/users` |
