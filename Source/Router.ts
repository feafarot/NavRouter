/// <reference path="HashService.ts" />
/// <reference path="Loggers.ts" />
/// <reference path="Routes.ts" />
/// <reference path="../Scripts/typings/jquery/jquery.d.ts" />
/// <reference path="../Scripts/typings/knockout/knockout.d.ts" />

module routing.utils
{
    export function getType(obj: any): string
    {
        var funcNameRegex = /function (.+)\(/;
        var results = (funcNameRegex).exec((obj).constructor.toString());
        return (results && results.length > 1) ? results[1] : "";
    };

    export function getHash(path: any): string
    {
        if (typeof path != "String" && path.toString != "undefined")
        {
            path = path.toString();
        }

        var matches = path.match(/^[^#]*(#.+)$/);
        var hash = matches ? matches[1] : '';
        return hash;
    };
}

module routing
{
    class RouteHandler
    {
        pattern: string;
        handler: (context: INavigationContext) => void;

        constructor(pattern: string, handler: (context: INavigationContext) => void)
        {
            this.pattern = pattern || null;
            this.handler = handler || null;
        }
    };

    export interface INavigationContext
    {
        associeatedRoute: routes.Route;
        path: string;
        params?: any;
    }

    export interface IRouterInitOptions
    {
        //preloadEnabled: boolean; // Not implemented
        beforeNavigationHandler?: () => void;
        afterNavigationHandler?: () => void;
        navigationErrorHandler?: () => void;
        enableLogging?: boolean;
    }

    export class Router
    {
        initialized: boolean = false;
        routes: routes.Route[] = new Array<routes.Route>();
        currentRoute: KnockoutObservable<routes.Route> = this.createCurrentRoute();
        history: string[] = new Array<string>();

        private hashSymbol: string = "#!/";
        private defaultPath: string = "";
        private currentHash: string = "";
        private startupUrl: string = "";
        private containerId: string = "";
        private defaultTitle: string;
        private defaultRoute: routes.Route = null;
        private fresh: boolean = true;
        private allRoutes: routes.Route[] = new Array<routes.Route>();
        private handlers: RouteHandler[] = new Array<RouteHandler>();
        private hashService = new HashService();
        private currentLogger: ILogger = new SilentLogger();

        private currentPayload: any = null;

        private navigationFlags: any = null;
        private forceReloadOnNavigation: boolean = false;
        private forceNavigationInCache: boolean = false;
        private forceCaching: boolean = false;
        private backNavigation: boolean = false;
        private isRedirecting: boolean = false;
        private preventRaisingNavigateTo: boolean = false;

        private beforeNavigationHandler: () => void = null;
        private afterNavigationHandler: () => void = null;
        private navigationErrorHandler: () => void = null;
        private cancelledByUrlHandler: () => void = null;

        constructor(mainContainerId: string, options?: IRouterInitOptions, routesToMap?: routes.Route[])
        {
            var enableLogging;
            this.hashService.on_changing = this.hashChanginHandler;
            this.hashService.on_changed = this.hashChangedHandler;
            this.hashService.on_cancelledByUrl = this.hashChangeCancelledHandler;

            if (options)
            {
                //this.forceCaching = options.preloadEnabled || false; // Not Implemented
                //this.onPreloadComplete = options.preloadComplete || null;
                this.beforeNavigationHandler = options.beforeNavigationHandler || null;
                this.afterNavigationHandler = options.afterNavigationHandler || null;
                this.navigationErrorHandler = options.navigationErrorHandler || null;
                enableLogging = options.enableLogging || true;
            }

            this.currentLogger = enableLogging ? new DefaultRouterLogger() : new SilentLogger();
            this.containerId = mainContainerId;
            this.initialized = true;
            if (routesToMap)
            {
                this.registerRoutes(routesToMap);
            }

            //this.currentLogger.info("Initialized.");
        }
        
        navigateTo(path: string, options?: any): void
        {
            var actualPath = path,
                relRoute = this.getRoute(path),
                removeCurrentHistory = false;

            if (options)
            {
                this.currentPayload = options.payload || null;
                this.forceReloadOnNavigation = options.forceReload || false;
                this.forceNavigationInCache = options.forceNavigationInCache || false;
                removeCurrentHistory = options.removeCurrentHistory || false;
            }

            if (relRoute && relRoute instanceof routes.VirtualRoute)
            {
                actualPath = this.getPathForRoute(relRoute);
            }

            if (!(actualPath == this.currentHash || this.hashSymbol + actualPath == this.currentHash))
            {
                actualPath = this.fixPath(actualPath);
                if (removeCurrentHistory)
                {
                    this.hashService.setHashAsReplace(actualPath);
                }
                else
                {
                    this.hashService.setHash(actualPath);
                }
            }
        }

        navigateBack(): void
        {
            history.back();
        }

        navigateBackInCache(): void
        {
            this.forceNavigationInCache = true;
            this.navigateBack();
        }

        navigateHome(): void
        {
            this.navigateTo(this.startupUrl);
        }

        getHashSymbol(): string
        {
            return this.hashSymbol;
        }

        cancelledByUrl(handler)
        {
            this.cancelledByUrlHandler = handler;
        }

        refreshCurrentRoute(): void
        {
            var pureHash = utils.getHash(window.location.toString()).replace(this.hashSymbol, "");
            var route = this.getRoute(pureHash);
            if (route != null)
            {
                this.currentRoute(route);
            }
        }

        //#region Configuration Methods
        registerRoute(routeToMap: routes.Route): Router
        {
            this.routes.push(routeToMap);
            if (routeToMap.isDefault)
            {
                this.defaultRoute = routeToMap;
                this.defaultPath = this.hashSymbol + this.getPathForRoute(routeToMap);
            }

            this.initRoute(routeToMap);
            return this;
        }

        registerRoutes = function (routesToMap: routes.Route[]): void
        {
            for (var i in routesToMap)
            {
                this.registerRoute(routesToMap[i]);
            }

            this.defaultPath = this.hashSymbol + this.getPathForRoute(this.defaultRoute);
        };

        setLogger(logger: ILogger): Router
        {
            if (!logger)
            {
                throw new Error("Parameter 'logger' is null or undefined!");
            }

            this.currentLogger = logger;
            return this;
        }

        init = function (routes, mainContainerId, options)
        {
            var enableLogging;
            this.hashService.on_changing = this.hashChanginHandler;
            this.hashService.on_changed = this.hashChangedHandler;
            this.hashService.on_cancelledByUrl = this.hashChangeCancelledHandler;

            if (options)
            {
                this.forceCaching = options.preloadEnabled || false;
                this.onPreloadComplete = options.preloadComplete || null;
                this.beforeNavigationHandler = options.beforeNavigation || null;
                this.afterNavigationHandler = options.afterNavigation || null;
                this.navigationErrorHandler = options.navigationError || null;
                enableLogging = options.enableLogging || true;
            }

            this.currentLogger = enableLogging ? new DefaultRouterLogger() : new SilentLogger();
            this.containerId = mainContainerId;
            this.initialized = true;
            this.registerRoutes(routes);
            this.currentLogger.info("Initialized.");
            return this;
        };

        run(): Router
        {
            if (!this.initialized)
            {
                throw new Error("Router is not initialized. Router should be initialized first!");
                return;
            }

            if (this.forceCaching)
            {
                // TODO: Implement preloading functionality!
                //if (this.onPreloadComplete)
                //{
                //    this.onPreloadComplete();
                //}
            }

            this.defaultTitle = document.title;
            this.currentLogger.info("Successfully started.");
            this.hashService.start();
            this.startupUrl = this.hashService.hash || this.defaultPath;
            if (this.startupUrl == this.defaultPath)
            {
                this.hashService.setHash(this.startupUrl);
            }

            this.currentHash = this.startupUrl;
            return this;
        }
        //#endregion
        
        //#region Utils
        getRoute(routeLink: string): routes.Route
        {
            var delegate = (x: routes.Route): boolean =>
            {
                var path2 = routeLink.toString().replace(this.hashSymbol, "");
                var result = this.isMatchesV2(x.pattern, path2);
                return result;
            };
            var res: routes.Route = null;
            for (var i = 0; i < this.allRoutes.length; i++)
            {
                if (delegate(this.allRoutes[i]))
                {
                    res = this.allRoutes[i];
                    break;
                }
            }

            return res;
        }

        isMatches(path1: string, path2: string): boolean
        {
            var result = true,
                path1Parts = path1.toString().split("/"),
                path2Parts = path2.toString().split("/");
            if (path1Parts.length == path2Parts.length)
            {
                for (var i = 0; i < path1Parts.length; i++)
                {
                    if (!path1Parts[i].match(/^:.+/) && path1Parts[i] != path2Parts[i])
                    {
                        return false;
                    }
                }
            }
            else
            {
                result = false;
            }

            return result;
        }

        isMatchesV2(path1: string, path2: string): boolean
        {
            var path1Parts = this.cleanPath(path1).split("/"),
                path2Parts = this.cleanPath(path2).split("/");
            if (path1Parts.length < path2Parts.length)
            {
                return false;
            }

            for (var i = 0; i < path1Parts.length; i++)
            {
                if (path1Parts[i].match(/^\{\?[^\?]+\}$/))
                {
                    continue;
                }

                if (path1Parts[i].match(/^\{([^\?])+\}$/) && path2Parts[i])
                {
                    continue;
                }

                if (path1Parts[i] == path2Parts[i])
                {
                    continue;
                }

                return false;
            }

            return true;
        }

        private cleanPath(path: string): string
        {
            return path.replace(/(\/\/+)/, "/").replace(/(\/+)$/, "").replace(/^(\/+)/, "");
        }

        private getPathForRoute(route: routes.Route): string
        {
            if (route)
            {
                if (route instanceof routes.VirtualRoute)
                {
                    var vroute = <routes.VirtualRoute>route;
                    var defaultChild: routes.Route = null;
                    for (var i = 0; i < vroute.childRoutes.length; i++)
                    {
                        if (vroute.childRoutes[i].isDefault)
                        {
                            defaultChild = vroute.childRoutes[i];
                            break;
                        }
                    }

                    if (defaultChild == null)
                    {
                        throw new Error("Route '" + route.pattern + "' has invalid configuration of child elements.");
                    }

                    return this.getPathForRoute(defaultChild);
                }

                return route.pattern;
            }

            return null;
        }

        private getCompletePath(path: string, params: any): string
        {
            var matches = path.toString().match(/\{.+\}/);
            var completePath = path.toString();
            if (matches)
            {
                for (var i = 0; i < matches.length; i++)
                {
                    var paramName = matches[i].toString().replace("{", "").replace("}", "");
                    completePath = completePath.replace("{" + paramName + "}", params[paramName]);
                }
            }

            return completePath;
        }

        // TODO: Maybe remove
        //private create(className)
        //{
        //    return eval("new " + className + "()");
        //}

        private fixPath(path: string): string
        {
            if (!path.match(/^/ + this.hashSymbol + /.+/))
            {
                return this.hashSymbol + path.replace("#/", "");
            }
        }

        private createCurrentRoute(): KnockoutObservable<routes.Route>
        {
            return ko.observable<routes.Route>(null);
        }

        private raiseOnNavigatedTo(route: routes.NavigationRoute, context: INavigationContext): void
        {
            if (route.onNavigatedTo != null && (!this.isRedirecting || !this.preventRaisingNavigateTo))
            {
                var params = context.params;
                route.onNavigatedTo(params, this.currentPayload);
                this.currentPayload = null;
            }
        }

        private getContext(route: routes.Route, hash: string): INavigationContext
        {
            var context: INavigationContext = {
                associeatedRoute: route,
                path: hash.replace(this.hashSymbol, "")
            };
            var params: any = {};
            var patternParts = route.pattern.split("/");
            var pathParts = hash.replace(this.hashSymbol, "").split("/");
            //if (pathParts.length != patternParts.length)
            //{
            //    throw new Error("Invalid path. Unable to create navigation context.");
            //}

            for (var i = 0; i < patternParts.length; i++)
            {
                if (patternParts[i].toString().match(/^\{[^\?]+\}$/))
                {
                    var paramName = patternParts[i].toString().replace("{", "").replace("}", "");
                    params[paramName] = pathParts[i];
                }

                if (patternParts[i].toString().match(/^\{\?[^\?]+\}$/))
                {
                    var paramName = patternParts[i].toString().replace("{?", "").replace("}", "");
                    params[paramName] = pathParts[i];
                    //if (!pathParts[i])
                    //{
                    //    break;
                    //}
                }
            }

            context.params = params;
            return context;
        }
        //#endregion

        //#region Hash Events handlers.
        private hashChanginHandler = (hash: string, callback: (cancelNavigation: boolean) => void): void =>
        {
            if (!this.getRoute(hash))
            {
                callback(true);
                this.currentLogger.error("Navigation to '" + hash + "' was prevented. The route to this pattern was not found.")
                return;
            }

            if (this.currentRoute() == null)
            {
                callback(false);
                return;
            }

            // Can leave route processing.
            if (!this.isRedirecting)
            {
                this.currentRoute().canLeave(
                    (accept: boolean) => 
                    { // Leaving callvack parameter
                        if (accept)
                        {  // Leave navigation accepted
                            this.isRedirecting = false;
                            this.currentHash = hash;
                            callback(false);
                            this.preventRaisingNavigateTo = false;
                        }
                        else
                        { // Navigation cancelled
                            this.backNavigation = false;
                            callback(true);
                        }

                        this.forceReloadOnNavigation = false;
                        this.forceNavigationInCache = false;
                    },
                    { // Navigation info
                        targetRoute: this.getRoute(hash), // Target route parameter
                        forceReloadOnNavigation: this.forceReloadOnNavigation,
                        forceNavigationInCache: this.forceNavigationInCache
                    });
            }
            else
            {
                this.isRedirecting = false;
                this.currentHash = hash;
                callback(false);
                this.preventRaisingNavigateTo = false;
            }
        }

        private hashChangedHandler = (hash: string): void =>
        {
            var route = this.getRoute(hash);
            var context = this.getContext(route, hash);
            var routeHandler;
            var delegate = (x) => { return x.pattern == route.pattern; };
            for (var i = 0; i < this.handlers.length; i++)
            {
                if (delegate(this.handlers[i]))
                {
                    routeHandler = this.handlers[i];
                }
            }

            var croute = this.currentRoute();
            if (croute && croute instanceof routes.NavigationRoute)
            {
                (<routes.NavigationRoute>croute).state = routes.LoadingState.canceled;
                if ((<routes.NavigationRoute>croute).onNavigatedFrom)
                {
                    (<routes.NavigationRoute>croute).onNavigatedFrom();
                }
            }

            routeHandler.handler(context);

            if (!this.preventRaisingNavigateTo)
            {
                this.currentLogger.info("Navigated to '" + hash + "'.");
            }
            else
            {
                this.currentLogger.info("Navigion was prevented.");
            }

            this.refreshCurrentRoute();
        }

        private hashChangeCancelledHandler = (): void =>
        {
            this.forceReloadOnNavigation = false;
            this.forceNavigationInCache = false;
            if (this.cancelledByUrlHandler)
            {
                this.cancelledByUrlHandler();
            }
        }
        //#endregion

        //#region Route init method
        private mapVirtualRoute(routeToMap: routes.VirtualRoute): void
        {
            if (routeToMap.childRoutes)
            {
                for (var i in routeToMap.childRoutes)
                {
                    routeToMap.childRoutes[i].parrentRoute = routeToMap;
                    routeToMap.childRoutes[i].pattern = routeToMap.pattern + "/" + routeToMap.childRoutes[i].pattern;
                    this.initRoute(routeToMap.childRoutes[i]);
                }
            }
        }

        private mapNavigationRoute(routeToMap: routes.NavigationRoute): void
        {
            this.handlers.push(new RouteHandler(routeToMap.pattern, (context) =>
            {
                function completeNavigation()
                {
                    (<routes.NavigationRoute>context.associeatedRoute).state = routes.LoadingState.complete;
                    if (this.afterNavigationHandler)
                    {
                        this.afterNavigationHandler();
                    }

                    if (this.fresh)
                    {
                        this.fresh = false;
                    }
                };

                function onNavigationError()
                {
                    if (this.navigationErrorHandler)
                    {
                        this.currentLogger.warning("Navigation error is handling...")
                        this.navigationErrorHandler();
                    }
                };


                if (this.beforeNavigationHandler)
                {
                    this.beforeNavigationHandler();
                }

                (<routes.NavigationRoute>context.associeatedRoute).state = routes.LoadingState.loading;
                var jelem = $("#" + this.containerId);
                var completePath = this.getCompletePath(routeToMap.viewPath, context.params);
                var existing = $("[data-view=\"" + routeToMap.pattern + "\"]", jelem);
                var preventRaisingNavigateToCache = this.preventRaisingNavigateTo;
                //if (this.forceCaching)
                //{
                //    routeToMap.enable
                //} // wtf?

                if (routeToMap.title)
                {
                    document.title = routeToMap.title;
                }
                else
                {
                    document.title = this.defaultTitle;
                }

                if (existing && existing.length >= 1)
                { // Requested view already existing
                    if ((routeToMap.cacheView || this.forceNavigationInCache) && !this.forceReloadOnNavigation)
                    { // Showing cached view
                        if (this.forceNavigationInCache)
                        {
                            this.forceNavigationInCache = false;
                        }

                        jelem.children().hide();
                        existing.show();
                        if (!preventRaisingNavigateToCache)
                        { // This mean, that on navigation to the cache onNavigateTo shouldn't be called
                            this.raiseOnNavigatedTo(routeToMap, context);
                        }

                        completeNavigation();
                    }
                    else
                        if (!preventRaisingNavigateToCache)
                        { // Requesting view exists but should be reloaded
                            if (this.forceReloadOnNavigation)
                            {
                                this.forceReloadOnNavigation = false;
                            }

                            $.ajax({
                                url: completePath,
                                data: null,
                                cache: false,
                                error: onNavigationError,
                                success: (response) =>
                                {
                                    if (routeToMap.state == routes.LoadingState.canceled)
                                    {
                                        this.currentLogger.warning("Navigation to " + context.path + " was cancelled!");
                                        return;
                                    }

                                    if (routeToMap.vmFactory != null)
                                    { // If view model exists ko cleanups existing element
                                        if (existing && existing.get(0))
                                        {
                                            ko.cleanNode(existing.get(0));
                                        }
                                    }

                                    existing.html(response);
                                    if (routeToMap.vmFactory != null)
                                    { // View contains view model
                                        var factory = routeToMap.vmFactory;
                                        factory((instance) =>
                                        {
                                            ko.applyBindings(instance, existing.get(0));
                                            routeToMap.currentVM = instance;
                                            jelem.children().hide();
                                            if (!preventRaisingNavigateToCache)
                                            {
                                                this.raiseOnNavigatedTo(routeToMap, context);
                                            }

                                            existing.show();
                                            completeNavigation();
                                        });
                                    }
                                    else
                                    { // View without view model
                                        routeToMap.currentVM = null;
                                        jelem.children().hide();
                                        if (!preventRaisingNavigateToCache)
                                        {
                                            this.raiseOnNavigatedTo(routeToMap, context);
                                        }

                                        existing.show();
                                        completeNavigation();
                                    }
                                }
                            });
                        }
                        else
                        { // Mean, that navigation was prevented (used by router internally to handle canceled navigations)
                            completeNavigation();
                        }
                }
                else
                { // View does not exists
                    $.ajax({
                        url: completePath,
                        data: null,
                        cache: false,
                        error: onNavigationError,
                        success: (response) =>
                        {
                            if (routeToMap.state == routes.LoadingState.canceled)
                            {
                                this.currentLogger.warning("Navigation to " + context.path + " were cancelled!");
                                return;
                            }

                            jelem.children().hide();
                            jelem.append("<div data-view=\"" + routeToMap.pattern + "\">" + response + "</div>"); // View wrap container that store system info
                            if (routeToMap.vmFactory != null)
                            { // View contains view model
                                existing = $("[data-view=\"" + routeToMap.pattern + "\"]", jelem);
                                var factory = routeToMap.vmFactory;
                                factory((instance) =>
                                {
                                    ko.applyBindings(instance, existing.get(0));
                                    routeToMap.currentVM = instance;
                                    if (!preventRaisingNavigateToCache)
                                    {
                                        this.raiseOnNavigatedTo(routeToMap, context);
                                    }

                                    completeNavigation();
                                });
                            } else
                            { // View without view model
                                if (!preventRaisingNavigateToCache)
                                {
                                    this.raiseOnNavigatedTo(routeToMap, context);
                                }

                                existing.show();
                                completeNavigation();
                            }
                        }
                    });
                }
            }));
        }

        private initRoute(routeToMap: routes.Route): void
        {
            this.allRoutes.push(routeToMap);
            this.currentLogger.info("Registering route '" + routeToMap.pattern + "'.");
            switch (utils.getType(routeToMap))
            {
                //case "FuncRoute":
                //    this.handlers.push(new RouteHandler(routeToMap.pattern, function (context)
                //    {
                //        routeToMap.func();
                //    }));
                //    break;
                case "VirtualRoute":
                    this.mapVirtualRoute(<routes.VirtualRoute>routeToMap);
                    break;
                case "NavigationRoute":
                    this.mapNavigationRoute(<routes.NavigationRoute>routeToMap);
                    break;
            }
        }
        //#endregion
    }
}