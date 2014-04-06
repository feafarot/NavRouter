module viewModels
{
    export class BaseVM
    {
        constructor()
        {
            for (var i in this)
            {
                if (!this.hasOwnProperty(i) && typeof (this[i]) === "function" && i != "constructor")
                {
                    this[i] = this[i].bind(this);
                }
            }
        }
    }

    export class Page1VM extends BaseVM
    {
        currentCallback: any;
        num: KnockoutObservable<string> = ko.observable("0");
        confirmationVisible: KnockoutObservable<boolean> = ko.observable(false);
        forPayload: KnockoutObservable<any> = ko.observable({ text: "Hello from payload!" });

        constructor()
        {
            super();
        }

        showMagicNumber()
        {
            this.num(Math.floor(Math.random() * 100).toString());
        }

        canLeave(callback): void
        {
            this.currentCallback = callback;
            this.confirmationVisible(true);
        }

        confirmYes = function ()
        {
            this.currentCallback(true);
            this.confirmationVisible(false);
        }

        confirmNo = function ()
        {
            this.currentCallback(false);
            this.confirmationVisible(false);
        }
    }

    export class Page2VM extends BaseVM
    {
        num: KnockoutObservable<string> = ko.observable("0");
        params: KnockoutObservable<any> = ko.observable({});

        constructor()
        {
            super();
        }

        showMagicNumber()
        {
            this.num("P2:" + Math.floor(Math.random() * 100));
        }
        
        onNav (params, payload)
        {
            this.params(params);
        }
    }

    export class Page3VM extends BaseVM
    {
        num: KnockoutObservable<string> = ko.observable("0");
        params: KnockoutObservable<any> = ko.observable({});
        payload: KnockoutObservable<any> = ko.observable(null);

        constructor()
        {
            super();
        }

        showMagicNumber()
        {
            this.num("P3:" + Math.floor(Math.random() * 11));
        }

        onNav(params, payload)
        {
            this.payload(ko.toJSON(payload));
        }
    }
}