declare module viewModels {
    class BaseVM {
        constructor();
    }
    class Page1VM extends BaseVM {
        public currentCallback: any;
        public num: KnockoutObservable<string>;
        public confirmationVisible: KnockoutObservable<boolean>;
        public forPayload: KnockoutObservable<any>;
        constructor();
        public showMagicNumber(): void;
        public canLeave(callback: any): void;
        public confirmYes: () => void;
        public confirmNo: () => void;
    }
    class Page2VM extends BaseVM {
        public num: KnockoutObservable<string>;
        public params: KnockoutObservable<any>;
        constructor();
        public showMagicNumber(): void;
        public onNav(params: any, payload: any): void;
    }
    class Page3VM extends BaseVM {
        public num: KnockoutObservable<string>;
        public params: KnockoutObservable<any>;
        public payload: KnockoutObservable<any>;
        constructor();
        public showMagicNumber(): void;
        public onNav(params: any, payload: any): void;
    }
}
