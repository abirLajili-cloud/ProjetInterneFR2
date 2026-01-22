sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/core/UIComponent",
  "sap/m/MessageToast"
], function (Controller, UIComponent, MessageToast) {
  "use strict";

  return Controller.extend("project1.controller.Home", {

    onInit: function () {},

    // ---- Navigation ----
    onGoAdmin: function () {
      this._navTo("RouteAuth");
    },

    onGoCustomer: function () {
      this._navTo("RouteAuth");
    },

    onGoSupplier: function () {
      this._navTo("RouteAuth");
    },

    onGoToLanding: function () {
      this._navTo("RouteLanding");
    },

    onLogout: function () {
      // If you have an Auth route/page, change it here
      MessageToast.show("Logged out");
      this._navTo("Auth");
    },

    onHelp: function () {
      MessageToast.show("Help section coming soon.");
    },

    // Scroll to roles section
    onScrollToRoles: function () {
      const oSection = this.byId("rolesSection");
      if (!oSection || !oSection.getDomRef()) {
        MessageToast.show("Roles section not found.");
        return;
      }
      oSection.getDomRef().scrollIntoView({ behavior: "smooth", block: "start" });
    },

    // ---- Helper ----
    _navTo: function (sRouteName) {
      const oRouter = UIComponent.getRouterFor(this);
      try {
        oRouter.navTo(sRouteName);
      } catch (e) {
        MessageToast.show("Route not found: " + sRouteName + " (check manifest.json)");
      }
    }

  });
});
