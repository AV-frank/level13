define([
    'ash',
    'game/GameGlobals',
    'game/GlobalSignals',
    'game/constants/UIConstants',
    'game/constants/UpgradeConstants',
    'game/nodes/tribe/TribeUpgradesNode',
], function (Ash, GameGlobals, GlobalSignals, UIConstants, UpgradeConstants, TribeUpgradesNode) {
    var UIOutUpgradesSystem = Ash.System.extend({

		engine: null,

		tribeNodes: null,

		lastUpdateUpgradeCount: 0,

		currentBlueprints: 0,
		lastShownBlueprints: 0,
		currentUpgrades: 0,
		lastShownUpgrades: 0,

		constructor: function () {},

		addToEngine: function (engine) {
			this.engine = engine;
			this.tribeNodes = engine.getNodeList(TribeUpgradesNode);
			this.lastUpdateUpgradeCount = 0;
			this.hasNeverBeenOpened = !GameGlobals.gameState.unlockedFeatures.upgrades;
            GameGlobals.uiTechTreeHelper.enableScrolling("researched-upgrades-vis");
		},

		removeFromEngine: function (engine) {
			this.engine = null;
			this.tribeNodes = null;
		},

		update: function (time) {
            if (GameGlobals.gameState.uiStatus.isHidden) return;
            if (!GameGlobals.gameState.uiStatus.isInCamp) return;
			var isActive = GameGlobals.gameState.uiStatus.currentTab === GameGlobals.uiFunctions.elementIDs.tabs.upgrades;

			var resetLists = $("#upgrades-list tr").length < 1 && $("#researched-upgrades-list tr").length < 1;
			resetLists = resetLists || this.lastUpdateUpgradeCount !== this.tribeNodes.head.upgrades.boughtUpgrades.length;
			resetLists = resetLists || $("#blueprints-list tr").length !== this.tribeNodes.head.upgrades.getNewBlueprints().length - this.tribeNodes.head.upgrades.getUnfinishedBlueprints().length;
			resetLists = resetLists && isActive;
			this.updateUpgradesLists(isActive, resetLists);

			GameGlobals.uiFunctions.toggle("#world-blueprints", $("#blueprints-list tr").length > 0);

			this.updateBubble();

			if (!isActive) {
				return;
			} else {
				this.hasNeverBeenOpened = false;
			}

            this.updateTechTree(resetLists);

			$("#tab-header h2").text("Upgrades");
			GameGlobals.uiFunctions.toggle("#world-upgrades-count", this.lastUpdateUpgradeCount > 0);
			$("#world-upgrades-count").text("Upgrades researched: " + this.lastUpdateUpgradeCount);
		},

        updateBubble: function () {
			var blueprintsNum = this.currentBlueprints - this.lastShownBlueprints;
			var upgradesNum = this.currentUpgrades - this.lastShownUpgrades;
            var newBubbleNumber = blueprintsNum + upgradesNum;
            if (this.bubbleNumber === newBubbleNumber)
                return;
            this.bubbleNumber = blueprintsNum + upgradesNum;
			if (this.hasNeverBeenOpened) this.bubbleNumber += this.availableUpgrades;
            $("#switch-upgrades .bubble").text(this.bubbleNumber);
            GameGlobals.uiFunctions.toggle("#switch-upgrades .bubble", this.bubbleNumber > 0);
        },

		updateUpgradesLists: function (isActive, resetLists) {
			this.currentBlueprints = 0;
			this.currentUpgrades = 0;
			this.availableUpgrades = 0;

			if (isActive && resetLists) {
				$("#blueprints-list").empty();
				$("#upgrades-list").empty();
				$("#researched-upgrades-list").empty();
			}

			var upgradeDefinition;
			var hasBlueprintUnlocked;
			var hasBlueprintNew;
			var isAvailable;
            var numUnResearched = 0;
			for (var id in UpgradeConstants.upgradeDefinitions) {
				upgradeDefinition = UpgradeConstants.upgradeDefinitions[id];
				hasBlueprintUnlocked = this.tribeNodes.head.upgrades.hasAvailableBlueprint(id);
				hasBlueprintNew = this.tribeNodes.head.upgrades.hasNewBlueprint(id);

				if (!this.tribeNodes.head.upgrades.hasUpgrade(id)) {
                    numUnResearched++;
                    var requirements = GameGlobals.playerActionsHelper.checkRequirements(id, false);
					isAvailable = requirements.value > 0;

					if (hasBlueprintNew || hasBlueprintUnlocked || isAvailable) {
						if (isActive && resetLists) {
							var tr = this.getUpgradeTR(upgradeDefinition, isAvailable, hasBlueprintUnlocked, hasBlueprintNew);
							if (hasBlueprintNew)
								$("#blueprints-list").append(tr);
							else
								$("#upgrades-list").append(tr);
						}
						var isResearchable = GameGlobals.playerActionsHelper.checkAvailability(id, false);
						if (hasBlueprintNew) this.currentBlueprints++;
						else {
							if (isResearchable) this.currentUpgrades++;
							this.availableUpgrades++;
						}
					}
				} else {
					if (isActive && resetLists) {
						var nameTD = "<td class='item-name'><span class='upgrade'>" + upgradeDefinition.name + "</span></td>";
						var descriptionTD = "<td>" + upgradeDefinition.description + "</td>";
						var tr = "<tr>" + nameTD + "" + descriptionTD + "</tr>";
						$("#researched-upgrades-list").append(tr);
					}

					if (hasBlueprintNew) this.tribeNodes.head.upgrades.useBlueprint(id);
				}
			}

			if (resetLists) {
				GameGlobals.uiFunctions.toggle("#world-upgrades-info", $("#researched-upgrades-list tr").length > 0);
                var noUpgrades = $("#upgrades-list tr").length === 0;
				GameGlobals.uiFunctions.toggle("#world-upgrades-empty-message", noUpgrades);
                if (noUpgrades) {
                    var allResearched = numUnResearched === 0;
                    $("#world-upgrades-empty-message").text(allResearched ?
                        "All upgrades researched." : "No upgrades available at the moment.");
                }

				$.each($("#upgrades-list button.action"), function () {
					$(this).click(function () {
						GameGlobals.playerActionFunctions.buyUpgrade($(this).attr("action"));
					})
				});

				GameGlobals.uiFunctions.generateButtonOverlays("#upgrades-list");
				GameGlobals.uiFunctions.generateCallouts("#upgrades-list");
				GameGlobals.uiFunctions.generateButtonOverlays("#blueprints-list");
				GameGlobals.uiFunctions.generateCallouts("#blueprints-list");
				GameGlobals.uiFunctions.registerActionButtonListeners("#blueprints-list");
                GlobalSignals.elementCreatedSignal.dispatch();
				this.lastUpdateUpgradeCount = this.tribeNodes.head.upgrades.boughtUpgrades.length;
			}

			if (isActive) this.lastShownBlueprints = this.currentBlueprints;
			if (isActive) this.lastShownUpgrades = this.currentUpgrades;
		},

        updateTechTree: function (resetLists) {
            if (!resetLists)
                return;
            GameGlobals.uiTechTreeHelper.drawTechTree("researched-upgrades-vis");
        },

		getUpgradeTR: function (upgradeDefinition, isAvailable, hasBlueprintUnlocked, hasBlueprintNew) {
			var nameTD = "<td class='item-name'>" + upgradeDefinition.name + "</td>";
			var classes = hasBlueprintNew ? "item item-equipped" : "item";
			var iconTD = "<td style='padding: 0px 3px'>";
			if (hasBlueprintUnlocked || hasBlueprintNew)
				iconTD += "<span class='" + classes + "'><div class='info-callout-target info-callout-target-small' description='blueprint'><img src='img/items/blueprint.png'/></div></span>";
			iconTD += "</td>";

			var descriptionTD = "<td class='maxwidth'>";
			if (hasBlueprintNew)
				descriptionTD += upgradeDefinition.description + "<br/>" + this.getEffectDescription(upgradeDefinition.id, hasBlueprintNew)  + "</td>";
			else
				descriptionTD += upgradeDefinition.description + "<br/>" + this.getEffectDescription(upgradeDefinition.id, hasBlueprintNew)  + "</td>";

			if (isAvailable || hasBlueprintUnlocked)
				buttonTD = "<td class='minwidth'><button class='action' action='" + upgradeDefinition.id + "'>research</button></td>";
			else if (hasBlueprintNew)
				buttonTD = "<td class='minwidth'><button class='action' action='unlock_upgrade_" + upgradeDefinition.id + "'>unlock</button></td>";
			else
				buttonTD = "<td></td>";

			return "<tr>" + nameTD + "" + descriptionTD + "" + iconTD + "" + buttonTD + "</tr>";
		},

		getEffectDescription: function (upgradeId, isUnlockable) {
			var effects = "";

			if(isUnlockable) {
				effects = "";
			} else {
				var unlockedBuildings = GameGlobals.upgradeEffectsHelper.getUnlockedBuildings(upgradeId);
				if (unlockedBuildings.length > 0) {
					effects += "buildings: ";
					for (var i in unlockedBuildings) {
						effects += unlockedBuildings[i].toLowerCase();
                        effects += ", ";
					}
				}

				var improvedBuildings = GameGlobals.upgradeEffectsHelper.getImprovedBuildings(upgradeId);
				if (improvedBuildings.length > 0) {
					for (var i in improvedBuildings) {
						effects += "improved " + improvedBuildings[i].toLowerCase();
					}
					effects += ", ";
				}

				var unlockedWorkers = GameGlobals.upgradeEffectsHelper.getUnlockedWorkers(upgradeId);
				if (unlockedWorkers.length > 0) {
					effects += "workers: ";
					for (var i in unlockedWorkers) {
						effects += unlockedWorkers[i];
					}
					effects += ", ";
				}

				var improvedWorkers = GameGlobals.upgradeEffectsHelper.getImprovedWorkers(upgradeId);
				if (improvedWorkers.length > 0) {
					for (var i in improvedWorkers) {
						effects += "improved " + improvedWorkers[i];
					}
					effects += ", ";
				}

				var unlockedItems = GameGlobals.upgradeEffectsHelper.getUnlockedItems(upgradeId);
				if (unlockedItems.length > 0) {
					effects += "items: ";
					for (var i in unlockedItems) {
						effects += unlockedItems[i].toLowerCase();
						effects += ", ";
					}
				}

				var unlockedOccurrences = GameGlobals.upgradeEffectsHelper.getUnlockedOccurrences(upgradeId);
				if (unlockedOccurrences.length > 0) {
					effects += "events: ";
					for (var i in unlockedOccurrences) {
						effects += unlockedOccurrences[i];
					}
					effects += ", ";
				}

				var improvedOccurrences = GameGlobals.upgradeEffectsHelper.getImprovedOccurrences(upgradeId);
				if (improvedOccurrences.length > 0) {
					for (var i in improvedOccurrences) {
						effects += "improved " + improvedOccurrences[i];
					}
					effects += ", ";
				}

				var unlockedUI = GameGlobals.upgradeEffectsHelper.getUnlockedUI(upgradeId);
				if (unlockedUI.length > 0) {
					for (var i in unlockedUI) {
						effects += "show " + unlockedUI[i];
					}
					effects += ", ";
				}


				// TODO unlocked upgrades? only when other requirements met / blueprint not required?

				if (effects.length > 0) effects = effects.slice(0, -2);
			}

			return "<span class='p-meta'>" + effects + " </span>";
		},
    });

    return UIOutUpgradesSystem;
});
