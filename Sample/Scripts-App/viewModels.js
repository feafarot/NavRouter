var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var viewModels;
(function (viewModels) {
    var BaseVM = (function () {
        function BaseVM() {
            for (var i in this) {
                if (!this.hasOwnProperty(i) && typeof (this[i]) === "function" && i != "constructor") {
                    this[i] = this[i].bind(this);
                }
            }
        }
        return BaseVM;
    })();
    viewModels.BaseVM = BaseVM;

    var Page1VM = (function (_super) {
        __extends(Page1VM, _super);
        function Page1VM() {
            _super.call(this);
            this.num = ko.observable("0");
            this.confirmationVisible = ko.observable(false);
            this.forPayload = ko.observable({ text: "Hello from payload!" });
        }
        Page1VM.prototype.showMagicNumber = function () {
            this.num(Math.floor(Math.random() * 100).toString());
        };

        Page1VM.prototype.canNavigateFrom = function (callback) {
            this.currentCallback = callback;
            this.confirmationVisible(true);
        };

        Page1VM.prototype.confirmYes = function () {
            this.currentCallback(true);
            this.confirmationVisible(false);
        };

        Page1VM.prototype.confirmNo = function () {
            this.currentCallback(false);
            this.confirmationVisible(false);
        };
        return Page1VM;
    })(BaseVM);
    viewModels.Page1VM = Page1VM;

    var Page2VM = (function (_super) {
        __extends(Page2VM, _super);
        function Page2VM() {
            _super.call(this);
            this.num = ko.observable("0");
            this.params = ko.observable({});
        }
        Page2VM.prototype.showMagicNumber = function () {
            this.num("P2:" + Math.floor(Math.random() * 100));
        };

        Page2VM.prototype.onNavigatedTo = function (params, payload) {
            this.params(params);
        };
        return Page2VM;
    })(BaseVM);
    viewModels.Page2VM = Page2VM;

    var Page3VM = (function (_super) {
        __extends(Page3VM, _super);
        function Page3VM() {
            _super.call(this);
            this.num = ko.observable("0");
            this.params = ko.observable({});
            this.payload = ko.observable(null);
        }
        Page3VM.prototype.showMagicNumber = function () {
            this.num("P3:" + Math.floor(Math.random() * 11));
        };

        Page3VM.prototype.onNavigatedTo = function (params, payload) {
            this.payload(ko.toJSON(payload));
        };

        Page3VM.prototype.onNavigatedFrom = function () {
            alert("Page 3 Left");
        };
        return Page3VM;
    })(BaseVM);
    viewModels.Page3VM = Page3VM;
})(viewModels || (viewModels = {}));
