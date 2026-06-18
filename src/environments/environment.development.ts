// environment.development.ts
export const environment = {
    production: false,
    apiUrl: '/api'  // ← مش localhost، خلي Vercel يخدمه
};

// environment.ts (production)
// export const environment = {
//     production: true,
//     apiUrl: '/api'
// };