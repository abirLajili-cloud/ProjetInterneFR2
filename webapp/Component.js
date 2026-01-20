
sap.ui.define([
  "sap/ui/core/UIComponent",
  "sap/ui/model/json/JSONModel"
], function (UIComponent, JSONModel) {
  "use strict";

  return UIComponent.extend("project1.Component", {

    metadata: {
      manifest: "json"
    },

    init: function () {
      UIComponent.prototype.init.apply(this, arguments);

      // Load mock data
      var oModel = new JSONModel("data.json");
      this.setModel(oModel, "mockData");

      // Session model for logged user
      var oSession = new JSONModel({ user: null });
      this.setModel(oSession, "session");

      // Initialize router
      this.getRouter().initialize();
    }
  });
});
