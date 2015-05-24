module routing {
    export interface ILogger {
        warning(message: string): void;
        error(message: string): void;
        info(message: string): void;
    }

    export class DefaultRouterLogger implements ILogger {
        warning(message: string): void {
            this.write("Router [Warning] >> " + message);
        }

        error(message: string): void {
            this.write("Router [Error]!  >> " + message);
        }

        info(message: string): void {
            this.write("Router [Info]    >> " + message);
        }

        private write(message: string): void {
            if (typeof console == "undefined") {
                return;
            }

            console.log(message);
        }
    }

    export class SilentLogger {
        warning(message: string): void { }

        error(message: string): void { }

        info(message: string): void { }
    }
}