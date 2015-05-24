/// <reference path="../Scripts/typings/jquery/jquery.d.ts" />
/// <reference path="../Scripts/typings/knockout/knockout.d.ts" />
/// <reference path="Router.ts" />

interface KnockoutBindingHandlers {
    navigate: KnockoutBindingHandler;
    navigateBack: KnockoutBindingHandler;
}

module routing.knockout {
    var _router: Router = null;

    export function setCurrentRouter(router: Router): void {
        _router = router;
    }

    function checkRouter(): void {
        if (_router == null || _router == undefined) {
            throw new Error("Router instance do not setted. Please set it usting 'Routing.ko.setCurrentRouter' method.");
        }
    }

    function isString(obj: any): boolean {
        return typeof obj == "string" || obj instanceof String;
    }

    ko.bindingHandlers.navigate = {
        init: (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) =>
        {
            var $elem = $(element),
                bindings = allBindingsAccessor(),
                navLink = valueAccessor(),
                payload = null,
                forceReloadOnNavigation = bindings.forceReload || false,
                forceNavigationInCache = bindings.forceNavigationInCache || false,
                oldClass;

            payload = bindings.payload || null;
            if (element.tagName == "A" && payload == null && false) { // TODO: Hack. Rework!
                $elem.attr("href", "#!/" + navLink);
            }
            else {
                if (element.tagName == "A") {
                    $elem.attr("href", "#");
                }

                $elem.click((event) => {
                    event.preventDefault();
                    if (_router.initialized) {
                        if (payload == null) {
                            _router.navigateTo(
                                navLink,
                                {
                                    removeCurrentHistory: false,
                                    forceReload: ko.utils.unwrapObservable(forceReloadOnNavigation),
                                    forceNavigationInCache: ko.utils.unwrapObservable(forceNavigationInCache)
                                });
                        }
                        else {
                            _router.navigateTo(
                                navLink,
                                {
                                    payload: ko.utils.unwrapObservable(payload),
                                    removeCurrentHistory: false,
                                    forceReload: ko.utils.unwrapObservable(forceReloadOnNavigation),
                                    forceNavigationInCache: ko.utils.unwrapObservable(forceNavigationInCache)
                                });
                        }
                    }
                });
            }

            var checkChilds = (path: string, route: routes.Route) => {
                if (route instanceof routes.VirtualRoute && (<routes.VirtualRoute>route).childRoutes.length > 0) {
                    for (var i in (<routes.VirtualRoute>route).childRoutes) {
                        if (_router.isMatches((<routes.VirtualRoute>route).childRoutes[i].pattern, path)) {
                            return true;
                        }
                        else if (checkChilds(path, (<routes.VirtualRoute>route).childRoutes[i])) {
                            return true;
                        }
                    }
                }

                return false;
            };

            _router.currentRoute.subscribe(() => {
                var currentClass = $elem.attr("class");
                if (bindings.activeClass) {
                    var path = routing.utils.getHash(window.location).replace(_router.getHashSymbol(), "");
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

            //_router.refreshCurrentRoute();
        },
    };

    ko.bindingHandlers.navigateBack = {
        init: function (elem, valueAccessor) {
            var $elem = $(elem),
                options = valueAccessor(),
                forceNavigationInCache = options.forceNavigationInCache || false;

            $elem.click(() => {
                if (forceNavigationInCache) {
                    _router.navigateBackInCache();
                }
                else {
                    _router.navigateBack();
                }
            });
        }
    };
}