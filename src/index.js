const { createApp } = Vue;
const { createVuetify } = Vuetify;

const vuetify = createVuetify();
const instance = window.location.host;

// Sample CTI : '{"Guid":"824da669-2239-46f2-98c7-1a8cafa34701","Screen":"FALSE","Form":"testCapacitacion","Campaign":"SalienteTest->","Callerid":"17410632","ParAndValues":"","Beep":"FALSE","Answer":"FALSE"}'

createApp({
  data() {
    return {
      // Campaigns loaded from UC_getSystemCampaigns_async()
      campaigns: [],

      selectedCampaigns: [], // Array of selected campaign IDs
      currentCampaignId: null, // Currently active campaign being configured
      agentsByCampaign: {}, // Object to store agents for each selected campaign
      dispositionsByCampaign: {}, // Object to store dispositions for each selected campaign
      isSaving: false,

      // Token management
      currentToken: null,
      tokenDialog: false,
      tokenInput: "",
      isSavingToken: false,

      // Snackbar for notifications
      snackbar: {
        show: false,
        message: "",
        color: "success",
        timeout: 3000,
      },
    };
  },
  async mounted() {
    // Initialize form - load campaigns, token, and saved configuration
    await this.loadCampaigns();
    await this.loadToken();
    await this.loadSavedConfiguration();
    console.log("Form initialized with campaigns:", this.campaigns);
  },
  computed: {
    // Get agents for the currently active campaign only
    currentAgents() {
      if (!this.currentCampaignId) return [];
      return this.agentsByCampaign[this.currentCampaignId] || [];
    },

    // Get dispositions for the currently active campaign only
    currentDispositions() {
      if (!this.currentCampaignId) return [];
      return this.dispositionsByCampaign[this.currentCampaignId] || [];
    },

    // Check if any campaigns are selected
    hasSelectedCampaigns() {
      return this.selectedCampaigns.length > 0;
    },

    // Get the current campaign object
    currentCampaign() {
      if (!this.currentCampaignId) return null;
      return this.campaigns.find((c) => c.id === this.currentCampaignId);
    },

    // Token button label
    tokenButtonLabel() {
      return this.currentToken ? "Update Token" : "Set Token";
    },
  },

  methods: {
    showSnackbar(message, color = "success", timeout = 3000) {
      this.snackbar.message = message;
      this.snackbar.color = color;
      this.snackbar.timeout = timeout;
      this.snackbar.show = true;
    },

    async loadToken() {
      try {
        const result = await UC_get_async(
          `SELECT value FROM ccdata.configuration WHERE config = "TokenAI"`,
          "Data"
        );
        const data = JSON.parse(result);
        this.currentToken = data.length > 0 ? data[0].value : null;
      } catch (error) {
        console.error("Error loading token:", error);
        this.currentToken = null;
      }
    },

    openTokenDialog() {
      // Pre-fill with current token if it exists
      this.tokenInput = this.currentToken || "";
      this.tokenDialog = true;
    },

    closeTokenDialog() {
      this.tokenDialog = false;
      this.tokenInput = "";
    },

    async saveToken() {
      if (!this.tokenInput.trim()) {
        this.showSnackbar("Please enter a token", "warning");
        return;
      }

      this.isSavingToken = true;
      try {
        const result = await UC_exec_async(
          `UPDATE ccdata.configuration SET value = "${this.tokenInput}" WHERE config = "TokenAI"`,
          "Data"
        );

        if (result === "OK") {
          this.currentToken = this.tokenInput;
          this.showSnackbar("Token saved successfully!", "success");
          this.closeTokenDialog();
        } else {
          this.showSnackbar("Failed to save token", "error");
        }
      } catch (error) {
        console.error("Error saving token:", error);
        this.showSnackbar("Error saving token: " + error.message, "error");
      } finally {
        this.isSavingToken = false;
      }
    },

    async loadCampaigns() {
      try {
        // Fetch campaigns from UC function
        const response = await UC_getSystemCampaigns_async();

        // Parse the response if it's a string
        const campaignsData =
          typeof response === "string" ? JSON.parse(response) : response;

        // Transform the data into the format we need
        // Assuming the response is an array of campaign names or objects with name property
        this.campaigns = campaignsData.map((campaign, index) => {
          // If campaign is a string, use it as name
          const campaignName =
            typeof campaign === "string" ? campaign : campaign.name;

          return {
            id: index + 1,
            name: campaignName,
            selected: false,
          };
        });
      } catch (error) {
        console.error("Error loading campaigns:", error);
        // Set empty array on error
        this.campaigns = [];
      }
    },

    async loadSavedConfiguration() {
      try {
        // Load saved agents configuration
        const agentsResponse = await UC_get_async(
          `SELECT campaign, agent_name FROM ccrepo.InteractionAISettings_Agents;`,
          "Data"
        );
        const savedAgents = JSON.parse(agentsResponse);

        // Load saved dispositions configuration
        const dispositionsResponse = await UC_get_async(
          `SELECT campaign, value1, value2, value3 FROM ccrepo.InteractionAISettings_Dispositions;`,
          "Data"
        );
        const savedDispositions = JSON.parse(dispositionsResponse);

        // Group saved data by campaign
        const savedAgentsByCampaign = {};
        const savedDispositionsByCampaign = {};

        // Group agents by campaign
        savedAgents.forEach((item) => {
          if (!savedAgentsByCampaign[item.campaign]) {
            savedAgentsByCampaign[item.campaign] = [];
          }
          savedAgentsByCampaign[item.campaign].push(item.agent_name);
        });

        // Group dispositions by campaign
        savedDispositions.forEach((item) => {
          if (!savedDispositionsByCampaign[item.campaign]) {
            savedDispositionsByCampaign[item.campaign] = [];
          }
          savedDispositionsByCampaign[item.campaign].push({
            value1: item.value1,
            value2: item.value2,
            value3: item.value3,
          });
        });

        // Process each campaign that has saved configuration
        for (const campaignName in savedAgentsByCampaign) {
          const campaign = this.campaigns.find((c) => c.name === campaignName);
          if (!campaign) continue;

          // Mark campaign as selected
          campaign.selected = true;
          this.selectedCampaigns.push(campaign.id);

          // Load agents and dispositions for this campaign
          await this.loadAgentsForCampaign(campaign.id, campaign.name);
          await this.loadDispositionsForCampaign(campaign.id);

          // Wait a bit for data to be loaded
          await new Promise((resolve) => setTimeout(resolve, 100));

          // Mark saved agents as selected
          const savedAgentNames = savedAgentsByCampaign[campaignName];
          const allAgents = this.agentsByCampaign[campaign.id] || [];

          if (savedAgentNames.includes("*")) {
            // All agents are selected
            allAgents.forEach((agent) => {
              agent.selected = true;
            });
          } else {
            // Select specific agents
            allAgents.forEach((agent) => {
              if (savedAgentNames.includes(agent.name)) {
                agent.selected = true;
              }
            });
          }
        }

        // Process dispositions
        for (const campaignName in savedDispositionsByCampaign) {
          const campaign = this.campaigns.find((c) => c.name === campaignName);
          if (!campaign) continue;

          // Mark saved dispositions as selected
          const savedDispoValues = savedDispositionsByCampaign[campaignName];
          const allDispositions =
            this.dispositionsByCampaign[campaign.id] || [];

          if (savedDispoValues.some((d) => d.value1 === "*")) {
            // All dispositions are selected
            allDispositions.forEach((dispo) => {
              dispo.selected = true;
            });
          } else {
            // Select specific dispositions by matching value1, value2, value3
            allDispositions.forEach((dispo) => {
              const match = savedDispoValues.find(
                (saved) =>
                  saved.value1 === dispo.value1 &&
                  saved.value2 === dispo.value2 &&
                  saved.value3 === dispo.value3
              );
              if (match) {
                dispo.selected = true;
              }
            });
          }
        }

        // Set the first selected campaign as current if any
        if (this.selectedCampaigns.length > 0) {
          this.currentCampaignId = this.selectedCampaigns[0];
        }

        console.log("Saved configuration loaded successfully");
      } catch (error) {
        console.error("Error loading saved configuration:", error);
        // Don't show error to user, just log it - form can still be used
      }
    },

    toggleCampaign(campaign) {
      // Toggle the campaign selection
      if (campaign.selected) {
        // Unchecking the campaign - deselect it and clear all its selections
        campaign.selected = false;

        // Remove from selected campaigns array
        const index = this.selectedCampaigns.indexOf(campaign.id);
        if (index > -1) {
          this.selectedCampaigns.splice(index, 1);
        }

        // Clear all agent selections for this campaign
        if (this.agentsByCampaign[campaign.id]) {
          this.agentsByCampaign[campaign.id].forEach((agent) => {
            agent.selected = false;
          });
        }

        // Clear all disposition selections for this campaign
        if (this.dispositionsByCampaign[campaign.id]) {
          this.dispositionsByCampaign[campaign.id].forEach((disposition) => {
            disposition.selected = false;
          });
        }

        // If this was the current campaign, switch to another or clear
        if (this.currentCampaignId === campaign.id) {
          // Set to the first remaining selected campaign, or null
          this.currentCampaignId =
            this.selectedCampaigns.length > 0
              ? this.selectedCampaigns[0]
              : null;
        }
      } else {
        // Checking the campaign - enable it and set as current
        campaign.selected = true;

        // Add campaign to selected list if not already there
        if (!this.selectedCampaigns.includes(campaign.id)) {
          this.selectedCampaigns.push(campaign.id);
        }

        // Set as current campaign
        this.currentCampaignId = campaign.id;

        // Load agents and dispositions for this campaign if not already loaded
        if (!this.agentsByCampaign[campaign.id]) {
          this.loadAgentsForCampaign(campaign.id, campaign.name);
        }
        if (!this.dispositionsByCampaign[campaign.id]) {
          this.loadDispositionsForCampaign(campaign.id);
        }
      }
    },

    toggleCampaignSelection(campaign) {
      // This is called when clicking the checkbox
      this.toggleCampaign(campaign);
    },

    viewCampaign(campaign) {
      // This is called when clicking the list item (not the checkbox)
      // Only view/switch to the campaign if it's already selected
      if (campaign.selected) {
        this.currentCampaignId = campaign.id;
      } else {
        // If not selected, select it
        this.toggleCampaign(campaign);
      }
    },

    async loadAgentsForCampaign(campaignId, campaignName) {
      try {
        // Get the campaign name
        const campaign = this.campaigns.find((c) => c.id === campaignId);
        const queueName = campaignName || campaign?.name;

        if (!queueName) {
          console.error("Campaign name not found for id:", campaignId);
          this.agentsByCampaign[campaignId] = [];
          return;
        }

        // Fetch agents from UC API
        const response = await UC_Http_proxy({
          url: `https://${instance}/Integra/resources/queues/getqueuemembersofqueue?queue=${queueName}`,
          method: "POST",
          headers: {
            Authorization: `Basic ${Agent.token}`,
            "Content-type": "application/x-www-form-urlencoded",
          },
        });

        // Parse the response
        const data = JSON.parse(response.body);

        // Transform agents data - extract membername and create proper structure
        const agents = data.map((agent, index) => ({
          id: `${campaignId}-${index}`,
          name: agent.membername,
          email: "", // No email provided in the response
          selected: false,
        }));

        this.agentsByCampaign[campaignId] = agents;
      } catch (error) {
        console.error("Error loading agents for campaign:", campaignId, error);
        // Set empty array on error
        this.agentsByCampaign[campaignId] = [];
      }
    },

    async loadDispositionsForCampaign(campaignId) {
      try {
        // Get the campaign name
        const campaign = this.campaigns.find((c) => c.id === campaignId);
        const campaignName = campaign?.name;

        if (!campaignName) {
          console.error("Campaign name not found for id:", campaignId);
          this.dispositionsByCampaign[campaignId] = [];
          return;
        }

        // Fetch dispositions from database
        const response = await UC_get_async(
          `SELECT value1,value2,value3 FROM dispositions WHERE campaign = '${campaignName}'`,
          "Data"
        );

        // Parse the response
        const data = JSON.parse(response);

        // Transform dispositions data - format as "value1 | value2 | value3"
        const dispositions = data.map((dispo, index) => {
          // Build the name by concatenating non-empty values with " | "
          const parts = [];
          if (dispo.value1 && dispo.value1.trim() !== "")
            parts.push(dispo.value1);
          if (dispo.value2 && dispo.value2.trim() !== "")
            parts.push(dispo.value2);
          if (dispo.value3 && dispo.value3.trim() !== "")
            parts.push(dispo.value3);

          const displayName = parts.join(" | ");

          return {
            id: `${campaignId}-${index}`,
            name: displayName,
            description: "", // No description from this query
            selected: false,
            // Keep original values for reference if needed
            value1: dispo.value1,
            value2: dispo.value2,
            value3: dispo.value3,
          };
        });

        this.dispositionsByCampaign[campaignId] = dispositions;
      } catch (error) {
        console.error(
          "Error loading dispositions for campaign:",
          campaignId,
          error
        );
        // Set empty array on error
        this.dispositionsByCampaign[campaignId] = [];
      }
    },

    selectAllAgents(select) {
      // Select or deselect all agents for the current campaign
      if (
        this.currentCampaignId &&
        this.agentsByCampaign[this.currentCampaignId]
      ) {
        this.agentsByCampaign[this.currentCampaignId].forEach((agent) => {
          agent.selected = select;
        });
      }
    },

    selectAllDispositions(select) {
      // Select or deselect all dispositions for the current campaign
      if (
        this.currentCampaignId &&
        this.dispositionsByCampaign[this.currentCampaignId]
      ) {
        this.dispositionsByCampaign[this.currentCampaignId].forEach(
          (disposition) => {
            disposition.selected = select;
          }
        );
      }
    },

    async saveForm() {
      if (this.selectedCampaigns.length === 0) {
        this.showSnackbar("Please select at least one campaign", "warning");
        return;
      }

      this.isSaving = true;

      try {
        // Step 1: Clear old configuration
        console.log("Clearing old configuration...");
        await UC_exec_async(
          `DELETE FROM ccrepo.InteractionAISettings_Agents;`,
          "",
          true
        );
        await UC_exec_async(
          `DELETE FROM ccrepo.InteractionAISettings_Dispositions;`,
          "",
          true
        );

        // Step 2: Process each selected campaign
        let savedCount = 0;

        for (const campaignId of this.selectedCampaigns) {
          const campaign = this.campaigns.find((c) => c.id === campaignId);
          if (!campaign) continue;

          const campaignName = campaign.name;

          // Get selected agents and dispositions for this campaign
          const selectedAgents =
            this.agentsByCampaign[campaignId]?.filter((a) => a.selected) || [];
          const selectedDispositions =
            this.dispositionsByCampaign[campaignId]?.filter(
              (d) => d.selected
            ) || [];

          // Get total agents and dispositions (already loaded)
          const totalAgents = this.agentsByCampaign[campaignId] || [];
          const totalDispositions =
            this.dispositionsByCampaign[campaignId] || [];

          // Save Agents
          if (selectedAgents.length > 0) {
            // If all agents are selected, insert * to represent all
            if (selectedAgents.length === totalAgents.length) {
              await UC_exec_async(
                `INSERT INTO ccrepo.InteractionAISettings_Agents (campaign, agent_name) VALUES ("${campaignName}", "*");`,
                "",
                true
              );
            } else {
              // Insert each selected agent individually
              for (const agent of selectedAgents) {
                await UC_exec_async(
                  `INSERT INTO ccrepo.InteractionAISettings_Agents (campaign, agent_name) VALUES ("${campaignName}", "${agent.name}");`,
                  "",
                  true
                );
              }
            }
          }

          // Save Dispositions
          if (selectedDispositions.length > 0) {
            // If all dispositions are selected, insert * to represent all
            if (selectedDispositions.length === totalDispositions.length) {
              await UC_exec_async(
                `INSERT INTO ccrepo.InteractionAISettings_Dispositions (campaign, value1) VALUES ("${campaignName}", "*");`,
                "",
                true
              );
            } else {
              // Insert each selected disposition individually
              for (const dispo of selectedDispositions) {
                // Use the original value1, value2, value3 from the database
                const value1 = dispo.value1 || "";
                const value2 = dispo.value2 || "";
                const value3 = dispo.value3 || "";

                await UC_exec_async(
                  `INSERT INTO ccrepo.InteractionAISettings_Dispositions (campaign, value1, value2, value3) VALUES ("${campaignName}", "${value1}", "${value2}", "${value3}");`,
                  "",
                  true
                );
              }
            }
          }

          savedCount++;
        }

        // Success notification
        console.log("Configuration saved successfully!");
        this.showSnackbar(
          `Configuration saved successfully! ${savedCount} campaign(s) configured`,
          "success",
          4000
        );
      } catch (error) {
        console.error("Error saving configuration:", error);
        this.showSnackbar(
          "Error saving configuration: " + error.message,
          "error",
          5000
        );
      } finally {
        this.isSaving = false;
      }
    },

    updateToken() {
      // Implement token update logic here
      console.log("Updating token...");
      alert("Token update feature - implement your logic here");
    },
  },
})
  .use(vuetify)
  .mount("#app");
