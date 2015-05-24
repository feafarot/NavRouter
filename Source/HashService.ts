module routing {
    export class HashService {
        private prevHash: string;
        private preventNextEvent: boolean = false;
        private storedHash: string;
        private legalHash: string;
        private pending: boolean = false;
        private cancellingPrev: boolean = false;
        private callCount: number = 0;
        private forwardingCount: number = 2;

        hash: string = "";
        on_changing: (hash: string, callback: (cancelNavigation: boolean) => void) => void = null;
        on_changed: (hash: string) => void = null;
        on_cancelledByUrl: () => void = null;

        setHash(hash) {
            window.location.hash = hash;
        }

        setHashAsReplace(hash) {
            window.location.replace(hash);
        }

        start() {
            this.storedHash = window.location.hash;
            if ("onhashchange" in window) {   // Event supported (Google Chrome 5+, Safari 5+, Opera 10.60+, Firefox 3.6+ and Internet Explorer 8+)
                window.onhashchange = this.onHashChangedEventHandler.bind(this);
            }
            else {   // event not supported
                this.storedHash = window.location.hash;
                window.setInterval(function () {
                    if (window.location.hash != this.storedHash) {
                        this.onHashChangedEventHandler();
                    }
                }, 77); // Yes, magic number ): TODO: Refactor.
            }

            if (window.location.hash) {
                this.hashChanged(window.location.hash);
            }
        }

        private lock(): void {
            this.pending = true;
            this.cancellingPrev = false;
        }

        private release(): void {
            this.pending = false;
            this.cancellingPrev = false;
        }

        private changingCallback(cancelNavigation: boolean): void {
            if (cancelNavigation) {
                this.preventNextEvent = true;
            }
        }

        private hashChanged(newHash: string): void {
            var continueHashChanged = () => {
                if (!this.hash) {
                    this.prevHash = newHash;
                }
                else {
                    this.prevHash = this.hash;
                }

                this.hash = newHash;

                if (this.on_changed) {
                    this.on_changed(newHash);
                }

                this.release();
            };

            this.lock();
            this.callCount++;
            if (this.on_changing) {
                var currentCount = this.callCount;
                this.on_changing(
                    newHash,
                    (cancelNavigation: boolean) => {
                        if (currentCount != this.callCount) { // Cancelled by url changing on default!
                            return;
                        }

                        if (cancelNavigation) {
                            this.release();
                            this.preventNextEvent = true;
                            history.back();
                            //window.location.replace(prevHash || "");
                            return;
                        }

                        continueHashChanged();
                    });
                return;
            }

            continueHashChanged();
        }

        private onHashChangedEventHandler() {
            if (this.pending) {
                if (this.prevHash == window.location.hash) {
                    this.release();
                    this.storedHash = window.location.hash;
                    this.preventNextEvent = false;
                    if (this.on_cancelledByUrl) {
                        this.on_cancelledByUrl();
                    }
                }
                else {
                    if (this.cancellingPrev) {
                        this.cancellingPrev = false;
                    }
                    else {
                        this.cancellingPrev = true;
                        history.back();
                    }
                }

                return;
            }

            if (this.preventNextEvent) {
                if (this.hash != window.location.hash) {
                    if (this.forwardingCount == 0) {
                        throw new Error("History was broken, please reload page.");
                    }

                    this.forwardingCount--;
                    history.forward();
                }
                else {
                    this.storedHash = window.location.hash;
                    this.preventNextEvent = false;
                    this.forwardingCount = 2;
                }

                return;
            }

            if (this.storedHash == window.location.hash) { // This should handle (magic!)floating bug in IE9.
                return;
            }

            this.storedHash = window.location.hash;
            this.hashChanged(window.location.hash);
        }
    };
}