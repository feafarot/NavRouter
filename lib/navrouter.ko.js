// Navigation router UI knockout intagration JavaScript library v0.9.2
// (c) Roman Konkin (feafarot) - https://github.com/feafarot/navrouter
// License: MIT (http://www.opensource.org/licenses/mit-license.php)

(function () {
    var _router = null;

    function checkRouter() {
        if (_router == null || _router == undefined) {
            throw new Error("Router instance do not setted. Please set it usting 'Routing.ko.setCurrentRouter' method.");
        }
    }

    ko.bindingHandlers.navigate = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var navLink = valueAccessor(),
                bindings = allBindingsAccessor(),
                $elem = $(element),
                oldClass;
            if (element.tagName == "A") {
                $elem.attr("href", "#!/" + navLink);
            }
            else {
                $elem.click(function (event) {
                    if (_router.initialized) {
                        _router.navigateTo(navLink);
                    }
                });
            }

            function checkChilds(path, route) {
                if (Routing.Utils.getType(route) == "VirtualRoute" && route.childRoutes.length > 0) {
                    for (var i in route.childRoutes) {
                        if (_router.isMatches(route.childRoutes[i].pattern, path)) {
                            return true;
                        }
                        else if (checkChilds(path, route.childRoutes[i])) {
                            return true;
                        }
                    }
                }

                return false;
            };

            _router.currentRoute.subscribe(function () {
                var currentClass = $elem.attr("class");
                if (bindings.activeClass) {
                    var path = Routing.Utils.getHash(window.location).replace(_router.getHashSymbol(), "");
                    if (path == navLink || checkChilds(path, _router.getRoute(navLink))) {
                        if (!$elem.hasClass(bindings.activeClass)) {
                            oldClass = currentClass || null;
                            $elem.addClass(bindings.activeClass);
                        }
                    }
                    else {
                        if ($elem.hasClass(bindings.activeClass)) {
                            $elem.removeClass(bindings.activeClass);
                        }
                    }
                }
            });

            _router.refreshCurrentRoute();
        },
    };

    ko.bindingHandlers.navigateBack = {
        init: function (elem) {
            var $elem = $(elem);
            $elem.click(function () {
                _router.navigateBack();
            });
        }
    };

    Routing.ko = Routing.ko || {};
    Routing.ko.setCurrentRouter = function (router) {
        _router = router;
    };
})();