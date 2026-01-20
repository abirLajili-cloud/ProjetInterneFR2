
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast"
], function (Controller, JSONModel, Filter, FilterOperator, MessageToast) {
    "use strict";

    return Controller.extend("project1.controller.Customer", {

        onInit: function () {
            // Local UI state
            this.getView().setModel(new JSONModel({
                currentPR: {},
                isEdit: false,
                dialogTitle: ""     // used by {local>/dialogTitle} in the edit/create dialog
            }), "local");
        },

        /* ===========================
         * SEARCH FILTER
         * =========================== */
        onSearchPR: function (evt) {
            var sQuery = evt.getSource().getValue();
            var aFilters = [];

            if (sQuery) {
                aFilters.push(new Filter({
                    filters: [
                        new Filter("purchaserequisition",     FilterOperator.Contains, sQuery),
                        new Filter("purchaserequisitiontext", FilterOperator.Contains, sQuery),
                        new Filter("supplier",                FilterOperator.Contains, sQuery),
                        new Filter("plant",                   FilterOperator.Contains, sQuery)
                    ],
                    and: false
                }));
            }

            var oBinding = this.byId("prTable").getBinding("items");
            if (oBinding) { oBinding.filter(aFilters); }
        },

        /* ===========================
         * CREATE (EMPTY) DIALOG
         * =========================== */
        onAddPR: function () {
            var oLocal = this.getView().getModel("local");
            oLocal.setProperty("/currentPR", {
                purchaserequisition: "",
                purchaserequisitiontype: "NB",
                purchaserequisitiontext: "",
                supplier: "",
                plant: "",
                items: []
            });
            oLocal.setProperty("/isEdit", false);
            oLocal.setProperty("/dialogTitle", "Create Requisition");
            this.byId("prDialog").open();
        },

        /* ===========================
         * EDIT DIALOG
         * =========================== */
        onEditPR: function (oEvent) {
            var oData = oEvent.getSource().getBindingContext("mockData").getObject();
            var oClone = JSON.parse(JSON.stringify(oData));

            var oLocal = this.getView().getModel("local");
            oLocal.setProperty("/currentPR", oClone);
            oLocal.setProperty("/isEdit", true);
            oLocal.setProperty("/dialogTitle", "Edit Requisition");

            this.byId("prDialog").open();
        },

        /* ===========================
         * DETAILS DIALOG (READ ONLY)
         * =========================== */
        onViewPR: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext("mockData");
            if (!oCtx) { return; }

            var oPR   = JSON.parse(JSON.stringify(oCtx.getObject())); // deep clone
            this.getView().getModel("local").setProperty("/currentPR", oPR);

            this.byId("prDetailsDialog").open();
        },

        onClosePRDetails: function () {
            var oDlg = this.byId("prDetailsDialog");
            if (oDlg && oDlg.isOpen()) { oDlg.close(); }
        },

        /* ===========================
         * ITEMS (ADD/DELETE)
         * =========================== */
        onAddItem: function () {
            var oLocal = this.getView().getModel("local");
            var aItems = oLocal.getProperty("/currentPR/items") || [];
            aItems.push({
                purchaserequisitionitem: ((aItems.length + 1) * 10) + "",
                material: "",
                requestedquantity: "",
                purchaserequisitionprice: ""
            });
            oLocal.setProperty("/currentPR/items", aItems);
            oLocal.refresh(true);
        },

        onDeleteItem: function (oEvent) {
            var oLocal = this.getView().getModel("local");
            var sPath  = oEvent.getSource().getParent().getBindingContext("local").getPath(); // e.g., /currentPR/items/0
            var aParts = sPath.split("/");
            var iIndex = parseInt(aParts[aParts.length - 1], 10);

            var aItems = oLocal.getProperty("/currentPR/items") || [];
            if (iIndex > -1 && iIndex < aItems.length) {
                aItems.splice(iIndex, 1);
                oLocal.setProperty("/currentPR/items", aItems);
                oLocal.refresh(true);
            }
        },

        /* ===========================
         * SAVE/CANCEL (EDIT DIALOG)
         * =========================== */
        onSavePR: function () {
            // Persist into your real model/service here as needed.
            MessageToast.show("Purchase Requisition saved!");
            this.byId("prDialog").close();
        },

        onCancelPR: function () {
            this.byId("prDialog").close();
        },

        onDialogClose: function () {
            // optional clean-up after edit dialog closes
            // e.g., reset flags or temp states if needed
        }
    });
});
