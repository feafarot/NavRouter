declare module viewModels {
    class BaseVM {
        constructor();
    }
    class Page1VM extends BaseVM implements routing.routes.INavigationAware {
        currentCallback: any;
        num: KnockoutObservable<string>;
        confirmationVisible: KnockoutObservable<boolean>;
        forPayload: KnockoutObservable<any>;
        constructor();
        showMagicNumber(): void;
        canNavigateFrom(callback: (allow: boolean) => void): void;
        confirmYes(): void;
        confirmNo(): void;
    }
    class Page2VM extends BaseVM implements routing.routes.INavigationAware {
        num: KnockoutObservable<string>;
        params: KnockoutObservable<any>;
        constructor();
        showMagicNumber(): void;
        onNavigatedTo(params: any, payload: any): void;
    }
    class Page3VM extends BaseVM implements routing.routes.INavigationAware {
        num: KnockoutObservable<string>;
        params: KnockoutObservable<any>;
        payload: KnockoutObservable<any>;
        constructor();
        showMagicNumber(): void;
        onNavigatedTo(params: any, payload: any): void;
        onNavigatedFrom(): void;
    }
}
