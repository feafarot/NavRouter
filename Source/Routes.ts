module routing.routes
{
    export interface RouteOptions
    {
        parrentRoute?: string;
        isDefault?: boolean;
        canLeave?: (callback: (allow: boolean) => void, navOptions: any) => void;
    }

    export class Route
    {
        pattern: string;
        parrentRoute: Route;
        isDefault: boolean;
        canLeave: (callback: (allow: boolean) => void, navOptions: any) => void;

        constructor(routePattern: string, options: RouteOptions)
        {
            if (!routePattern)
            {
                throw new Error("Route pattern should be specified!");
            }

            this.parrentRoute = null;
            this.pattern = routePattern || null;
            if (!options)
            {
                this.isDefault = false;
                this.canLeave = (callback) => { callback(true); };
                return;
            }

            this.isDefault = options.isDefault || false;
            this.canLeave = options.canLeave || ((callback, navOptions) => { callback(true); });
        }
    }

    export class VirtualRoute extends Route
    {
        childRoutes: Route[];

        constructor(routePattern: string, childRoutes: Route[], options: RouteOptions)
        {
            this.childRoutes = childRoutes || new Array();
            super(routePattern, options);
        }
    };

    //function FuncRoute(routePattern, func, options)
    //{
    //    this.func = func || null;
    //    return $.extend(this, new Route(routePattern, options));
    //}

    export enum LoadingState
    {
        canceled,
        complete,
        loading
    }

    export interface NavigationRouteOptions extends RouteOptions
    {
        currentVM?: any;
        cacheView?: boolean;
        vmFactory?: any;
        title?: string;
        toolbarId?: string;
    }

    export interface NavigationInfo
    {
        targetRoute: routes.Route;
        forceReloadOnNavigation: boolean;
        forceNavigationInCache: boolean;
    }

    export interface INavigationAware
    {
        onNavigatedTo?: (params: any, payload?: any) => void;
        canNavigateFrom?: (callback, navOptions: NavigationInfo) => void;
        onNavigatedFrom?: (newNavOptions: NavigationInfo) => void;
    }

    export class NavigationRoute extends Route
    {
        viewPath: string;
        currentVM: INavigationAware;
        cacheView: boolean;
        onNavigatedTo: (params: any, payload?: any) => void;
        onNavigatedFrom: () => void;
        vmFactory: any;
        title: string;
        toolbarId: string;
        state: LoadingState;

        constructor(routePattern: string, viewPath: string, options: NavigationRouteOptions)
        {
            if (!viewPath)
            {
                throw new Error("Route view path should be specified!");
            }

            this.viewPath = viewPath;
            this.currentVM = null;


            if (!options)
            {
                this.cacheView = true;
                this.vmFactory = null;
                this.onNavigatedTo = null;
                this.title = null;
                this.toolbarId = null;
                this.state = LoadingState.complete;
            }
            else
            {
                if (options.vmFactory)
                {
                    var factory = eval(options.vmFactory);
                    this.vmFactory = (callback: (instance: any) => void) =>
                    {
                        factory((instance: any) =>
                        {
                            this.currentVM = instance;
                            this.onNavigatedTo = instance.onNavigatedTo || null;
                            this.onNavigatedFrom = instance.onNavigatedFrom || null;
                            this.canLeave = (callback, navOptions: NavigationInfo) =>
                            {
                                if (instance.canNavigateFrom)
                                {
                                    instance.canNavigateFrom(callback, navOptions);
                                    return;
                                }

                                callback(true);
                            };

                            callback(instance);
                        });
                    }
                }

                this.toolbarId = options.toolbarId;
                this.cacheView = options.cacheView == undefined ? true : options.cacheView;
                this.title = options.title || null;
                this.state = LoadingState.complete;
            }

            super(routePattern, options);
        }
    };
}