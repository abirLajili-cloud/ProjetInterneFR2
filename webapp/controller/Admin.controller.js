
sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/m/MessageBox",
  "sap/m/MessageToast"
], function (
  Controller, JSONModel, Filter, FilterOperator, MessageBox, MessageToast
) {
  "use strict";

  // ===========================
  // CONFIG: server-side persistence
  // ===========================
  // This endpoint must write the posted JSON to webapp/data.json on the server.
  // (Implement via UI5 custom middleware or your own Node/Express route.)
  var PERSIST_URL = "/api/save-data";

  return Controller.extend("project1.controller.Admin", {

    // ========================
    // LIFECYCLE
    // ========================
    onInit: function () {
      // Local model for dialog/draft data
      this.getView().setModel(new JSONModel({
        dialogTitle: "",
        poDialogTitle: "",
        currentPR: {},
        currentPO: {}
      }), "local");

      // Default section
      this._showSection("PR");
    },

    // ========================
    // NAVBAR: PR ⇆ PO
    // ========================
    _showSection: function (sKey) {
      var bPR = sKey === "PR";
      var bPO = sKey === "PO";

      var oPR = this.byId("sectionPR");
      var oPO = this.byId("sectionPO");
      if (oPR) { oPR.setVisible(bPR); }
      if (oPO) { oPO.setVisible(bPO); }

      var oBtnPR = this.byId("btnNavPR");
      var oBtnPO = this.byId("btnNavPO");
      if (oBtnPR) { oBtnPR.setType(bPR ? "Emphasized" : "Transparent"); }
      if (oBtnPO) { oBtnPO.setType(bPO ? "Emphasized" : "Transparent"); }
    },

    onNavToPR: function () { this._showSection("PR"); },
    onNavToPO: function () { this._showSection("PO"); },

    // ========================
    // HELPERS
    // ========================
    _mock: function () { return this.getView().getModel("mockData"); },
    _local: function () { return this.getView().getModel("local"); },
    _deepClone: function (obj) { return JSON.parse(JSON.stringify(obj || {})); },
    _getIndexByKey: function (aArray, sKey, sProp) {
      return aArray.findIndex(function (x) { return String(x[sProp]) === String(sKey); });
    },
    _confirm: function (sText, fnOk) {
      MessageBox.confirm(sText, {
        actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
        onClose: function (sAction) {
          if (sAction === MessageBox.Action.OK && typeof fnOk === "function") {
            fnOk();
          }
        }
      });
    },
    _generateId: function (sPrefix) {
      var n = Math.floor(Math.random() * 90000 + 10000);
      return sPrefix + n;
    },

    // Coerce numeric fields (so  "3" -> 3) before save
    _normalizeNumbersInPR: function (pr) {
      (pr.items || []).forEach(function (it) {
        it.requestedquantity = Number(it.requestedquantity || 0);
        it.purchaserequisitionprice = Number(it.purchaserequisitionprice || 0);
      });
      return pr;
    },
    _normalizeNumbersInPO: function (po) {
      (po.items || []).forEach(function (it) {
        it.netpricequantity = Number(it.netpricequantity || 0);
      });
      return po;
    },

    // ========================
    // SEARCH
    // ========================
    onSearchPR: function (oEvent) {
      var sQuery = oEvent.getSource().getValue();
      var aFilters = [];
      if (sQuery) {
        aFilters.push(new Filter({
          and: false,
          filters: [
            new Filter("purchaserequisition",     FilterOperator.Contains, sQuery),
            new Filter("purchaserequisitiontext", FilterOperator.Contains, sQuery),
            new Filter("purchaserequisitiontype", FilterOperator.Contains, sQuery),
            new Filter("supplier",                FilterOperator.Contains, sQuery),
            new Filter("plant",                   FilterOperator.Contains, sQuery)
          ]
        }));
      }
      var oBinding = this.byId("prTablee").getBinding("items");
      if (oBinding) { oBinding.filter(aFilters); }
    },

    onSearchPO: function (oEvent) {
      var sQuery = oEvent.getSource().getValue();
      var aFilters = [];
      if (sQuery) {
        aFilters.push(new Filter({
          and: false,
          filters: [
            new Filter("purchaseorder",          FilterOperator.Contains, sQuery),
            new Filter("supplier",               FilterOperator.Contains, sQuery),
            new Filter("companycode",            FilterOperator.Contains, sQuery),
            new Filter("purchasingorganization", FilterOperator.Contains, sQuery),
            new Filter("purchasinggroup",        FilterOperator.Contains, sQuery)
          ]
        }));
      }
      var oBinding = this.byId("poTablee").getBinding("items");
      if (oBinding) { oBinding.filter(aFilters); }
    },

    // ========================
    // DETAILS (view-only dialogs)
    // ========================
    onPRDetails: function (oEvent) {
      var oCtx = oEvent.getSource().getBindingContext("mockData");
      if (!oCtx) { return; }
      var oPR = this._deepClone(oCtx.getObject());
      this._local().setProperty("/currentPR", oPR);
      this.byId("prDialogg").open();
    },

    onPODetails: function (oEvent) {
      var oCtx = oEvent.getSource().getBindingContext("mockData");
      if (!oCtx) { return; }
      var oPO = this._deepClone(oCtx.getObject());
      this._local().setProperty("/currentPO", oPO);
      this.byId("poDialogg").open();
    },

    onCloseDialog: function () {
      var d1 = this.byId("prDialogg");
      var d2 = this.byId("poDialogg");
      if (d1 && d1.isOpen()) { d1.close(); }
      if (d2 && d2.isOpen()) { d2.close(); }
    },

    onDialogClose: function () {
      this._local().setProperty("/currentPR", {});
      this._local().setProperty("/currentPO", {});
    },

    // ========================
    // PR: CREATE / EDIT (XML dialogs)
    // ========================
    onCreatePR: function () {
      var oLocal = this._local();
      oLocal.setProperty("/dialogTitle", "Create Requisition");

      oLocal.setProperty("/currentPR", {
        purchaserequisition: "",
        purchaserequisitiontext: " ",
        purchaserequisitiontype: "",
        plant: "",
        supplier: "",
        createdbyuser: "",
        items: []
      });

      this.byId("prCreateDialog").open();
    },

    onEditPR: function (oEvent) {
      var oCtx = oEvent.getSource().getBindingContext("mockData");
      if (!oCtx) { return; }
      var oPR = this._deepClone(oCtx.getObject());
      var oLocal = this._local();
      oLocal.setProperty("/dialogTitle", "Edit Requisition");
      oLocal.setProperty("/currentPR", oPR);
      this.byId("prCreateDialog").open();
    },

    // PR items (names align with your XML)
    onAddItem: function () {
      var a = this._local().getProperty("/currentPR/items") || [];
      var next = (a.length ? Math.max.apply(null, a.map(function (i) { return Number(i.purchaserequisitionitem) || 0; })) : 0) + 10;
      a.push({
        purchaserequisitionitem: String(next),
        material: "",
        requestedquantity: 0,
        baseunitisocode: "EA",
        purchreqnitemcurrency: "EUR",
        purchaserequisitionprice: 0
      });
      this._local().setProperty("/currentPR/items", a);
    },
    onAddPRItem: function () { this.onAddItem(); }, // alias in case your XML uses onAddPRItem

    onDeleteItem: function (oEvent) {
      var oCtx = oEvent.getSource().getBindingContext("local");
      if (!oCtx) { return; }
      var item = oCtx.getObject();
      var a = this._local().getProperty("/currentPR/items") || [];
      var idx = a.indexOf(item);
      if (idx >= 0) {
        a.splice(idx, 1);
        this._local().setProperty("/currentPR/items", a);
      }
    },
    onDeletePRItem: function (oEvent) { this.onDeleteItem(oEvent); }, // alias

    onSavePR: function () {
      var oPR = this._normalizeNumbersInPR(this._local().getProperty("/currentPR"));
      var aPR = this._mock().getProperty("/purchaseRequisitions") || [];

      if (!oPR.purchaserequisition) {
        // Create
        oPR.purchaserequisition = this._generateId("PR");
        oPR._status = "Pending"; // blue
        aPR.unshift(oPR);
      } else {
        // Update
        var idx = this._getIndexByKey(aPR, oPR.purchaserequisition, "purchaserequisition");
        if (idx >= 0) {
          oPR._status = aPR[idx]._status || "Pending";
          aPR[idx] = oPR;
        } else {
          oPR._status = "Pending";
          aPR.unshift(oPR);
        }
      }

      this._mock().setProperty("/purchaseRequisitions", aPR);
      this._mock().refresh(true);

      this._persistMockData()
        .then(() => MessageToast.show("Purchase Requisition saved"))
        .catch(() => MessageToast.show("Failed to save data.json"));

      this.byId("prCreateDialog").close();
    },

    onCancelPR: function () {
      this.byId("prCreateDialog").close();
    },

    onDeletePR: function (oEvent) {
      var oCtx = oEvent.getSource().getBindingContext("mockData");
      if (!oCtx) { return; }
      var oPR = oCtx.getObject();
      var that = this;

      this._confirm("Delete PR " + oPR.purchaserequisition + " ?", function () {
        var aPR = that._mock().getProperty("/purchaseRequisitions") || [];
        var idx = that._getIndexByKey(aPR, oPR.purchaserequisition, "purchaserequisition");
        if (idx >= 0) {
          aPR.splice(idx, 1);
          that._mock().setProperty("/purchaseRequisitions", aPR);
          that._mock().refresh(true);

          that._persistMockData()
            .then(() => MessageToast.show("PR deleted"))
            .catch(() => MessageToast.show("Failed to save data.json"));
        }
      });
    },

    onApprovePR: function (oEvent) {
      var oCtx = oEvent.getSource().getBindingContext("mockData");
      if (!oCtx) { return; }
      oCtx.getModel().setProperty(oCtx.getPath() + "/_status", "Approved");
      oCtx.getModel().refresh(true);
      this._persistMockData()
        .then(() => MessageToast.show("PR approved"))
        .catch(() => MessageToast.show("Failed to save data.json"));
    },

    onRejectPR: function (oEvent) {
      var oCtx = oEvent.getSource().getBindingContext("mockData");
      if (!oCtx) { return; }
      oCtx.getModel().setProperty(oCtx.getPath() + "/_status", "Rejected");
      oCtx.getModel().refresh(true);
      this._persistMockData()
        .then(() => MessageToast.show("PR rejected"))
        .catch(() => MessageToast.show("Failed to save data.json"));
    },

    // ========================
    // PO: CREATE / EDIT (XML dialogs)
    // ========================
    onCreatePO: function () {
      var oLocal = this._local();
      oLocal.setProperty("/poDialogTitle", "Create Purchase Order");

      oLocal.setProperty("/currentPO", {
        podocType: "NB",
        purchaseorder: "",
        companycode: "1000",
        purchasingorganization: "ORG1",
        purchasinggroup: "A10",
        supplier: "SUP001",
        createdbyuser: "U001",
        items: []
      });

      this.byId("poCreateDialog").open();
    },

    onEditPO: function (oEvent) {
      var oCtx = oEvent.getSource().getBindingContext("mockData");
      if (!oCtx) { return; }
      var oPO = this._deepClone(oCtx.getObject());
      var oLocal = this._local();
      oLocal.setProperty("/poDialogTitle", "Edit Purchase Order");
      oLocal.setProperty("/currentPO", oPO);
      this.byId("poCreateDialog").open();
    },

    onAddPOItem: function () {
      var a = this._local().getProperty("/currentPO/items") || [];
      var next = (a.length ? Math.max.apply(null, a.map(function (i) { return Number(i.purchaseorderitem) || 0; })) : 0) + 10;
      a.push({
        purchaseorderitem: String(next),
        material: "",
        purchaseorderitemtext: "",
        plant: "",
        netpricequantity: 0,
        purchaseorderquantityunit: "EA"
      });
      this._local().setProperty("/currentPO/items", a);
    },

    onDeletePOItem: function (oEvent) {
      var oCtx = oEvent.getSource().getBindingContext("local");
      if (!oCtx) { return; }
      var item = oCtx.getObject();
      var a = this._local().getProperty("/currentPO/items") || [];
      var idx = a.indexOf(item);
      if (idx >= 0) {
        a.splice(idx, 1);
        this._local().setProperty("/currentPO/items", a);
      }
    },

    onSavePO: function () {
      var oPO = this._normalizeNumbersInPO(this._local().getProperty("/currentPO"));
      var aPO = this._mock().getProperty("/purchaseOrders") || [];

      if (!oPO.purchaseorder) {
        oPO.purchaseorder = this._generateId("PO");
        oPO._status = "Open"; // blue
        aPO.unshift(oPO);
      } else {
        var idx = this._getIndexByKey(aPO, oPO.purchaseorder, "purchaseorder");
        if (idx >= 0) {
          oPO._status = aPO[idx]._status || "Open";
          aPO[idx] = oPO;
        } else {
          oPO._status = "Open";
          aPO.unshift(oPO);
        }
      }

      this._mock().setProperty("/purchaseOrders", aPO);
      this._mock().refresh(true);

      this._persistMockData()
        .then(() => MessageToast.show("Purchase Order saved"))
        .catch(() => MessageToast.show("Failed to save data.json"));

      this.byId("poCreateDialog").close();
    },

    onCancelPO: function () {
      this.byId("poCreateDialog").close();
    },

    onDeletePO: function (oEvent) {
      var oCtx = oEvent.getSource().getBindingContext("mockData");
      if (!oCtx) { return; }
      var oPO = oCtx.getObject();
      var that = this;

      this._confirm("Delete PO " + oPO.purchaseorder + " ?", function () {
        var aPO = that._mock().getProperty("/purchaseOrders") || [];
        var idx = that._getIndexByKey(aPO, oPO.purchaseorder, "purchaseorder");
        if (idx >= 0) {
          aPO.splice(idx, 1);
          that._mock().setProperty("/purchaseOrders", aPO);
          that._mock().refresh(true);

          that._persistMockData()
            .then(() => MessageToast.show("PO deleted"))
            .catch(() => MessageToast.show("Failed to save data.json"));
        }
      });
    },

    onApprovePO: function (oEvent) {
      var oCtx = oEvent.getSource().getBindingContext("mockData");
      if (!oCtx) { return; }
      oCtx.getModel().setProperty(oCtx.getPath() + "/_status", "Approved");
      oCtx.getModel().refresh(true);
      this._persistMockData()
        .then(() => MessageToast.show("PO approved"))
        .catch(() => MessageToast.show("Failed to save data.json"));
    },

    onRejectPO: function (oEvent) {
      var oCtx = oEvent.getSource().getBindingContext("mockData");
      if (!oCtx) { return; }
      oCtx.getModel().setProperty(oCtx.getPath() + "/_status", "Rejected");
      oCtx.getModel().refresh(true);
      this._persistMockData()
        .then(() => MessageToast.show("PO rejected"))
        .catch(() => MessageToast.show("Failed to save data.json"));
    },
     onGoBack: function () {
      const oHistory = History.getInstance();
      const sPreviousHash = oHistory.getPreviousHash();

      if (sPreviousHash !== undefined) {
        // navigation browser (historique réel)
        window.history.go(-1);
      } else {
        // fallback propre
        this.getOwnerComponent()
          .getRouter()
          .navTo("RouteHome", {}, true);
      }
    },

    /* ========================================================= */
    /* Logout : toujours vers Landing                            */
    /* ========================================================= */
    onLogoutToLanding: function () {
      this.getOwnerComponent()
        .getRouter()
        .navTo("RouteLanding", {}, true);
    },


    // ========================
    // PERSIST: write webapp/data.json (no download)
    // ========================
    /**
     * Sends the entire mock model content to the backend so it overwrites
     * webapp/data.json (server-side).
     * @returns {Promise<void>}
     */
    _persistMockData: function () {
      var root = this._mock().getData() || {};
      var payload = {
        users: root.users || [],
        purchaseRequisitions: root.purchaseRequisitions || [],
        purchaseOrders: root.purchaseOrders || []
      };

      return fetch(PERSIST_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload, null, 2)
      }).then(function (res) {
        if (!res.ok) { throw new Error("HTTP " + res.status); }
      });
    }

  });
});
