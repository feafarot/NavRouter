# NavRouter [1.0.0]

## General information

Licensed under **MIT** ([License Text](http://opensource.org/licenses/MIT))

Installing via NuGet:
> PM> Install-Package **NavRouter**

## Using

### Router configuration

Initialization and startup of router:

```javascript
    var routerOptions = {
        beforeNavigationHandler: function () {},    // Global before navigation handler
        afterNavigationHandler: function () {},     // Global after navigation handler
        navigationErrorHandler: function () {},     // Global navigation error handler
        enableLogging: true                         // Loggin router activity into console output
    };
    var router = new routing.Router(
        "container-id", // ID of element in which will be loaded views
        routerOptions,
        routes);        // Routes are described below
                        // This is the array of Route objects
    routing.knockout.setCurrentRouter(router);
    ko.applyBindings({}); // This requered to allow ko bindings to work ewrywhere on the page
                          // You can put here root level view model of application
    router.run(); // Starting of router
```

### Defining routes

Simple route definintion:

```JavaScript
    var route = new routing.routes.NavigationRoute(
        "books/list",           // Route mathcing pattern, simple string not RegEx
        "view/books-list.html", // Route view url, view will be loaded asynchronously
        );
```

Defining route with options:

```javascript
    
```