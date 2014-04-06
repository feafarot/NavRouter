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
        vmCanLeave?: string;
        currentVM?: any;
        cacheView?: boolean;
        onNavigateTo?: string;
        vmFactory?: any;
        title?: string;
        toolbarId?: string;
    }

    interface NavigationInfo
    {
        targetRoute: routes.Route;
        forceReloadOnNavigation: boolean;
        forceNavigationInCache: boolean;
    }

    export class NavigationRoute extends Route
    {
        viewPath: string;
        currentVM: any;
        cacheView: boolean;
        onNavigateTo: string;
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
                this.onNavigateTo = null;
                this.title = null;
                this.toolbarId = null;
                this.state = LoadingState.complete;
            }
            else
            {
                if (options.vmCanLeave)
                {
                    options.canLeave = (callback, navOptions: NavigationInfo) => 
                    {
                        if (this.currentVM && this.currentVM[options.vmCanLeave])
                        {
                            return this.currentVM[options.vmCanLeave](callback, navOptions);
                        }

                        return true;
                    };
                }

                this.toolbarId = options.toolbarId;
                this.cacheView = options.cacheView == undefined ? true : options.cacheView;
                this.vmFactory = options.vmFactory || null;
                this.onNavigateTo = options.onNavigateTo || null;
                this.title = options.title || null;
                this.state = LoadingState.complete;
            }

            super(routePattern, options);
        }
    };
}