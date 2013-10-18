// Navigation router JavaScript library v0.9.10
// (c) Roman Konkin (feafarot) - https://github.com/feafarot/navrouter
// License: MIT (http://www.opensource.org/licenses/mit-license.php)

var Routing;
(function () {
    //#region Utilities
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
    //#endregion
    
    var loadingState = new (function () {
        var $ref = {
            canceled: -1,
            complete: 1,
            loading: 2
        };
        return $ref;
    })();

    //#region Routes classes
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
    //#endregion

    function RouteHandler(pattern, handler) {
        var $ref = this;
        $ref.pattern = pattern || null;
        $ref.handler = handler || null;
    };

    function HashService() {
        var $ref = this,
            prevHash,
            preventNextEvent = false,
            storedHash,
            pending = false,
            cancellingPrev = false,
            callCount = 0,
            forwardingCount = 2;

        function lock() {
            pending = true;
            cancellingPrev = false;
        }

        function release() {
            pending = false;
            cancellingPrev = false;
        }

        function changingCallback(cancelNavigation) {
            if (cancelNavigation) {
                preventNextEvent = true;
            }
        };

        function hashChanged(newHash) {
            var continueHashChanged = function () {
                if (isNotNoU($ref.hash) || $ref.hash == "") {
                    prevHash = newHash;
                } else {
                    prevHash = $ref.hash;
                }

                $ref.hash = newHash;

                if (isNotNoU($ref.on_changed)) {
                    $ref.on_changed(newHash);
                }

                release();
            };

            lock();
            callCount++;
            if (isNotNoU($ref.on_changing)) {
                var currentCount = callCount;
                $ref.on_changing(
                    newHash,
                    function (cancelNavigation) {
                        if (currentCount != callCount) { // Cancelled by url changing on default!
                            return;
                        }

                        if (cancelNavigation) {
                            release();
                            preventNextEvent = true;
                            history.back();
                            //window.location.replace(prevHash || "");
                            return;
                        }
                        
                        continueHashChanged();
                    });
                return;
            }

            continueHashChanged();
        };

        function onHashChangedEventHandler() {
            if (pending) {
                if (prevHash == window.location.hash) {
                    release();
                    storedHash = window.location.hash;
                    preventNextEvent = false;
                    if (isNotNoU($ref.on_cancelledByUrl)) {
                        $ref.on_cancelledByUrl();
                    }
                }
                else {
                    if (cancellingPrev) {
                        cancellingPrev = false;
                    }
                    else {
                        cancellingPrev = true;
                        history.back();
                    }
                }

                return;
            }

            if (preventNextEvent) {
                if (prevHash != window.location.hash) {
                    if (forwardingCount == 0) {
                        throw new Error("History was broken, please reload page.");
                    }

                    forwardingCount--;
                    history.forward();
                }
                else {
                    storedHash = window.location.hash;
                    preventNextEvent = false;
                    forwardingCount = 2;
                }

                return;
            }

            if (storedHash == window.location.hash) { // This should handle (magic!)floating bug in IE9.
                return;
            }

            storedHash = window.location.hash;
            hashChanged(window.location.hash);
        };

        $ref.hash = "";
        $ref.on_changing = null;
        $ref.on_changed = null;
        $ref.on_cancelledByUrl = null;

        $ref.setHash = function (hash) {
            window.location.hash = hash;
        };

        $ref.setHashAsReplace = function (hash) {
            window.location.replace(hash);
        };

        $ref.start = function () {
            storedHash = window.location.hash;
            if ("onhashchange" in window) { // Event supported (Google Chrome 5+, Safari 5+, Opera 10.60+, Firefox 3.6+ and Internet Explorer 8+)
                window.onhashchange = onHashChangedEventHandler;
            }
            else { // event not supported
                storedHash = window.location.hash;
                window.setInterval(function () {                    
                    if (window.location.hash != storedHash) {
                        onHashChangedEventHandler();
                    }
                }, 77);
            }

            if (window.location.hash) {
                hashChanged(window.location.hash);
            }
        };
    };

    function DefaultRouterLogger() {
        var $ref = this;

        function write(message) {
            if (typeof console == "undefined") {
                return;
            }

            console.log(message);
        }

        $ref.warning = function (message) {
            write("Router [Warning] >> " + message);
        };

        $ref.error = function (message) {
            write("Router [Error]!  >> " + message);
        };

        $ref.info = function (message) {
            write("Router [Info]    >> " + message);
        }
    }

    function SilentLogger() {
        var $ref = this;
        $ref.warning = function (message) { };
        $ref.error = function (message) { };
        $ref.info = function (message) { };
    }

    function InternalNavigationFlags() {
        var $ref = this;
        $ref.forceReloadOnNavigation = false
        $ref.forceNavigationInCache = false;
        $ref.preventRaisingNavigateTo = false;
        $ref.backNavigation = false;
        $ref.forceCaching = false;
        $ref.currentPayload = false;
        $ref.isRedirecting = false;
    }

    // Main Router class.
    function Router() {
        // Private fields
        var $ref = this,
            hashSymbol = "#!/",
            defaultPath = "",
            currentHash = "",
            startupUrl = "",
            containerId = "",
            defaultTitle,
            defaultRoute = null,
            fresh = true,
            allRoutes = new Array(),
            handlers = new Array(),
            hashService = new HashService(),
            currentLogger = new SilentLogger(),

            currentPayload = null,

            navigationFlags = null,
            forceReloadOnNavigation = false,
            forceNavigationInCache = false,
            forceCaching = false,
            backNavigation = false,
            isRedirecting = false,
            preventRaisingNavigateTo = false,

            beforeNavigationHandler = null,
            afterNavigationHandler = null,
            navigationErrorHandler = null,
            cancelledByUrlHandler = null;


        // Private functions
        //#region Utils
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
        
        function fixPath(path) {
            if (!path.match(/^/ + hashSymbol + /.+/)) {
                return hashSymbol + path.replace("#/", "");
            }
        };

        function createCurrentRoute() {
            if (ko && ko.observable) {
                return ko.observable(null);
            }
            else {
                return new (function () {
                    var _currentRoute = null;
                    return function (value) {
                        if (isUndefined(value)) {
                            return _currentRoute;
                        }
                        else {
                            _currentRoute = value;
                            return _currentRoute;
                        }
                    }
                })();
            }
        };
        //#endregion

        //#region Hash Events handlers.
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

        function hashChanginHandler(hash, callback) {
            if (isNoU(getRoute(hash))) {
                callback(true);
                currentLogger.error("Navigation to '" + hash + "' was prevented. The route to this pattern was not found.")
                return;
            }

            if ($ref.currentRoute() == null) {
                callback(false);
                return;
            }

            // Can leave route processing.
            if (!isRedirecting) {
                $ref.currentRoute().canLeave(
                    function (accept) { // Leaving callvack parameter
                        if (accept) {  // Leave navigation accepted
                            isRedirecting = false;
                            currentHash = hash;
                            callback();
                            preventRaisingNavigateTo = false;
                        }
                        else { // Navigation cancelled
                            //isRedirecting = true;
                            //preventRaisingNavigateTo = true;
                            //hashService.setHash(currentHash);
                            backNavigation = false;
                            forceNavigationInCache = false;
                            callback(true);
                        }
                    },
                    { // Navigation info
                        targetRoute: getRoute(hash), // Target route parameter
                        forceReloadOnNavigation: forceReloadOnNavigation,
                        forceNavigationInCache: forceNavigationInCache
                    });
            }
            else {
                isRedirecting = false;
                currentHash = hash;
                callback(false);
                preventRaisingNavigateTo = false;
            }
        };

        function hashChangedHandler (hash) {
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

            if (!preventRaisingNavigateTo) {
                currentLogger.info("Navigated to '" + hash + "'.");
                //if (!backNavigation) {
                //    $ref.history.push(hash);
                //} else {
                //    backNavigation = false;
                //}
            }
            else {
                currentLogger.info("Navigion was prevented.");
            }

            $ref.refreshCurrentRoute();
        };
        //#endregion

        //#region Route init method
        function initRoute(routeToMap) {
            function raiseOnNavigateTo(context) {
                if (routeToMap.onNavigateTo != null && (!isRedirecting || !preventRaisingNavigateTo)) {
                    var params = context.params;
                    routeToMap.currentVM[routeToMap.onNavigateTo](params, currentPayload);
                    currentPayload = null;
                }
            };

            allRoutes.push(routeToMap);
            currentLogger.info("Registering route '" + routeToMap.pattern + "'.");
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
                                currentLogger.warning("Navigation error is handling...")
                                navigationErrorHandler();
                            }
                        };


                        if (isNotNull(beforeNavigationHandler)) {
                            beforeNavigationHandler();
                        }

                        context.associeatedRoute.state = loadingState.loading;
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

                        if (existing && existing.length >= 1) { // Requested view already existing
                            if ((routeToMap.cacheView || forceNavigationInCache) && !forceReloadOnNavigation) { // Showing cached view
                                if (forceNavigationInCache) {
                                    forceNavigationInCache = false;
                                }

                                jelem.children().hide();
                                existing.show();
                                if (!preventRaisingNavigateToCache) { // This mean, that on navigation to the cache onNavigateTo shouldn't be called
                                    raiseOnNavigateTo(context);
                                }

                                completeNavigation();
                            }
                            else 
                                if (!preventRaisingNavigateToCache) { // Requesting view exists but should be reloaded
                                    if (forceReloadOnNavigation) {
                                        forceReloadOnNavigation = false;
                                    }
                                
                                    $.ajax({
                                        url: completePath,
                                        data: null,
                                        cache: false,
                                        error: onNavigationError,
                                        success: function (response) {
                                            if (routeToMap.state == loadingState.canceled) {
                                                currentLogger.warning("Navigation to " + context.path + " was cancelled!");
                                                return;
                                            }

                                            if (routeToMap.vmFactory != null) { // If view model exists ko cleanups existing element
                                                if (isNotNoU(existing) && isNotNoU(existing.get(0))) {
                                                    ko.cleanNode(existing.get(0));
                                                }
                                            }

                                            existing.html(response);
                                            if (routeToMap.vmFactory != null) { // View contains view model
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
                                            } else { // View without view model
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
                                }
                                else { // Mean, that navigation was prevented (used by router internally to handle canceled navigations)
                                    completeNavigation();
                                }
                        }
                        else { // View does not exists
                            $.ajax({
                                url: completePath,
                                data: null,
                                cache: false,
                                error: onNavigationError,
                                success: function (response) {
                                    if (routeToMap.state == loadingState.canceled) {
                                        currentLogger.warning("Navigation to " + context.path + " were cancelled!");
                                        return;
                                    }

                                    jelem.children().hide();
                                    jelem.append("<div data-view=\"" + routeToMap.pattern + "\">" + response + "</div>"); // View wrap container that store system info
                                    if (routeToMap.vmFactory != null) { // View contains view model
                                        existing = $("[data-view=\"" + routeToMap.pattern + "\"]", jelem);
                                        var factory = eval(routeToMap.vmFactory);
                                        factory(function (instance) {
                                            ko.applyBindings(instance, existing.get(0));
                                            routeToMap.currentVM = instance;
                                            if (!preventRaisingNavigateToCache) {
                                                raiseOnNavigateTo(context);
                                            }

                                            completeNavigation();
                                        });
                                    } else { // View without view model
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
        //#endregion


        // Public fields
        $ref.initialized = false;
        $ref.routes = new Array();
        $ref.currentRoute = createCurrentRoute();
        $ref.history = new Array();


        // Public functions
        $ref.getRoute = getRoute;

        $ref.isMatches = isMatches;

        $ref.navigateTo = function (path, options) {
            var actualPath = path,
                relRoute = getRoute(path),
                removeCurrentHistory = false;

            if (isNotNoU(options)) {
                currentPayload = options.payload || null;
                forceReloadOnNavigation = options.forceReload || false;
                forceNavigationInCache = options.forceNavigationInCache || false;
                removeCurrentHistory = options.removeCurrentHistory || false;
            }

            //if (removeCurrentHistory) {
            //    $ref.history.pop();
            //}

            if (relRoute != null && getType(relRoute) == "VirtualRoute") {
                actualPath = getPathForRoute(relRoute);
            }

            if (!(actualPath == currentHash || hashSymbol + actualPath == currentHash)) {
                actualPath = fixPath(actualPath);                
                if (removeCurrentHistory) {
                    hashService.setHashAsReplace(actualPath);
                }
                else {
                    hashService.setHash(actualPath);
                }
            }
        };

        $ref.navigateBack = function () {
            //$ref.history.pop();
            //var lastVisited = $ref.history.pop();
            //$ref.history.push(lastVisited);
            //if (isUndefined(lastVisited)) {
            //    lastVisited = defaultPath
            //} else {
            //    backNavigation = true;
            //}
            //hashService.setHash(lastVisited);
            history.back();
        };

        $ref.navigateBackInCache = function () {
            forceNavigationInCache = true;
            $ref.navigateBack();
        };

        $ref.navigateHome = function () {
            $ref.navigateTo(startupUrl);
        };

        $ref.getHashSymbol = function () {
            return hashSymbol;
        };

        $ref.cancelledByUrl = function (handler) {
            cancelledByUrlHandler = handler;
            hashService.on_cancelledByUrl = handler;
        };

        //#region Configuration Methods
        $ref.registerRoute = function (routeToMap) {
            $ref.routes.push(routeToMap);
            if (routeToMap.isDefault) {
                defaultRoute = routeToMap;
                defaultPath = getPathForRoute(routeToMap);
            }

            initRoute(routeToMap);
            return $ref;
        };

        $ref.registerRoutes = function (routesToMap) {
            for (var i in routesToMap) {
                $ref.registerRoute(routesToMap[i]);
            }

            defaultPath = hashSymbol + getPathForRoute(defaultRoute);
        };

        $ref.setLogger = function (logger) {
            if (!isNotNoU(logger)) {
                throw new Error("Parameter 'logger' is null or undefined!");
            }

            currentLogger = logger;
            return $ref;
        };

        $ref.refreshCurrentRoute = function () {
            var pureHash = getHash(window.location.toString()).replace(hashSymbol, "");
            var route = getRoute(pureHash);
            if (route != null) {
                $ref.currentRoute(route);
            }
        };

        $ref.init = function (routes, mainContainerId, options) {
            var enableLogging;
            hashService.on_changing = hashChanginHandler;
            hashService.on_changed = hashChangedHandler;

            if (isNotNoU(options)) {
                forceCaching = options.preloadEnabled || false;
                onPreloadComplete = options.preloadComplete || null;
                beforeNavigationHandler = options.beforeNavigation || null;
                afterNavigationHandler = options.afterNavigation || null;
                navigationErrorHandler = options.navigationError || null;
                enableLogging = options.enableLogging || true;
            }

            currentLogger = enableLogging ? new DefaultRouterLogger() : new SilentLogger();
            containerId = mainContainerId;
            $ref.initialized = true;
            $ref.registerRoutes(routes);
            currentLogger.info("Initialized.");
            return $ref;
        };

        $ref.run = function () {
            if (!$ref.initialized) {
                throw new Error("Router is not initialized. Router should be initialized first!");
                return;
            }

            if (forceCaching) {
                // TODO: Implement preloading functionality!
                if (isNotNoU(onPreloadComplete)) {
                    onPreloadComplete();
                }
            }

            defaultTitle = document.title;
            currentLogger.info("Successfully started.");
            hashService.start();
            startupUrl = hashService.hash || defaultPath;
            if (startupUrl == defaultPath) {
                hashService.setHash(startupUrl);
            }

            currentHash = startupUrl;
            return $ref;
        };
        //#endregion
    };

    //#region Namespaces configuration
    Routing = Routing || {};

    Routing.Router = Router;

    Routing.Routes = Routing.Routes || {};
    Routing.Routes.Route = Route;
    Routing.Routes.VirtualRoute = VirtualRoute;
  //Routing.Routes.FuncRoute = FuncRoute; // Temporary removed from public. TODO: Implement correct behaviours with FuncRoute.
    Routing.Routes.NavigationRoute = NavigationRoute;

    Routing.Utils = Routing.Utils || {};
    Routing.Utils.getHash = getHash;
    Routing.Utils.getType = getType;
    Routing.Utils.DefaultRouterLogger = DefaultRouterLogger;
    //#endregion
})();