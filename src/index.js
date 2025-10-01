const { createApp } = Vue;
const { createVuetify } = Vuetify;

const vuetify = createVuetify();

createApp({
  data() {
    return {
      clientData: {
        Phone: "",
        Name: "",
        Address: "",
        Email: "",
      },
      notes: "",
      dispoLevels: [[], [], []],
      dispositions: [],
      selected: ["", "", ""],
      isFinishing: false,
      ctiData: null,
      campaign: {
        name: "",
        numbers: [],
      },
      hasCTI: false,
      agent: "", // Store agent account code
      availableCampaigns: [], // Store available campaigns for manual selection
      showNumberModal: false, // Control number selection modal
      numberOptions: [], // Store numbers for selection
      selectedNumber: null, // Store selected number
      numberSelectionResolve: null, // Promise resolver for modal
      isCallActive: false, // Track if a call is currently active
    };
  },
  mounted() {
    this.initializeForm();
  },
  methods: {
    async initializeForm() {
      // Set agent from Agent.accountcode
      this.setAgent();

      // Always load available campaigns first
      await this.loadAvailableCampaigns();

      if (await this.initializeCTI()) {
        this.hasCTI = true;
        console.log("Form initialized with CTI data");
      } else {
        this.hasCTI = false;
        console.log("No CTI data found, manual campaign selection required");
        this.loadNextClient();
      }
    },
    setAgent() {
      try {
        if (typeof Agent !== "undefined" && Agent && Agent.accountcode) {
          this.agent = Agent.accountcode;
          console.log("Agent set to:", this.agent);
        } else {
          console.log("Agent.accountcode not found");
          this.agent = "noAgent";
        }
      } catch (error) {
        console.error("Error getting agent account code:", error);
        this.agent = "noAgent";
      }
    },
    async initializeCTI() {
      try {
        if (typeof CTI !== "undefined" && CTI) {
          this.ctiData = JSON.parse(CTI);
          this.populateClientData();
          console.log("CTI data parsed:", this.ctiData);

          // Get client data using phone number from CTI
          if (this.clientData.Whatsapp) {
            await this.getClientData(this.clientData.Whatsapp);
          }

          return true;
        } else {
          console.log("No CTI data found");
          return false;
        }
      } catch (error) {
        console.error("Error parsing CTI data:", error);
        notification(
          "Error",
          "Error parsing CTI data: " + error.message,
          "fa fa-times",
          "danger"
        );
        return false;
      }
    },
    resetForm() {
      this.selected = ["", "", ""];
      this.notes = "";
      this.dispoLevels = [[], [], []];

      console.log("Form reset");
    },
    async loadAvailableCampaigns() {
      try {
        const query = `SELECT DISTINCT queuename FROM ccdata.queues_agents WHERE agent = '${this.agent}' AND channel = 'telephony' AND queuename LIKE '%->'`;
        const result = await UC_get_async(query);

        const campaignData = JSON.parse(result);

        if (campaignData && campaignData.length > 0) {
          this.availableCampaigns = campaignData.map((c) => c.queuename);
          console.log("Available campaigns loaded:", this.availableCampaigns);
        } else {
          console.log("No campaigns available for agent:", this.agent);
          this.availableCampaigns = [];
        }
      } catch (error) {
        console.error("Error loading available campaigns:", error);
        this.availableCampaigns = [];
      }
    },
    async onCampaignSelected() {
      if (this.campaign.name) {
        console.log("Campaign selected:", this.campaign.name);
        await this.loadCampaignNumbers();

        // Reset form when campaign changes
        this.resetForm();

        // Load dispositions for selected campaign
        await this.loadDispositionOptions();
      }
    },
    populateClientData() {
      if (this.ctiData) {
        if (this.ctiData.Campaign) {
          this.campaign.name = this.ctiData.Campaign;

          // Ensure CTI campaign is in the available campaigns list
          if (!this.availableCampaigns.includes(this.campaign.name)) {
            this.availableCampaigns.push(this.campaign.name);
            console.log(
              "Added CTI campaign to available campaigns:",
              this.campaign.name
            );
          }
        }

        if (this.ctiData.Callerid) {
          this.clientData.Id = this.ctiData.Callerid;
          this.clientData.Whatsapp = this.ctiData.Callerid;
        }

        if (this.ctiData.Guid) {
          this.clientData.Guid = this.ctiData.Guid;
        }

        if (this.ctiData.ParAndValues && this.ctiData.ParAndValues !== "") {
          try {
            console.log("ParAndValues:", this.ctiData.ParAndValues);
          } catch (e) {
            console.log("ParAndValues is not JSON:", this.ctiData.ParAndValues);
          }
        }

        console.log("Client data populated from CTI:", this.clientData);
        console.log("Campaign set to:", this.campaign.name);

        if (this.campaign.name) {
          this.loadDispositionOptions();
        }
      }
    },
    async loadDispositionOptions() {
      try {
        const query = `SELECT * FROM ccdata.dispositions WHERE campaign = '${this.campaign.name}'`;
        const result = await UC_get_async(query);
        this.dispositions = JSON.parse(result);

        const uniqueLevel1 = [
          ...new Set(this.dispositions.map((d) => d.value1)),
        ];
        this.dispoLevels[0] = uniqueLevel1.filter((v) => v && v.trim() !== "");

        console.log("Dispositions loaded for campaign:", this.campaign.name);
        console.log("Unique Level 1 options:", this.dispoLevels[0]);
      } catch (error) {
        console.error("Error loading dispositions:", error);
      }
    },
    async loadCampaignNumbers() {
      try {
        const query = `SELECT did FROM ccdata.queues WHERE name = '${this.campaign.name}'`;
        const result = await UC_get_async(query);
        const numbersData = JSON.parse(result);

        if (numbersData && numbersData.length > 0) {
          // each did has to be seprated, they all are concatenated in a single string with &
          this.campaign.numbers = numbersData
            .map((n) => n.did)
            .flatMap((num) => num.split(":").map((n) => n.trim()))
            .filter((n) => n && n !== "");

          console.log(
            "Campaign numbers loaded for",
            this.campaign.name,
            ":",
            this.campaign.numbers
          );
        } else {
          this.campaign.numbers = [];
          console.log("No numbers found for campaign:", this.campaign.name);
        }
      } catch (error) {
        console.error("Error loading campaign numbers:", error);
        this.campaign.numbers = [];
      }
    },
    loadNext(level) {
      if (level === 0) {
        this.selected[1] = "";
        this.selected[2] = "";

        const level2Options = this.dispositions
          .filter((d) => d.value1 === this.selected[0])
          .map((d) => d.value2)
          .filter((v) => v && v.trim() !== "");

        this.dispoLevels[1] = [...new Set(level2Options)];

        this.dispoLevels[2] = [];

        console.log(
          "Level 2 options for",
          this.selected[0],
          ":",
          this.dispoLevels[1]
        );
      }

      if (level === 1) {
        this.selected[2] = "";

        const level3Options = this.dispositions
          .filter(
            (d) =>
              d.value1 === this.selected[0] && d.value2 === this.selected[1]
          )
          .map((d) => d.value3)
          .filter((v) => v && v.trim() !== "");

        this.dispoLevels[2] = [...new Set(level3Options)];

        console.log(
          "Level 3 options for",
          this.selected[0],
          "->",
          this.selected[1],
          ":",
          this.dispoLevels[2]
        );
      }
    },
    async finish() {
      this.isFinishing = true;

      try {
        // Save the current client data and disposition
        await this.saveClientDisposition();

        // Delete the client from the queue after saving disposition
        await this.deleteClient();

        if (this.hasCTI) {
          UC_closeForm();
        }

        console.log("Final data:", {
          client: this.clientData,
          notes: this.notes,
          selected: this.selected,
          available: this.available,
        });

        // Unblock UI after finishing
        this.isCallActive = false;
        console.log("Call finished - UI unblocked");

        // Clear campaign selection if no CTI
        if (!this.hasCTI) {
          this.campaign.name = "";
          console.log("Campaign cleared");
        }
        // Reset form but don't auto-load next client
        this.resetForm();
        this.clientData = {
          Name: "",
          Address: "",
          Whatsapp: "",
          Email: "",
          Id: "",
          Guid: "",
          uuid: "",
          opp_id: "",
          stage_name: "",
        };

        notification(
          "Success",
          "Client processed successfully!",
          "fa fa-check",
          "success"
        );
      } catch (error) {
        console.error("Error in finish process:", error);
        notification(
          "Error",
          "Error saving data: " + error.message,
          "fa fa-times",
          "danger"
        );
      } finally {
        this.isFinishing = false;
      }
    },
    async saveClientDisposition() {
      try {
        await UC_DispositionCall_async(
          this.campaign.name,
          this.clientData.Whatsapp,
          this.clientData.Guid,
          this.selected[0],
          this.selected[1],
          this.selected[2],
          this.notes
        );
        console.log("Client disposition saved");
      } catch (error) {
        console.error("Error saving client disposition:", error);
        throw error;
      }
    },
    async callPhone() {
      const whatsappNumber = this.clientData.Whatsapp;
      if (whatsappNumber) {
        if (!this.campaign.name) {
          notification(
            "Warning",
            "Please select a campaign before making a call.",
            "fa fa-warning",
            "warning"
          );
          return;
        }

        let selectedNumber = null;

        if (this.campaign.numbers && this.campaign.numbers.length > 1) {
          // Show modal to select the number
          selectedNumber = await this.showNumberSelectionModal(
            this.campaign.numbers
          );
          if (!selectedNumber) {
            return; // User cancelled selection
          }
        } else if (
          this.campaign.numbers &&
          this.campaign.numbers.length === 1
        ) {
          // Use the only available number
          selectedNumber = this.campaign.numbers[0];
        } else {
          notification(
            "Warning",
            "No phone numbers available for this campaign",
            "fa fa-warning",
            "warning"
          );
          return;
        }

        try {
          const response = await UC_makeCall_async(
            this.campaign.name,
            selectedNumber,
            whatsappNumber,
            false
          );

          this.clientData.Guid = response;
          console.log("Call initiated:", response);

          // Set call as active to block campaign select and call button
          this.isCallActive = true;
          // Set agent as unavailable when a client is loaded
          this.available = false;
          UC_pause(true);
          console.log("Call is now active - UI blocked");
        } catch (error) {
          console.error("Error making call:", error);
          notification(
            "Error",
            "Error making call: " + error.message,
            "fa fa-times",
            "danger"
          );
        }
      } else {
        notification(
          "Warning",
          "No WhatsApp number available",
          "fa fa-warning",
          "warning"
        );
      }
    },
    showNumberSelectionModal(numbers) {
      return new Promise((resolve) => {
        this.numberOptions = numbers;
        this.selectedNumber = null;
        this.numberSelectionResolve = resolve;
        this.showNumberModal = true;
      });
    },
    selectNumber(number) {
      this.selectedNumber = number;
    },
    confirmNumberSelection() {
      if (this.selectedNumber && this.numberSelectionResolve) {
        this.numberSelectionResolve(this.selectedNumber);
        this.closeNumberModal();
      } else {
        notification(
          "Warning",
          "Please select a number",
          "fa fa-warning",
          "warning"
        );
      }
    },
    cancelNumberSelection() {
      if (this.numberSelectionResolve) {
        this.numberSelectionResolve(null);
        this.closeNumberModal();
      }
    },
    closeNumberModal() {
      this.showNumberModal = false;
      this.numberOptions = [];
      this.selectedNumber = null;
      this.numberSelectionResolve = null;
    },
  },
})
  .use(vuetify)
  .mount("#app");
