sap.ui.define([
	"BasicFiori-Routing/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device"
], function(BaseController, JSONModel, Device) {
	return BaseController.extend("BasicFiori-Routing.controller.Material", {

		onInit: function() {
			this.getOwnerComponent().getRouter().getRoute("material").attachPatternMatched(this._onMasterMatched, this);
		},

		_onMasterMatched: function() {
			var that = this,
				jsonModel = new JSONModel(),
				oModel = this.getOwnerComponent().getModel("MainService"),
				oList = this.byId("list"),
				oViewModel = this._createViewModel(),
				iOriginalBusyDelay = oList.getBusyIndicatorDelay();
			oList.setBusy(true);
			this.setModel(oViewModel, "masterView");
			oList.attachEventOnce("updateFinished", function() {
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			});
			if (navigator.onLine) {
				oModel.read("/ZmatSet", {
					success: function(data) {
						jsonModel.setData(data);
						oList.setBusy(false);
						that.getView().setModel(jsonModel, "MaterialModel");
						that.getView().byId("pullToRefresh").hide();
					},
					error: function(error) {
						oList.setBusy(false);
						console.log("error" + error);
					}
				});
				var offlineInterval = setInterval(function() {
					onlineCbk();
				}, 3000);

				function onlineCbk() {
					if (!navigator.onLine) {
						clearInterval(offlineInterval);
						that.showToster("You are offline please connect to Internet to sync.");
						that.setConnection();

					}
				}
			} else {
				oList.setBusy(false);
				that.getView().byId("pullToRefresh").hide();
				that.showToster("Your viewing offline data");
				var onlineInterval = setInterval(function() {
					onlineCbk();
				}, 3000);

				function onlineCbk() {
					if (navigator.onLine) {
						clearInterval(onlineInterval);
						that._onMasterMatched();
						that.setConnection();
						that.showToster("Your Online, Please bare with us your data is getting Sync");
					}
				}
			}

		},
		onBeforeRendering: function() {
			setTimeout(this.setConnection(), 1000);
		},
		onSearch: function(oEvt) {
			var that = this;
			if (oEvt.getParameters().refreshButtonPressed) {
				that.onRefresh();
			} else {
				var filters = [];
				var searchString = this.getView().byId("searchField").getValue();
				if (searchString && searchString.length > 0) {
					filters = new sap.ui.model.Filter([
						new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.Contains, searchString),
						new sap.ui.model.Filter("Description", sap.ui.model.FilterOperator.Contains, searchString),
						new sap.ui.model.Filter("Price", sap.ui.model.FilterOperator.Contains, searchString),
						new sap.ui.model.Filter("Type", sap.ui.model.FilterOperator.Contains, searchString)

					]);
				}
				// Update list binding
				this.getView().byId("list").getBinding("items").filter(filters);
			}
		},
		scanMaterial: function() {
			var that = this;
			cordova.plugins.barcodeScanner.scan(scanSuccessCallback, scanErrorCallback);

			function scanSuccessCallback(result) {
				that.showToster("We got a barcode " + result.text);
				that.getView().byId("searchField").setValue(result.text);
				that.onSearch();
			}

			function scanErrorCallback(error) {
				alert("Scanning failed: " + JSON.stringify(error));
			}

		},
		onRefresh: function() {
			var oList = this.byId("list");
			oList.setBusy(true);
			this._onMasterMatched();
		},
		_createViewModel: function() {
			return new JSONModel({
				isFilterBarVisible: false,
				filterBarLabel: "",
				delay: 0,
				title: "Materials",
				noDataText: "No Materials Available",
				sortBy: "Description",
				groupBy: "None"
			});
		},
		_showDetail: function(oItem) {
			var bReplace = !Device.system.phone,
				selectedMaterial = new JSONModel();
			selectedMaterial.setData(oItem.getBindingContext("MaterialModel").getProperty());
			this.getOwnerComponent().setModel(selectedMaterial, "selectedMaterial");
			this.getRouter().navTo("materialDetails", {
				MaterialId: oItem.getBindingContext("MaterialModel").getProperty("Material")
			}, bReplace);
		},

		onSelectionChange: function(oEvent) {
			var detailId = sap.ui.getCore().byId("__xmlview2--saveButtonId");
			if (detailId !== undefined) {
				if (detailId.getVisible()) {
					return sap.m.MessageToast.show("please save/Cancel the Materail before moving");
				}
			}

			// get the list item, either from the listItem parameter or from the event's source itself (will depend on the device-dependent mode).
			this._showDetail(oEvent.getParameter("listItem") || oEvent.getSource());
		},

		onSemanticAddButtonPress: function() {
			this.getRouter().navTo("materialCreate");
		}

	});

});