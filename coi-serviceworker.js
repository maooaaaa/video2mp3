/*! coi-serviceworker v0.1.7 - (c) 2023 Guido Zuidhof - MIT License */
let coepCredentialless = false;
if (typeof window === 'undefined') {
  self.addEventListener("install", () => self.skipWaiting());
  self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

  self.addEventListener("message", (ev) => {
    if (!ev.data) {
      return;
    } else if (ev.data.type === "deregister") {
      self.registration.unregister();
    } else if (ev.data.type === "coepCredentialless") {
      coepCredentialless = ev.data.value;
    }
  });

  self.addEventListener("fetch", function (event) {
    const r = event.request;
    if (r.cache === "only-if-cached" && r.mode !== "same-origin") {
      return;
    }

    const coepHeader = coepCredentialless ? "credentialless" : "require-corp";

    event.respondWith(
      fetch(r)
        .then((response) => {
          if (response.status === 0) {
            return response;
          }

          const newHeaders = new Headers(response.headers);
          newHeaders.set("Cross-Origin-Embedder-Policy", coepHeader);
          newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");

          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders,
          });
        })
        .catch((e) => console.error(e))
    );
  });
} else {
  (() => {
    const reloadedBySelf = window.sessionStorage.getItem("coiReloadedBySelf");
    window.sessionStorage.removeItem("coiReloadedBySelf");
    const coepCredentialless = false;

    if (reloadedBySelf) {
      return;
    }

    const n = navigator;
    if (n.serviceWorker && n.serviceWorker.controller) {
      n.serviceWorker.controller.postMessage({
        type: "coepCredentialless",
        value: coepCredentialless,
      });
    } else {
      let src = document.currentScript.src;
      let firstLoad = false;
      
      if(window.location != window.parent.location) {
          // iframe内などの場合は動作しないため何もしない
          console.warn("coi-serviceworker: iframe内では動作しません");
          return; 
      }

      n.serviceWorker.register(src).then(
        (registration) => {
          window.sessionStorage.setItem("coiReloadedBySelf", "true");
          window.location.reload();
        },
        (err) => {
          console.error("COI Service Worker registration failed: ", err);
        }
      );
    }
  })();
}
