﻿
var routes = [
    new routing.routes.NavigationRoute("pages/p1", "page1.html",
        { cacheView: true, isDefault: true, vmFactory: (callback) => { callback(new viewModels.Page1VM()); }, title: "Page #1" }),
    new routing.routes.NavigationRoute("pages/p2/{name}/{?value}", "page2.html?name={name}",
        { cacheView: false, vmFactory: (callback) => { callback(new viewModels.Page2VM()); }, title: "Page #2" }),
    new routing.routes.NavigationRoute("pages/p3", "page3.html",
        { cacheView: false, vmFactory: (callback) => { callback(new viewModels.Page3VM()); }, title: "Page #3" }),
];

var router = new routing.Router(
    "views-placeholder",
    {
        enableLogging: true,
        preloadEnabled: true,
        navigationError: () =>
        {
            router.navigateBack();
        }
    },
    routes);
routing.knockout.setCurrentRouter(router);
ko.applyBindings({});
router.run();