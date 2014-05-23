declare module viewModels {
    class BaseVM {
        constructor();
    }
    class Page1VM extends BaseVM implements routing.routes.INavigationAware {
        public currentCallback: any;
        public num: KnockoutObservable<string>;
        public confirmationVisible: KnockoutObservable<boolean>;
        public forPayload: KnockoutObservable<any>;
        constructor();
        public showMagicNumber(): void;
        public canNavigateFrom(callback: (allow: boolean) => void): void;
        public confirmYes(): void;
        public confirmNo(): void;
    }
    class Page2VM extends BaseVM implements routing.routes.INavigationAware {
        public num: KnockoutObservable<string>;
        public params: KnockoutObservable<any>;
        constructor();
        public showMagicNumber(): void;
        public onNavigatedTo(params: any, payload: any): void;
    }
    class Page3VM extends BaseVM implements routing.routes.INavigationAware {
        public num: KnockoutObservable<string>;
        public params: KnockoutObservable<any>;
        public payload: KnockoutObservable<any>;
        constructor();
        public showMagicNumber(): void;
        public onNavigatedTo(params: any, payload: any): void;
        public onNavigatedFrom(): void;
    }
}
