function Page1VM() {
    var $ref = this,
        currentCallback = null;

    router.cancelledByUrl(function () {
        $ref.confirmationVisible(false);
    });

    $ref.num = ko.observable(0);
    $ref.forPayload = ko.observable({ text: "Hello from payload!" });
    $ref.confirmationVisible = ko.observable(false);
    $ref.showMagicNumber = function () {
        $ref.num(Math.floor(Math.random() * 100));
    };
    $ref.canLeave = function (callback) {
        currentCallback = callback;
        $ref.confirmationVisible(true);
    };
    $ref.confirmYes = function () {
        currentCallback(true);
        $ref.confirmationVisible(false);
    };
    $ref.confirmNo = function () {
        currentCallback(false);
        $ref.confirmationVisible(false);
    };
}

function Page2VM() {
    var $ref = this;
    $ref.num = ko.observable();
    $ref.showMagicNumber = function () {
        $ref.num("P2:" + Math.floor(Math.random() * 11));
    };

    $ref.params = ko.observable({});
    $ref.onNav = function (params, payload) {
        $ref.params(params);
    };
}

function Page3VM() {
    var $ref = this;
    $ref.num = ko.observable();
    $ref.payload = ko.observable(null);
    $ref.showMagicNumber = function () {
        $ref.num("P3:" + Math.floor(Math.random() * 11));
    };
    $ref.onNav = function (params, payload) {
        $ref.payload(ko.toJSON(payload));        
    };
}

function Page4VM() {
    var $ref = this;
    $ref.canLeave = function (callback) {

    };
}