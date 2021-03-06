# NavRouter [1.0.2]

## General information

Licensed under **MIT** ([License Text](http://opensource.org/licenses/MIT))

Installing via NuGet:
> PM> Install-Package **NavRouter**

## Using

### Router configuration

Initialization and startup of router:

```javascript
    var routerOptions = {
        beforeNavigationHandler: function () { },    // Global before navigation handler.
        afterNavigationHandler: function () { },     // Global after navigation handler.
        navigationErrorHandler: function () { },     // Global navigation error handler.
        enableLogging: true                          // Loggin router activity into console output.
    };
    var router = new routing.Router(
        "container-id", // ID of element in which will be loaded views.
        routerOptions,
        routes);        // Routes are described below.
                        // This is the array of Route objects.
    routing.knockout.setCurrentRouter(router);
    ko.applyBindings({}); // This requered to allow ko bindings to work ewrywhere on the page.
                          // You can put here root level view model of application.
    router.run(); // Starting of router.
```

### Defining routes

Simple route definintion:

```javascript
    var simpleRoute = new routing.routes.NavigationRoute(
        "books/list",           // Route mathcing pattern, simple string not RegEx.
        "view/books-list.html"  // Route view url, view will be loaded asynchronously.
        );
```

Defining route with options and view model:

```javascript
    var booksViewVMFactoryMethod = function (callback) {
        var booksVM = new BooksViewModel(); // View model in knokcout meaning.
        callback(booksVM);                  // callback shoud be used. Do not use "return" it will not work.
    };
    
    var vmRouteOptions = {
            isDefault: true,    // Only one route must have IsDefault flag set to "true".
                                // This flag means that this route will be chosen if url doesn't match with any other routes.
            cacheView: true,    // If this flag set to "false", view will be reloaded after each navigation on the route.
                                // View model will be also recreated via factory call.
            title: "Book View", // Document title will be changed on defined on navigation to the route.
            vmFactory: booksViewVMFactoryMethod // View model factory method reference.
                                // This method will take 1 argument - function that should be called with view model instance object as argument.
        };
        
    var booksVMRoute = new routing.routes.NavigationRoute(
        "books/view/{bookId}/{?page}", // Advanced parameters where "bookId" is required paramter and "page" is optional.
                                       // How to use this parameters described below.
        "views/books-view.html",
        vmRouteOptions);
```

### Interactions with View Models and navigation

View model & navigation:

```javascript
    function BooksViewModel () {
        var _this = this;
        _this.onNavigatedTo = function (params, payload) {
            // Triggers after navigation on view.
            // In case with "booksVMRoute" from previous sample "params" argument will contains "bookId" 
            // and "page" fields where "page" field can be filled with "null".
            
            // "payload" serve to send big objects with navigation.
        }
        _this.canNavigateFrom = function (callback) {
            // Triggers when user try to navigate from current page.
            // "callback" argument is function that take 1 boolean argumen.
            // So if you male call "callback(false);" it will cancell navigation and roll back url to current,
            // to continue navigation you should call "callback" with "true" argument.
        }
        _this.onNavigatedFrom = function () {
            // Triggers when system already left this page.
        }
    }
```

Perfom navigation with html knockout binding (Simple example, advanced will be added soon)

```html
    <a data-bind="navigate: 'books/view/JRRT-172/14', activeClass: 'selected'">Lates book</a>
    <!-- "activeClass" binding will set provided class name when route will be active. -->
```

Perfom navigation from code

```javascript
    var navigateOptions = {
        payload: new Array(),           // Any object to send with navigation.
        forceReloadOnNavigation: true,  // Force to ignore "cacheView" flag to reload page.
        forceNavigationInCache: false,  // Force to ignore "cacheView" flag to not reload page.
    };
    router.navigateTo("books/view/JRRT-172/14", navigateOptions);
```
