function Page1VM() {
    var $ref = {};
    $ref.num = ko.observable(0);
    $ref.forPayload = ko.observable({ text: "Hello from payload!"});
    $ref.showMagicNumber = function () {
        $ref.num(Math.floor(Math.random() * 100));
    };
    $ref.canLeave = function (callback) {

    };

    return $ref;
}

function Page2VM() {
    var $ref = {};
    $ref.num = ko.observable();
    $ref.showMagicNumber = function () {
        $ref.num("P2:" + Math.floor(Math.random() * 11));
    };

    $ref.params = ko.observable({});
    $ref.onNav = function (params, payload) {
        $ref.params(params);
    };

    return $ref;
}

function Page3VM() {
    var $ref = {};
    $ref.num = ko.observable();
    $ref.payload = ko.observable(null);
    $ref.showMagicNumber = function () {
        $ref.num("P3:" + Math.floor(Math.random() * 11));
    };
    $ref.onNav = function (params, payload) {
        $ref.payload(ko.toJSON(payload));        
    };

    return $ref;
}