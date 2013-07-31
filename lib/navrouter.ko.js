// Navigation router UI knockout intagration JavaScript library v0.8.0
// (c) Roman Konkin - https://github.com/feafarot/navrouter
// License: MIT (http://www.opensource.org/licenses/mit-license.php)

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
                if (router.initialized) {
                    router.navigateTo(navLink);
                }
            });
        }

        function checkChilds(path, route) {
            if (getType(route) == "VirtualRoute" && route.childRoutes.length > 0) {
                for (var i in route.childRoutes) {
                    if (router.isMatches(route.childRoutes[i].pattern, path)) {
                        return true;
                    }
                    else if (checkChilds(path, route.childRoutes[i])) {
                        return true;
                    }
                }
            }

            return false;
        };

        router.currentRoute.subscribe(function () {
            var currentClass = $elem.attr("class");
            if (bindings.activeClass) {
                var path = getHash(window.location).replace(router.getHashSymbol(), "");
                if (path == navLink || checkChilds(path, router.getRoute(navLink))) {
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

        router.refreshCurrentRoute();
    },
};

ko.bindingHandlers.navigateBack = {
    init: function (elem) {
        var $elem = $(elem);
        $elem.click(function () {
            router.navigateBack();
        });
    }
};