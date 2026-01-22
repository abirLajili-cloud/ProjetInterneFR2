sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/core/UIComponent",
  "sap/ui/core/routing/History",
  "sap/m/MessageToast"
], function (Controller, UIComponent, History, MessageToast) {
  "use strict";

  return Controller.extend("project1.controller.Landing", {

    onInit: function () {
      // Nothing required for now
    },

    // -------------------------
    // Navigation
    // -------------------------
    onGoToLogin: function () {
      const oRouter = UIComponent.getRouterFor(this);

      // Change "Login" to your real route name in manifest.json (routing/routes)
      // Examples: "Login", "RouteLogin", "login"
      try {
        oRouter.navTo("RouteHome");
      } catch (e) {
        // fallback if route name differs
        MessageToast.show("Route 'Login' not found. Check manifest.json routing.");
      }
    },

    onNavBack: function () {
      const oHistory = History.getInstance();
      const sPreviousHash = oHistory.getPreviousHash();
      if (sPreviousHash !== undefined) {
        window.history.go(-1);
      } else {
        UIComponent.getRouterFor(this).navTo("Landing", {}, true);
      }
    },

    // -------------------------
    // Scroll helpers
    // -------------------------
    onScrollTop: function () {
      this._scrollTo(0);
    },

    onScrollToAbout: function () {
      // If you add an About section later, this will scroll to top for now
      this._scrollTo(0);
      MessageToast.show("About section not added yet.");
    },

    onScrollToFeatures: function () {
      this._scrollToSectionById("featuresSection");
    },

    onScrollToWorkspaces: function () {
      this._scrollToSectionById("workspacesSection");
    },

    onScrollToContact: function () {
      this._scrollToSectionById("contactSection");
    },

    _scrollToSectionById: function (sId) {
      const oSection = this.byId(sId);
      if (!oSection) {
        MessageToast.show("Section not found: " + sId);
        return;
      }

      // Prefer scrollIntoView to avoid manual offsets issues
      const oDomRef = oSection.getDomRef();
      if (oDomRef && oDomRef.scrollIntoView) {
        oDomRef.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      // Fallback
      const iTop = oDomRef ? oDomRef.offsetTop : 0;
      this._scrollTo(iTop);
    },

    _scrollTo: function (iTop) {
      // Works well in BAS preview / FLP iframe contexts
      try {
        window.scrollTo({ top: iTop, behavior: "smooth" });
      } catch (e) {
        window.scrollTo(0, iTop);
      }
    }

  });
});
