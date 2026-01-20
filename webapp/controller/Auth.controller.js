
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("project1.controller.Auth", {

        onInit() {
            // Local model to store login input
            this.getView().setModel(new sap.ui.model.json.JSONModel({
                login: "",
                password: ""
            }), "local");
        },

        onLogin: function () {

            const oLocal = this.getView().getModel("local");
            const sLogin = oLocal.getProperty("/login");
            const sPass  = oLocal.getProperty("/password");

            const aUsers = this.getView().getModel("mockData").getProperty("/users");

            const oUser = aUsers.find(u =>
                u.login === sLogin && u.password === sPass
            );

            if (!oUser) {
                MessageBox.error("Invalid login or password!");
                return;
            }

            // Save session
            const oSession = this.getView().getModel("session");
            oSession.setProperty("/user", oUser);

            MessageToast.show("Welcome " + oUser.id);

            // Navigate depending on role
            const oRouter = this.getOwnerComponent().getRouter();

            switch (oUser.role) {
                case "ADMIN":
                    oRouter.navTo("RouteAdmin");
                    break;

                case "SUPPLIER":
                    oRouter.navTo("RouteSupplier");
                    break;

                case "CUSTOMER":
                    oRouter.navTo("RouteCustomer");
                    break;

                default:
                    MessageBox.error("Unknown role: " + oUser.role);
            }
        }

    });
});
