// environment.ts
// نقطة الدخول الافتراضية لـ environment — بيتستبدل بـ environment.production.ts
// وقت بناء production عن طريق fileReplacements في angular.json (انظر "configurations.production.fileReplacements").
// أي import بمسار '@/environments/environment' (بدون development/production) لازم يجي من هنا.
export const environment = {
    production: false,
    apiUrl: '/api'
};
