var routes = [
    new routing.routes.NavigationRoute("pages/p1", "page1.html", { cacheView: true, isDefault: true, vmFactory: function (callback) {
            callback(new viewModels.Page1VM());
        }, vmCanLeave: "canLeave", title: "Page #1" }),
    new routing.routes.NavigationRoute("pages/p2/:name/:value", "page2.html?value={value}", { cacheView: false, vmFactory: function (callback) {
            callback(new viewModels.Page2VM());
        }, onNavigateTo: "onNav", title: "Page #2" }),
    new routing.routes.NavigationRoute("pages/p3", "page3.html", { cacheView: false, vmFactory: function (callback) {
            callback(new viewModels.Page3VM());
        }, onNavigateTo: "onNav", title: "Page #3" })
];

var router = new routing.Router("views-placeholder", {
    enableLogging: true,
    preloadEnabled: true,
    preloadComplete: function () {
        //indication.app.hide();
    },
    beforeNavigation: function () {
        //indication.main.show();
    },
    afterNavigation: function () {
        //indication.main.hide();
    },
    navigationError: function () {
        router.navigateBack();
    }
}, routes);
routing.knockout.setCurrentRouter(router);
ko.applyBindings({});
router.run();
//# sourceMappingURL=config.js.map
