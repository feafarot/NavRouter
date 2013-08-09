// Navigation router UI knockout intagration JavaScript library v0.9.6
// (c) Roman Konkin (feafarot) - https://github.com/feafarot/navrouter
// License: MIT (http://www.opensource.org/licenses/mit-license.php)

(function () {
    var _router = null;

    function checkRouter() {
        if (_router == null || _router == undefined) {
            throw new Error("Router instance do not setted. Please set it usting 'Routing.ko.setCurrentRouter' method.");
        }
    }
    
    function isString(obj) {
        return typeof obj == "string" || obj instanceof String;
    }

    ko.bindingHandlers.navigate = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var $elem = $(element),
                bindings = allBindingsAccessor(),
                navLink = valueAccessor(),
                payload = null,
                oldClass;
            
            payload = bindings.payload || null;
            if (element.tagName == "A" && payload == null) {
                $elem.attr("href", "#!/" + navLink);
            }            
            else {
                if (element.tagName == "A") {
                    $elem.attr("href", "#");
                }
                
                $elem.click(function (event) {
                    event.stopImmediatePropagation();
                    event.preventDefault();
                    if (_router.initialized) {
                    	if (payload == null) {
	                        _router.navigateTo(navLink);
                        }
                        else {
                            
                        	_router.navigateTo(navLink, false, ko.utils.unwrapObservable(payload));
                        }
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
        init: function (elem, valueAccessor) {
            var $elem = $(elem),
                options = valueAccessor(),
                forceNavigationInCache = options.forceNavigationInCache || false;
            
            $elem.click(function () {
                if (forceNavigationInCache) {
                    _router.navigateBackInCache();
                } else {
                    _router.navigateBack();
                }
            });
        }
    };

    Routing.ko = Routing.ko || {};
    Routing.ko.setCurrentRouter = function (router) {
        _router = router;
    };
})();