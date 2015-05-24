module viewModels {
    export class BaseVM {
        constructor() {
            for (var i in this) {
                if (!this.hasOwnProperty(i) && typeof (this[i]) === "function" && i != "constructor") {
                    this[i] = this[i].bind(this);
                }
            }
        }
    }

    export class Page1VM extends BaseVM implements routing.routes.INavigationAware {
        currentCallback: any;
        num: KnockoutObservable<string> = ko.observable("0");
        confirmationVisible: KnockoutObservable<boolean> = ko.observable(false);
        forPayload: KnockoutObservable<any> = ko.observable({ text: "Hello from payload!" });

        constructor() {
            super();
        }

        showMagicNumber(): void {
            this.num(Math.floor(Math.random() * 100).toString());
        }

        canNavigateFrom(callback: (allow: boolean) => void): void {
            this.currentCallback = callback;
            this.confirmationVisible(true);
        }

        confirmYes(): void {
            this.currentCallback(true);
            this.confirmationVisible(false);
        }

        confirmNo(): void {
            this.currentCallback(false);
            this.confirmationVisible(false);
        }
    }

    export class Page2VM extends BaseVM implements routing.routes.INavigationAware {
        num: KnockoutObservable<string> = ko.observable("0");
        params: KnockoutObservable<any> = ko.observable({});

        constructor() {
            super();
        }

        showMagicNumber(): void {
            this.num("P2:" + Math.floor(Math.random() * 100));
        }
        
        onNavigatedTo(params, payload): void {
            this.params(params);
        }
    }

    export class Page3VM extends BaseVM implements routing.routes.INavigationAware {
        num: KnockoutObservable<string> = ko.observable("0");
        params: KnockoutObservable<any> = ko.observable({});
        payload: KnockoutObservable<any> = ko.observable(null);

        constructor() {
            super();
        }

        showMagicNumber(): void {
            this.num("P3:" + Math.floor(Math.random() * 11));
        }

        onNavigatedTo(params, payload): void {
            this.payload(ko.toJSON(payload));
        }

        onNavigatedFrom(): void {
            alert("Page 3 Left");
        }
    }
}