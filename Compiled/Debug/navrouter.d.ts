/// <reference path="../../Scripts/typings/jquery/jquery.d.ts" />
/// <reference path="../../Scripts/typings/knockout/knockout.d.ts" />
declare module routing {
    class HashService {
        private prevHash;
        private preventNextEvent;
        private storedHash;
        private legalHash;
        private pending;
        private cancellingPrev;
        private callCount;
        private forwardingCount;
        hash: string;
        on_changing: (hash: string, callback: (cancelNavigation: boolean) => void) => void;
        on_changed: (hash: string) => void;
        on_cancelledByUrl: () => void;
        setHash(hash: any): void;
        setHashAsReplace(hash: any): void;
        start(): void;
        private lock();
        private release();
        private changingCallback(cancelNavigation);
        private hashChanged(newHash);
        private onHashChangedEventHandler();
    }
}
declare module routing {
    interface ILogger {
        warning(message: string): void;
        error(message: string): void;
        info(message: string): void;
    }
    class DefaultRouterLogger implements ILogger {
        warning(message: string): void;
        error(message: string): void;
        info(message: string): void;
        private write(message);
    }
    class SilentLogger {
        warning(message: string): void;
        error(message: string): void;
        info(message: string): void;
    }
}
declare module routing.routes {
    interface RouteOptions {
        parrentRoute?: string;
        isDefault?: boolean;
        canLeave?: (callback: (allow: boolean) => void, navOptions: any) => void;
    }
    class Route {
        pattern: string;
        parrentRoute: Route;
        isDefault: boolean;
        canLeave: (callback: (allow: boolean) => void, navOptions: any) => void;
        constructor(routePattern: string, options: RouteOptions);
    }
    class VirtualRoute extends Route {
        childRoutes: Route[];
        constructor(routePattern: string, childRoutes: Route[], options: RouteOptions);
    }
    enum LoadingState {
        canceled = 0,
        complete = 1,
        loading = 2,
    }
    interface NavigationRouteOptions extends RouteOptions {
        currentVM?: any;
        cacheView?: boolean;
        vmFactory?: any;
        title?: string;
        toolbarId?: string;
    }
    interface NavigationInfo {
        targetRoute: routes.Route;
        forceReloadOnNavigation: boolean;
        forceNavigationInCache: boolean;
    }
    interface INavigationAware {
        onNavigatedTo?: (params: any, payload?: any) => void;
        canNavigateFrom?: (callback, navOptions: NavigationInfo) => void;
        onNavigatedFrom?: (newNavOptions: NavigationInfo) => void;
    }
    class NavigationRoute extends Route {
        viewPath: string;
        currentVM: INavigationAware;
        cacheView: boolean;
        onNavigatedTo: (params: any, payload?: any) => void;
        onNavigatedFrom: () => void;
        vmFactory: any;
        title: string;
        toolbarId: string;
        state: LoadingState;
        constructor(routePattern: string, viewPath: string, options: NavigationRouteOptions);
    }
}
declare module routing.utils {
    function getType(obj: any): string;
    function getHash(path: any): string;
    function newGuid(): string;
    function filterArray<T>(array: Array<T>, predicate: (element: T) => boolean): Array<T>;
    class Event<TArgs> {
        private handlers;
        constructor();
        subscribe(handler: (args?: TArgs) => void): string;
        unsubscribe(handler: (args?: TArgs) => void): void;
        unsubscribeByToken(handlerToken: string): void;
        add(handler: (args?: TArgs) => void): string;
        remove(handler: (args?: TArgs) => void): void;
        removeByToken(handlerToken: string): void;
        raise(args?: TArgs): void;
    }
}
declare module routing {
    interface INavigationContext {
        associeatedRoute: routes.Route;
        path: string;
        params?: any;
    }
    interface IRouterInitOptions {
        beforeNavigationHandler?: () => void;
        afterNavigationHandler?: () => void;
        navigationErrorHandler?: () => void;
        enableLogging?: boolean;
    }
    class Router {
        initialized: boolean;
        routes: routes.Route[];
        currentRoute: KnockoutObservable<routes.Route>;
        history: string[];
        private hashSymbol;
        private defaultPath;
        private currentHash;
        private startupUrl;
        private containerId;
        private defaultTitle;
        private defaultRoute;
        private fresh;
        private allRoutes;
        private handlers;
        private hashService;
        private currentLogger;
        private currentPayload;
        private navigationFlags;
        private forceReloadOnNavigation;
        private forceNavigationInCache;
        private forceCaching;
        private backNavigation;
        private isRedirecting;
        private preventRaisingNavigateTo;
        private beforeNavigationHandler;
        private afterNavigationHandler;
        private navigationErrorHandler;
        private cancelledByUrlHandler;
        constructor(mainContainerId: string, options?: IRouterInitOptions, routesToMap?: routes.Route[]);
        navigateTo(path: string, options?: any): void;
        navigateBack(): void;
        navigateBackInCache(): void;
        navigateHome(): void;
        getHashSymbol(): string;
        cancelledByUrl(handler: any): void;
        refreshCurrentRoute(): void;
        registerRoute(routeToMap: routes.Route): Router;
        registerRoutes: (routesToMap: routes.Route[]) => void;
        setLogger(logger: ILogger): Router;
        init: (routes: any, mainContainerId: any, options: any) => any;
        run(): Router;
        getRoute(routeLink: string): routes.Route;
        isMatches(path1: string, path2: string): boolean;
        isMatchesV2(path1: string, path2: string): boolean;
        private cleanPath(path);
        private getPathForRoute(route);
        private getCompletePath(path, params);
        private fixPath(path);
        private createCurrentRoute();
        private raiseOnNavigatedTo(route, context);
        private getContext(route, hash);
        private hashChanginHandler;
        private hashChangedHandler;
        private hashChangeCancelledHandler;
        private mapVirtualRoute(routeToMap);
        private mapNavigationRoute(routeToMap);
        private initRoute(routeToMap);
    }
}
interface KnockoutBindingHandlers {
    navigate: KnockoutBindingHandler;
    navigateBack: KnockoutBindingHandler;
}
declare module routing.knockout {
    function setCurrentRouter(router: Router): void;
}
