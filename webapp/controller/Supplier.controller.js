
sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/m/MessageToast",
  "sap/m/MessageBox"
], function (Controller, JSONModel, Filter, FilterOperator, MessageToast, MessageBox) {
  "use strict";

  return Controller.extend("project1.controller.Supplier", {

    /* =======================================================
     * LIFECYCLE
     * ======================================================= */
    onInit: function () {
      // Modèle local : état UI + buffers de dialogs
      var oLocal = new JSONModel({
        currentPO: {},
        statusFilter: "ALL",      // ALL | OPEN | ACK
        supplierCode: "SUP001",   // mapping simple pour l’utilisateur supplier
        newOrder: {               // buffer Create Order dialog
          supplier: "",
          companycode: "",
          purchasingorganization: "",
          purchasinggroup: "",
          items: []
        }
      });
      this.getView().setModel(oLocal, "local");

      // Appliquer le filtre par fournisseur quand les données mock sont prêtes
      var oMock = this.getView().getModel("mockData");
      if (oMock && oMock.getData()) {
        this._applySupplierFilter(true);
      } else if (oMock) {
        oMock.attachRequestCompleted(function () {
          this._applySupplierFilter(true);
        }.bind(this));
      }
    },

    /* =======================================================
     * HELPERS
     * ======================================================= */
    _mock: function () { return this.getView().getModel("mockData"); },
    _local: function () { return this.getView().getModel("local"); },

    _deepClone: function (obj) { return JSON.parse(JSON.stringify(obj || {})); },

    _ensureBinding: function (sListId) {
      var oList = this.byId(sListId);
      return oList ? oList.getBinding("items") : null;
    },

    _generatePONumber: function () {
      // PO + 7 chiffres pseudo-aléatoires
      var n = Math.floor(Math.random() * 9000000) + 1000000;
      return "PO" + n;
    },

    _nextItemNumber10: function (aItems) {
      var len = Array.isArray(aItems) ? aItems.length : 0;
      return String((len + 1) * 10);
    },

    _getSupplierFilterArray: function (sQuery) {
      var sSupplier = this._local().getProperty("/supplierCode");
      var a = [
        new Filter("supplier", FilterOperator.EQ, sSupplier)
      ];
      if (sQuery) {
        a.push(new Filter({
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
      var sStatusKey = this._local().getProperty("/statusFilter");
      if (sStatusKey === "OPEN") {
        a.push(new Filter("_status", FilterOperator.EQ, "Open"));
      } else if (sStatusKey === "ACK") {
        a.push(new Filter("_status", FilterOperator.EQ, "Acknowledged"));
      }
      return a;
    },

    /* =======================================================
     * FILTERING / SEARCH
     * ======================================================= */
    _applySupplierFilter: function (bSilent) {
      var oBinding = this._ensureBinding("poTable");
      if (!oBinding) { return; }
      oBinding.filter(this._getSupplierFilterArray(""));
      if (!bSilent) { MessageToast.show("Filter applied"); }
    },

    onSearch: function (oEvent) {
      var sQuery = oEvent.getSource().getValue() || "";
      var oBinding = this._ensureBinding("poTable");
      if (!oBinding) { return; }
      oBinding.filter(this._getSupplierFilterArray(sQuery));
    },

    onStatusSegmentChange: function (oEvent) {
      var sKey = oEvent.getParameter("item").getKey();
      this._local().setProperty("/statusFilter", sKey);
      this._applySupplierFilter(true);
    },

    /* =======================================================
     * DETAILS DIALOG
     * ======================================================= */
    onOpenDetails: function (oEvent) {
      var oCtx = oEvent.getSource().getBindingContext("mockData");
      if (!oCtx) { return; }
      var oPO = this._deepClone(oCtx.getObject());

      if (!oPO._status) { oPO._status = "Open"; }
      this._local().setProperty("/currentPO", oPO);
      this.byId("poDialog").open();
    },

    onCloseDialog: function () {
      var d = this.byId("poDialog");
      if (d) { d.close(); }
    },

    /* =======================================================
     * ACKNOWLEDGE
     * ======================================================= */
    onAcknowledge: function (oEvent) {
      var oCtx = oEvent.getSource().getBindingContext("mockData");
      if (!oCtx) { return; }
      var oModel = oCtx.getModel();
      var sPath = oCtx.getPath();
      oModel.setProperty(sPath + "/_status", "Acknowledged");
      oModel.refresh(true);
      MessageToast.show("PO acknowledged");
      this._applySupplierFilter(true);
    },

    /* =======================================================
     * CREATE ORDER (dialog + items)
     * ======================================================= */
    onOpenCreateOrderDialog: function (oEvent) {
      // Pré-remplir le header depuis la ligne sélectionnée (si présente)
      var oRowCtx = oEvent.getSource().getBindingContext("mockData");
      var oFromRow = oRowCtx ? this._deepClone(oRowCtx.getObject()) : {};
      var aItems = Array.isArray(oFromRow.items) ? this._deepClone(oFromRow.items) : [];

      // Buffer newOrder
      var oNew = {
        supplier: oFromRow.supplier || this._local().getProperty("/supplierCode") || "",
        companycode: oFromRow.companycode || "1000",
        purchasingorganization: oFromRow.purchasingorganization || "ORG1",
        purchasinggroup: oFromRow.purchasinggroup || "A10",
        items: aItems.length ? aItems : [] // clone items existants si présents
      };
      this._local().setProperty("/newOrder", oNew);

      this.byId("createOrderDialog").open();
    },

    onCloseCreateOrderDialog: function () {
      var d = this.byId("createOrderDialog");
      if (d) { d.close(); }
    },

    onCancelOrder: function () {
      this.onCloseCreateOrderDialog();
    },

    onAddOrderItem: function () {
      var oLocal = this._local();
      var a = oLocal.getProperty("/newOrder/items") || [];
      var sNext = this._nextItemNumber10(a);
      a.push({
        purchaseorderitem: sNext,
        material: "",
        purchaseorderitemtext: "",
        plant: "",
        netpricequantity: "",
        purchaseorderquantityunit: "EA"
      });
      oLocal.setProperty("/newOrder/items", a);
      oLocal.refresh(true);
    },

    onDeleteOrderItem: function (oEvent) {
      var oCtx = oEvent.getSource().getBindingContext("local");
      if (!oCtx) { return; }
      var sPath = oCtx.getPath(); // e.g. /newOrder/items/0
      var a = this._local().getProperty("/newOrder/items") || [];
      var iIndex = parseInt(sPath.split("/").pop(), 10);
      if (!isNaN(iIndex) && iIndex >= 0) {
        a.splice(iIndex, 1);
        this._local().setProperty("/newOrder/items", a);
        this._local().refresh(true);
      }
    },

    onSaveOrder: function () {
      var oLocal = this._local();
      var oMock = this._mock();
      var oNew = this._deepClone(oLocal.getProperty("/newOrder"));

      // Validations simples
      if (!oNew.supplier || !oNew.companycode || !oNew.purchasingorganization || !oNew.purchasinggroup) {
        MessageToast.show("Please fill header fields (supplier/company/org/group).");
        return;
      }
      if (!Array.isArray(oNew.items) || !oNew.items.length) {
        MessageToast.show("Please add at least one item.");
        return;
      }

      // Générer un numéro PO et finaliser l’objet
      var sPO = this._generatePONumber();
      var oToInsert = Object.assign({}, oNew, {
        purchaseorder: sPO,
        createdbyuser: "U002", // supplier connecté
        _status: "Open"
      });

      // Insérer dans le modèle mock
      var aAll = oMock.getProperty("/purchaseOrders") || [];
      aAll.unshift(oToInsert);
      oMock.setProperty("/purchaseOrders", aAll);
      oMock.refresh(true);

      // Nettoyage + fermeture
      this.onCloseCreateOrderDialog();
      MessageToast.show("PO " + sPO + " created");

      // Réappliquer filtre du fournisseur/segment
      this._applySupplierFilter(true);
    },

    /* =======================================================
     * FORMATTERS
     * ======================================================= */
    formatItemCount: function (aItems) {
      return Array.isArray(aItems) ? String(aItems.length) : "0";
    },

    formatTotalQuantity: function (aItems) {
      if (!Array.isArray(aItems)) { return "0"; }
      var sum = aItems.reduce(function (acc, it) {
        var v = Number(it.netpricequantity || 0);
        return acc + (isNaN(v) ? 0 : v);
      }, 0);
      return String(sum);
    },

    formatObjectHeaderStatus: function (sStatus) {
      return sStatus || "Open";
    }
  });
});
