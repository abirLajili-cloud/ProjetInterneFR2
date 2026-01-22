
sap.ui.define([
  "sap/ui/core/UIComponent",
  "sap/ui/model/json/JSONModel"
], function (UIComponent, JSONModel) {
  "use strict";

  // Must match manifest.json route "name" values
  var ALLOWED_ROUTES = ["RouteAdmin", "RouteSupplier", "RouteCustomer"];

  // Wait until the <script id="cai-webchat"> element exists and API is ready
  function waitForWebchatReady() {
    return new Promise(function (resolve) {
      var tries = 0;
      (function poll() {
        tries++;
        var el = document.getElementById("cai-webchat");
        if (el && typeof window.caiWebchat === "function") {
          resolve();
        } else if (tries < 60) { // ~9s at 150ms
          setTimeout(poll, 150);
        } else {
          resolve(); // resolve anyway; handlers will no-op if undefined
        }
      })();
    });
  }

  return UIComponent.extend("project1.Component", {
    metadata: { manifest: "json" },

    init: function () {
      UIComponent.prototype.init.apply(this, arguments);

      // Load mock data
      var oModel = new JSONModel("data.json");
      this.setModel(oModel, "mockData");

      // Session model
      var oSession = new JSONModel({ user: null });
      this.setModel(oSession, "session");

      // Router + chatbot toggle
      var oRouter = this.getRouter();
      oRouter.attachRouteMatched(this._onAnyRouteMatched, this);
      oRouter.initialize();

      // Optional: show the bubble once on startup for 2s to verify it loads
      waitForWebchatReady().then(function () {
        if (window.caiWebchat) {
          try {
            window.caiWebchat("open");
            setTimeout(function(){ try { window.caiWebchat("close"); } catch(e){} }, 2000);
          } catch (e) {}
        }
      });
    },

    _onAnyRouteMatched: function (oEvent) {
      var sRouteName = oEvent.getParameter("name");
      // console.log("Matched route:", sRouteName);

      waitForWebchatReady().then(function () {
        if (!window.caiWebchat) { return; }
        if (ALLOWED_ROUTES.indexOf(sRouteName) > -1) {
          try { window.caiWebchat("open"); } catch (e) {}
        } else {
          try { window.caiWebchat("close"); } catch (e) {}
        }
      });
    }
  });
});
