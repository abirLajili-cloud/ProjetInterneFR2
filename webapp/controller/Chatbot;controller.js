
sap.ui.define([
  "sap/ui/core/mvc/Controller"
], function (Controller) {
  "use strict";

  // Pages where chat must be visible (MUST match manifest.json route names)
  var ALLOWED_ROUTES = ["RouteAdmin", "RouteCustomer", "RouteSupplier"];

  // Your CAI config
  var CAI_CONFIG = {
    channelId: "3790994b-c20f-47cb-b6a6-40acda5f44dc",
    token:     "2069e9c7261c13bc59692b7db63493e9",
    id:        "cai-webchat" // DOM id used by the widget
  };

  return Controller.extend("project1.controller.Chatbot", {

    onInit: function () {
      // Listen to navigation to decide visibility
      var oRouter = this.getOwnerComponent().getRouter();
      oRouter.attachRouteMatched(this._onRouteMatched, this);

      // Try boot after load to ensure script is present
      if (document.readyState === "complete") {
        this._ensureBoot();
      } else {
        window.addEventListener("load", this._ensureBoot.bind(this));
      }
    },

    onExit: function () {
      // Reuse a single webchat across views; just close on exit
      try {
        if (window.caiWebchat) { window.caiWebchat("close"); }
      } catch (e) { /* no-op */ }
    },

    _onRouteMatched: function (oEvent) {
      var sName = oEvent.getParameter("name");
      // Ensure widget exists before toggling
      if (!window.caiWebchat || !window.__caiBooted) {
        this._ensureBoot().then(function () {
          this._toggleForRoute(sName);
        }.bind(this));
      } else {
        this._toggleForRoute(sName);
      }
    },

    _toggleForRoute: function (sRouteName) {
      if (!window.caiWebchat) { return; }
      if (ALLOWED_ROUTES.indexOf(sRouteName) > -1) {
        window.caiWebchat("open");
      } else {
        window.caiWebchat("close");
      }
    },

    _ensureBoot: function () {
      return new Promise(function (resolve) {
        // If script not loaded yet, wait/retry
        var check = function () {
          if (window.caiWebchat) {
            if (!window.__caiBooted) {
              try {
                window.caiWebchat("init", {
                  channelId: CAI_CONFIG.channelId,
                  token: CAI_CONFIG.token,
                  id: CAI_CONFIG.id,
                  open: true  

                  // Optional theme/behavior:
                  // open: false,
                  // hideHeader: false,
                  // tooltipMessage: "Need help?"
                });
                // Position & stacking (bottom-right + on top)
                setTimeout(function () {
                  var el = document.getElementById(CAI_CONFIG.id);
                  if (el) {
                    el.style.zIndex = "9999";
                    el.style.bottom = "16px";
                    el.style.right = "16px";
                  }
                }, 300);
                window.__caiBooted = true;
                window.caiWebchat("close"); // start hidden; routes control visibility
              } catch (e) {
                // ignore boot race conditions
              }
            }
            resolve();
          } else {
            // poll a bit until the script becomes available
            setTimeout(check, 150);
          }
        };
        check();
      });
    }

  });
});
