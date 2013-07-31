// Navigation router JavaScript library v0.8.0
// (c) Roman Konkin - https://github.com/feafarot/navrouter
// License: MIT (http://www.opensource.org/licenses/mit-license.php)

//---Utils--------------------------------------------------------------------------------------------------------------------------*
function isNull(target) {
    return target == null;
};

function isNotNull(target) {
    return target != null;
};

function isUndefined(target) {
    return typeof target == "undefined";
};

function isNotUndefined(target) {
    return typeof target != "undefined";
};

function isNoU(target) {
    return isUndefined(target) || isNull(target);
};

function isNotNoU(target) {
    return isNotUndefined(target) && isNotNull(target);
};

function getType(obj) {
    var funcNameRegex = /function (.+)\(/;
    var results = (funcNameRegex).exec((obj).constructor.toString());
    return (results && results.length > 1) ? results[1] : "";
};

function getHash(path) {
    if (typeof path != "String" && path.toString != "undefined") {
        path = path.toString();
    }

    var matches = path.match(/^[^#]*(#.+)$/);
    var hash = matches ? matches[1] : '';
    return hash;
};


//---Classes------------------------------------------------------------------------------------------------------------------------*
function Route(routePattern, options) {
    if (isNoU(routePattern)) {
        throw new Error("Route pattern should be specified!");
    }

    this.parrentRoute = null;
    this.pattern = routePattern || null;
    if (isNoU(options)) {
        this.isDefault = false;
        this.canLeave = function () { return true };
        return;
    }

    this.isDefault = options.isDefault || false;
    this.canLeave = options.canLeave || function (callback) { callback(true); };
};

function VirtualRoute(routePattern, childRoutes, options) {
    this.childRoutes = childRoutes || new Array();
    return $.extend(this, new Route(routePattern, options));
};

function FuncRoute(routePattern, func, options) {
    this.func = func || null;
    return $.extend(this, new Route(routePattern, options));
}

function NavigationRoute(routePattern, viewPath, options) {
    var $ref = this;
    if (isNoU(viewPath)) {
        throw new Error("Route view path should be specified!");
    }

    this.viewPath = viewPath || null;
    this.currentVM = null;
    if (isNoU(options)) {
        this.cacheView = true;
        this.vmFactory = null;
        this.onNavigateTo = null;
        this.title = null;
        this.toolbarId = null;
        this.state = loadingState.complete;
    }
    else {
        if (options.vmCanLeave) {
            options.canLeave = function (callback) {
                if (isNotNoU($ref.currentVM) && isNotNoU($ref.currentVM[options.vmCanLeave])) {
                    return $ref.currentVM[options.vmCanLeave](callback);
                }

                return true;
            };
        }

        this.toolbarId = options.toolbarId || null;
        this.cacheView = options.cacheView == undefined ? true : options.cacheView;
        this.vmFactory = options.vmFactory || null;
        this.onNavigateTo = options.onNavigateTo || null;
        this.title = options.title || null;
        this.state = loadingState.complete;
    }

    return $.extend(this, new Route(routePattern, options));
};

var loadingState = new (function () {
    var $ref = {
        canceled: -1,
        complete: 1,
        loading: 2
    };
    return $ref;
})();

function RouteHandler(pattern, handler) {
    var __ins = {};
    __ins.pattern = pattern || null;
    __ins.handler = handler || null;
    return __ins;
};

function HashService() {
    var __ins = {},
        prevHash,
        preventNextEvent = false;

    function changingCallback(cancelNavigation) {
        if (cancelNavigation) {
            preventNextEvent = true;
        }
    };

    function hashChanged(newHash) {
        if (isNotNoU(__ins.on_changing)) {
            __ins.on_changing(newHash, changingCallback);
        }

        if (preventNextEvent) {
            window.location.hash = prevHash || "";
            return;
        }

        if (isNotNoU(__ins.hash) || __ins.hash == "") {
            prevHash = newHash;
        } else {
            prevHash = __ins.hash;
        }

        __ins.hash = newHash;

        if (isNotNoU(__ins.on_changed)) {
            __ins.on_changed(newHash);
        }

        if (isNotNoU(__ins.on_afterChanged)) {
            __ins.on_afterChanged(newHash);
        }
    };

    __ins.hash = "";
    __ins.on_changing = null;
    __ins.on_changed = null;
    __ins.on_afterChanged = null;

    __ins.setHash = function (hash) {
        window.location.hash = hash;
    };
    __ins.start = function () {
        if ("onhashchange" in window) { // event supported (Google Chrome 5+, Safari 5+, Opera 10.60+, Firefox 3.6+ and Internet Explorer 8+)
            window.onhashchange = function () {
                if (preventNextEvent) {
                    preventNextEvent = false;
                    return;
                }

                hashChanged(window.location.hash);
            }
        }
        else { // event not supported
            var storedHash = window.location.hash;
            window.setInterval(function () {
                if (window.location.hash != storedHash) {
                    if (preventNextEvent) {
                        preventNextEvent = false;
                        return;
                    }

                    storedHash = window.location.hash;
                    hashChanged(storedHash);
                }
            }, 100);
        }

        if (window.location.hash) {
            onhashchange(window.location.hash);
        }
    };

    return __ins;
};

//---Router singletone--------------------------------------------------------------------------------------------------------------*
var router = new (function () {
    //# Private fields
    var $ref = {},
        hashSymbol = "#!/",
        sammy,
        hashService = new HashService(),
        defaultPath = "",
        defaultRoute = null,
        currentHash = "",
        startupUrl = "",
        isRedirecting = false,
        preventRaisingNavigateTo = false,
        containerId = "",
        allRoutes = new Array(),
        handlers = new Array(),
        defaultTitle,
        aroundPreventNextCall = false,
        previousRoute = ko.observable(null),
        backNavigation = false,
        forceCaching = false,
        fresh = true,

        viewPreloadingCompleteHandler = null,
        beforeNavigationHandler = null,
        afterNavigationHandler = null,
        navigationErrorHandler = null;

    //# Private functions
    function loadView(path, region, callback) {
        callback(true);
    };

    function writeLog(message) {
        if ($ref.loggingEnabled) {
            console.log("Router >> " + message);
            //logger.info("Router >> " + message);
        }
    };

    function getRoute(routeLink) {
        var delegate = function (x) {
            var path2 = routeLink.toString().replace(hashSymbol, "");
            var result = isMatches(x.pattern, path2);
            return result;
        };
        var res = null;
        for (var i = 0; i < allRoutes.length; i++) {
            if (delegate(allRoutes[i])) {
                res = allRoutes[i];
            }
        }

        return res;
    };

    function isMatches(path1, path2) {
        var result = true,
            path1Parts = path1.toString().split("/"),
            path2Parts = path2.toString().split("/");
        if (path1Parts.length == path2Parts.length) {
            for (var i = 0; i < path1Parts.length; i++) {
                if (!path1Parts[i].match(/^:.+/) && path1Parts[i] != path2Parts[i]) {
                    return false;
                }
            }
        }
        else {
            result = false;
        }

        return result;
    }

    function getPathForRoute(route) {
        if (route) {
            if (getType(route) == "VirtualRoute") {
                var defaultChild = Linq(route.childRoutes).SingleOrDefault(null, function (x) { return x.isDefault; });
                if (defaultChild == null) {
                    throw new Error("Route '" + route.pattern + "' have invalid configuration of child elements.");
                }

                return getPathForRoute(defaultChild);
            }

            return route.pattern;
        }

        return null;
    };

    function getCompletePath(path, params) {
        var matches = path.toString().match(/\{.+\}/);
        var completePath = path.toString();
        if (matches) {
            for (var i = 0; i < matches.length; i++) {
                var paramName = matches[i].toString().replace("{", "").replace("}", "");
                completePath = completePath.replace("{" + paramName + "}", params[paramName]);
            }
        }

        return completePath;
    };

    function create(className) {
        return eval("new " + className + "()");
    };

    function initRoute(routeToMap) {
        function raiseOnNavigateTo(context) {
            if (routeToMap.onNavigateTo != null && (!isRedirecting || !preventRaisingNavigateTo)) {
                var params = context.params;
                routeToMap.currentVM[routeToMap.onNavigateTo](params);
            }
        };

        allRoutes.push(routeToMap);
        writeLog("Registering route '" + routeToMap.pattern + "'.");
        switch (getType(routeToMap)) {
            case "FuncRoute":
                handlers.push(new RouteHandler(routeToMap.pattern, function (context) {
                    routeToMap.func();
                }));
                break;
            case "VirtualRoute":
                if (routeToMap.childRoutes) {
                    for (var i in routeToMap.childRoutes) {
                        routeToMap.childRoutes[i].parrentRoute = routeToMap;
                        routeToMap.childRoutes[i].pattern = routeToMap.pattern + "/" + routeToMap.childRoutes[i].pattern;
                        initRoute(routeToMap.childRoutes[i]);
                    }
                }

                break;
            case "NavigationRoute":
                handlers.push(new RouteHandler(routeToMap.pattern, function (context) {
                    function completeNavigation() {
                        context.associeatedRoute.state = loadingState.complete;
                        if (isNotNull(afterNavigationHandler)) {
                            afterNavigationHandler();
                        }

                        if (fresh) {
                            fresh = false;
                        }
                    };

                    function onNavigationError() {
                        if (isNotNull(navigationErrorHandler)) {
                            writeLog("Navigation error is handling...")
                            navigationErrorHandler();
                        }
                    };

                    if (isNotNull(beforeNavigationHandler)) {
                        beforeNavigationHandler();
                    }

                    context.associeatedRoute.state = loadingState.loading;
                    indication.main.show("Loading view...");
                    var jelem = $("#" + containerId);
                    var completePath = getCompletePath(routeToMap.viewPath, context.params);
                    var existing = $("[data-view=\"" + routeToMap.pattern + "\"]", jelem);
                    var preventRaisingNavigateToCache = preventRaisingNavigateTo;
                    if (forceCaching) {
                        routeToMap.enabled
                    }

                    if (isNotNoU(routeToMap.title)) {
                        document.title = routeToMap.title;
                    }
                    else {
                        document.title = defaultTitle;
                    }

                    if (existing && existing.length >= 1) {
                        if (routeToMap.cacheView) {
                            jelem.children().hide();
                            existing.show();
                            if (!preventRaisingNavigateToCache) {
                                raiseOnNavigateTo(context);
                            }

                            completeNavigation();
                        }
                        else if (!preventRaisingNavigateToCache) {
                            $.ajax({
                                url: completePath,
                                data: null,
                                cache: false,
                                error: onNavigationError,
                                success: function (response) {
                                    if (routeToMap.state == loadingState.canceled) {
                                        writeLog("Navigation to " + context.path + " was cancelled!");
                                        return;
                                    }

                                    if (routeToMap.vmFactory != null) {
                                        // Fix bug with actions REWORK TO ANOTHER SOLUTION IF POSSIBLE
                                        if (document.getElementById(existing.selector)) {
                                            ko.cleanNode(existing.get(0));
                                        }
                                    }
                                    existing.html(response);
                                    if (routeToMap.vmFactory != null) {
                                        var factory = eval(routeToMap.vmFactory);
                                        factory(function (instance) {
                                            ko.applyBindings(instance, existing.get(0));
                                            routeToMap.currentVM = instance;
                                            jelem.children().hide();
                                            if (!preventRaisingNavigateToCache) {
                                                raiseOnNavigateTo(context);
                                            }

                                            existing.show();
                                            completeNavigation();
                                        });
                                    } else {
                                        routeToMap.currentVM = null;
                                        jelem.children().hide();
                                        if (!preventRaisingNavigateToCache) {
                                            raiseOnNavigateTo(context);
                                        }

                                        existing.show();
                                        completeNavigation();
                                    }
                                }
                            });
                        } else {
                            completeNavigation();
                        }
                    }
                    else {
                        $.ajax({
                            url: completePath,
                            data: null,
                            cache: false,
                            error: onNavigationError,
                            success: function (response) {
                                if (routeToMap.state == loadingState.canceled) {
                                    writeLog("Navigation to " + context.path + " were cancelled!");
                                    return;
                                }

                                jelem.children().hide();
                                jelem.append("<div data-view=\"" + routeToMap.pattern + "\">" + response + "</div>");
                                if (routeToMap.vmFactory != null) {
                                    existing = $("[data-view=\"" + routeToMap.pattern + "\"]", jelem).get(0);
                                    var factory = eval(routeToMap.vmFactory);
                                    factory(function (instance) {
                                        ko.applyBindings(instance, existing);
                                        routeToMap.currentVM = instance;
                                        if (!preventRaisingNavigateToCache) {
                                            raiseOnNavigateTo(context);
                                        }

                                        completeNavigation();
                                    });
                                } else {
                                    if (!preventRaisingNavigateToCache) {
                                        raiseOnNavigateTo(context);
                                    }

                                    existing.show();
                                    completeNavigation();
                                }
                            }
                        });
                    }
                }));
                break;
        }
    };

    function fixPath(path) {
        if (!path.match(/^/ + hashSymbol + /.+/)) {
            return hashSymbol + path.replace("#/",  "");
        }
    };

    function preloadAllViews() {

    };

    //# Public fields
    $ref.loggingEnabled = true;
    $ref.initialized = false;
    $ref.routes = new Array();
    if (ko && ko.observable) {
        $ref.currentRoute = ko.observable(null);
    }
    else {
        $ref.currentRoute = new (function () {
            var _currentRoute = null;
            return function (value) {
                if (isUndefined(value)) {
                    return _currentRoute;
                } else {
                    _currentRoute = value;
                    return _currentRoute;
                }
            }
        })();
    }

    $ref.history = new Array();

    $ref.getRoute = getRoute;
    $ref.isMatches = isMatches;

    $ref.navigateTo = function (path, removeCurrentHistory) {
        var actualPath = path;
        var relRoute = getRoute(path);

        if (removeCurrentHistory) {
            $ref.history.pop();
        }

        if (relRoute != null && getType(relRoute) == "VirtualRoute") {
            actualPath = getPathForRoute(relRoute);
        }

        if (actualPath == currentHash || hashSymbol + actualPath == currentHash) {
            //$ref.refresh();
        } else {
            actualPath = fixPath(actualPath);
            hashService.setHash(actualPath);
        }
    };

    $ref.navigateBack = function () {
        $ref.history.pop()
        var last = $ref.history.pop();
        $ref.history.push(last);
        if (isUndefined(last)) {
            last = defaultPath
        } else {
            backNavigation = true;
        }

        hashService.setHash(last);
    };

    $ref.navigateHome = function () {
        $ref.navigateTo(startupUrl);
    };

    $ref.getHashSymbol = function () {
        return hashSymbol;
    };

    $ref.registerRoute = function (routeToMap) {
        $ref.routes.push(routeToMap);
        if (routeToMap.isDefault) {
            defaultRoute = routeToMap;
            defaultPath = getPathForRoute(routeToMap);
        }

        initRoute(routeToMap);
    };

    $ref.registerRoutes = function (routesToMap) {
        for (var i in routesToMap) {
            $ref.registerRoute(routesToMap[i]);
        }

        defaultPath = hashSymbol + getPathForRoute(defaultRoute);
    };

    $ref.refreshCurrentRoute = function () {
        var pureHash = getHash(window.location.toString()).replace(hashSymbol, "");
        var route = getRoute(pureHash);
        if (route != null) {
            $ref.currentRoute(route);
        }
    };

    $ref.init = function (routes, mainContainerId, options) {
        function getContext(route, hash) {
            var context = {};
            context.associeatedRoute = route;
            context.path = hash.replace(hashSymbol, "");
            var params = {};
            var patternParts = route.pattern.split("/");
            var pathParts = hash.replace(hashSymbol, "").split("/");
            if (pathParts.length != patternParts.length) {
                throw new Error("Invalid path. Unable to create navigation context.");
            }

            for (var i = 0; i < patternParts.length; i++) {
                if (patternParts[i].toString().match(/^:.+/)) {
                    var paramName = patternParts[i].toString().replace(":", "");
                    params[paramName] = pathParts[i];
                }
            }

            context.params = params;
            return context;
        };

        hashService.on_changing = function (hash, callback) {
            if (isNoU(getRoute(hash))) {
                callback(true);
                writeLog("Navigation to '" + hash + "' was prevented. The route to this pattern was not found.")
                return;
            }

            if ($ref.currentRoute() == null) {
                callback(false);
                return;
            }

            // Can leave route processing.
            var context = this;
            if (!isRedirecting) {
                $ref.currentRoute().canLeave(function (response) {
                    if (!response) {
                        isRedirecting = true;
                        preventRaisingNavigateTo = true;
                        hashService.setLocation(currentHash);
                    }
                    else {
                        isRedirecting = false;
                        currentHash = hash;
                        callback();
                        preventRaisingNavigateTo = false;
                    }
                });
            }
            else {
                isRedirecting = false;
                currentHash = hash;
                callback(false);
                preventRaisingNavigateTo = false;
            }
        };

        hashService.on_changed = function (hash) {
            var route = getRoute(hash);
            var context = getContext(route, hash);
            var routeHandler;
            var delegate = function (x) { return x.pattern == route.pattern; };
            for (var i = 0; i < handlers.length; i++) {
                if (delegate(handlers[i])) {
                    routeHandler = handlers[i];
                }
            }

            if (isNotNoU($ref.currentRoute())) {
                $ref.currentRoute().state = loadingState.canceled;
            }

            routeHandler.handler(context);
        };
        hashService.on_afterChanged = function (hash) {
            if (!preventRaisingNavigateTo) {
                writeLog("Navigated to '" + hash + "'");
                if (!backNavigation) {
                    $ref.history.push(hash);
                } else {
                    backNavigation = false;
                }
            }
            else {
                writeLog("Navigion was prevented");
            }

            $ref.refreshCurrentRoute();
        };

        if (isNotNoU(options)) {
            forceCaching = options.preloadEnabled || false;
            onPreloadComplete = options.preloadComplete || null;
            beforeNavigationHandler = options.beforeNavigation || null;
            afterNavigationHandler = options.afterNavigation || null;
            navigationErrorHandler = options.navigationError || null;
            $ref.loggingEnabled = options.enableLogging || true;
        }

        containerId = mainContainerId;
        $ref.initialized = true;
        $ref.registerRoutes(routes);
        $(document).ready($ref.updateRegions);
        writeLog("Initialized.");
        return { run: $ref.run };
    };

    $ref.run = function () {
        if (forceCaching) {
            preloadAllViews(); // TODO: Implement preloading functionality!
            if (isNotNoU(onPreloadComplete)) {
                onPreloadComplete();
            }
        }

        defaultTitle = document.title;
        writeLog("Started successfully.");
        hashService.start();
        startupUrl = hashService.hash || defaultPath;
        if (startupUrl == defaultPath) {
            hashService.setHash(startupUrl);
        }

        currentHash = startupUrl;
        return $ref;
    };

    return $ref;
})();
