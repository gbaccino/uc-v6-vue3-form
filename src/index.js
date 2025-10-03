const { createApp } = Vue;
const { createVuetify } = Vuetify;

const vuetify = createVuetify();

// Sample CTI : '{"Guid":"824da669-2239-46f2-98c7-1a8cafa34701","Screen":"FALSE","Form":"testCapacitacion","Campaign":"SalienteTest->","Callerid":"17410632","ParAndValues":"","Beep":"FALSE","Answer":"FALSE"}'

createApp({
  data() {
    return {
      clientData: {},
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
      notes: "", // Store notes for the client
    };
  },
  mounted() {
    this.initializeForm();
  },
  methods: {
    async initializeForm() {
      this.setAgent();

      await this.loadAvailableCampaigns();

      if (await this.initializeCTI()) {
        this.hasCTI = true;
      } else {
        this.hasCTI = false;
      }
    },
    setAgent() {
      try {
        if (typeof Agent !== "undefined" && Agent && Agent.accountcode) {
          this.agent = Agent.accountcode;
        } else {
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
          return true;
        } else {
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
      this.dispoLevels = [[], [], []];
    },
    async loadAvailableCampaigns() {
      try {
        const query = `SELECT DISTINCT queuename FROM ccdata.queues_agents WHERE agent = '${this.agent}' AND channel = 'telephony' AND queuename LIKE '%->'`;
        const result = await UC_get_async(query);

        const campaignData = JSON.parse(result);

        if (campaignData && campaignData.length > 0) {
          this.availableCampaigns = campaignData.map((c) => c.queuename);
        } else {
          this.availableCampaigns = [];
        }
      } catch (error) {
        console.error("Error loading available campaigns:", error);
        this.availableCampaigns = [];
      }
    },
    async onCampaignSelected() {
      if (this.campaign.name) {
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

          // Ensure CTI campaign is in the `available campaigns list
          if (!this.availableCampaigns.includes(this.campaign.name)) {
            this.availableCampaigns.push(this.campaign.name);
          }
        }

        if (this.ctiData.Callerid) {
          this.clientData.Phone = this.ctiData.Callerid;
        }

        if (this.ctiData.Guid) {
          this.clientData.Guid = this.ctiData.Guid;
        }

        if (this.ctiData.ParAndValues && this.ctiData.ParAndValues !== "") {
          try {
            const pairs = this.ctiData.ParAndValues.split(":");

            pairs.forEach((pair) => {
              const trimmedPair = pair.trim();
              if (trimmedPair) {
                const equalIndex = trimmedPair.indexOf("=");
                if (equalIndex !== -1) {
                  const key = trimmedPair.substring(0, equalIndex).trim();
                  const value = trimmedPair.substring(equalIndex + 1).trim();

                  if (key && value) {
                    this.clientData[key] = value;
                  }
                }
              }
            });
          } catch (e) {
            console.error("Error parsing ParAndValues:", e);
          }
        }

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
        } else {
          this.campaign.numbers = [];
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
      }
    },
    async finish() {
      this.isFinishing = true;

      try {
        await this.saveClientDisposition();

        if (this.hasCTI) {
          UC_closeForm();
        }

        // Unblock UI after finishing
        this.isCallActive = false;

        // Clear campaign selection if no CTI
        if (!this.hasCTI) {
          this.campaign.name = "";
        }
        // Reset form but don't auto-load next client
        this.resetForm();

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
          this.clientData.Phone,
          this.ctiData.Guid,
          this.selected[0],
          this.selected[1],
          this.selected[2],
          this.notes
        );
      } catch (error) {
        console.error("Error saving client disposition:", error);
        throw error;
      }
    },
    async callPhone() {
      const phone = this.clientData.Phone;

      if (phone) {
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
            phone,
            false
          );

          this.clientData.Guid = response;
          this.isCallActive = true;
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
          "No phone number available",
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
