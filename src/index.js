const { createApp } = Vue;
const { createVuetify } = Vuetify;

const vuetify = createVuetify();
const api_url = "http://localhost:8085/IntegraChannels/resources/webhook";

// Sample CTI : '{"Guid":"824da669-2239-46f2-98c7-1a8cafa34701","Screen":"FALSE","Form":"testCapacitacion","Campaign":"SalienteTest->","Callerid":"17410632","ParAndValues":"","Beep":"FALSE","Answer":"FALSE"}'

createApp({
  data() {
    return {
      rules: {
        required: (value) => !!value || "Field is required",
      },
      clientData: {
        nombre_del_cliente: "",
        fecha_de_nacimiento: "",
        rfc: "",
        no_tarjeta_crd: "",
        direccion: "",
        email: "",
        telefono_casa: "",
        telefono_oficina: "",
        telefono_celular: "",
        tenure: "",
        numero_de_supp_activas: "",
        card_product: "",
        ingresos: "",
        id_cliente: "",
        id_base: "",
        id_lote: "",
        nombre_del_lote: "",
      },
      dispoLevels: [[], [], []],
      dispositions: [],
      selected: ["", "", ""],
      isFinishing: false,
      ctiData: {},
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
      rescheduleDate: "", // Store reschedule date in YYYY-MM-DD HH:mm:ss format
    };
  },
  mounted() {
    this.initializeForm();
  },
  computed: {
    leftKeys() {
      const keys = Object.keys(this.clientData || {});
      const half = Math.ceil(keys.length / 2);
      return keys.slice(0, half);
    },
    rightKeys() {
      const keys = Object.keys(this.clientData || {});
      const half = Math.ceil(keys.length / 2);
      return keys.slice(half);
    },
    needsReschedule() {
      if (!this.selected[0]) return false;

      // Find disposition that matches the selected values
      const matchingDispos = this.dispositions.filter((d) => {
        if (this.selected[2]) {
          // All three levels selected
          return (
            d.value1 === this.selected[0] &&
            d.value2 === this.selected[1] &&
            d.value3 === this.selected[2]
          );
        } else if (this.selected[1]) {
          // Two levels selected
          return d.value1 === this.selected[0] && d.value2 === this.selected[1];
        } else {
          // Only first level selected
          return d.value1 === this.selected[0];
        }
      });

      return matchingDispos.some((d) => d.action === "RESCHEDULE");
    },
    minDateTime() {
      // Get current datetime in format YYYY-MM-DDTHH:mm for datetime-local input
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    },
    canFinish() {
      // Check if GUID exists
      if (!this.ctiData || !this.ctiData.Guid) return false;

      // Check if all available disposition levels are selected
      if (this.dispoLevels[0].length > 0 && !this.selected[0]) return false;
      if (this.dispoLevels[1].length > 0 && !this.selected[1]) return false;
      if (this.dispoLevels[2].length > 0 && !this.selected[2]) return false;

      // If reschedule is needed, date must be selected
      if (this.needsReschedule && !this.rescheduleDate) return false;

      return true;
    },
  },
  methods: {
    async initializeForm() {
      this.setAgent();

      await this.loadAvailableCampaigns();

      if (await this.initializeCTI()) {
        this.hasCTI = true;

        const formatted = new Intl.DateTimeFormat("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
          .format(new Date())
          .replace(",", "");
        const endpoint = api_url + "/AMEX_API_ENTRANTE";
        const options = {
          guid: this.ctiData.Guid,
          phone: this.ctiData.Callerid,
          user_id: this.agent,
          start_date: formatted,
          base_id: this.clientData.id_base,
          client_id: this.clientData.id_cliente,
        };
        try {
          this.makeRequest(endpoint, options);
        } catch (error) {
          console.error("Error making request:", error);
          notification(
            "Error",
            "Error registrando la llamada: " + error.message,
            "fa fa-times",
            "danger"
          );
        }
      } else {
        this.hasCTI = false;
      }
    },
    setAgent() {
      try {
        if (typeof Agent !== "undefined" && Agent && Agent.accountcode) {
          this.agent = Agent.accountcode;
        } else {
          this.agent = "No agent";
        }
      } catch (error) {
        console.error("Error getting agent account code:", error);
        this.agent = "No agent";
      }
    },
    formatLabel(key) {
      if (key === null || key === undefined) return "";
      const s = String(key).replace(/_/g, " ");
      return s.charAt(0).toUpperCase() + s.slice(1);
    },
    formatRescheduleDate(dateTimeLocal) {
      // Convert from datetime-local format (YYYY-MM-DDTHH:mm) to YYYY-MM-DD HH:mm:ss
      if (!dateTimeLocal) return "";
      const date = new Date(dateTimeLocal);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = "00";
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
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
    async transferTokenizacion() {
      if (!this.ctiData || !this.ctiData.Guid) {
        notification(
          "Warning",
          "CTI o GUID no disponible.",
          "fa fa-warning",
          "warning"
        );
        return;
      }

      this.realizarTransferencia("tokenizacion");
    },
    async transferSanas() {
      if (!this.ctiData || !this.ctiData.Guid) {
        notification(
          "Warning",
          "CTI o GUID no disponible.",
          "fa fa-warning",
          "warning"
        );
        return;
      }

      const endpoint = api_url + "/AMEX_API_SANAS_GET";
      const options = { guid: this.ctiData.Guid };

      const response = await this.makeRequest(endpoint, options);
      console.log(response);

      if (response.status === 200) {
        this.realizarTransferencia("sanas");
      } else {
        notification(
          "Warning",
          response.message || "No cumple criterios para transferencia a Sanas.",
          "fa fa-warning",
          "warning"
        );
      }
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
      // Validate before proceeding
      if (!this.canFinish) {
        let reason = "";

        if (!this.ctiData || !this.ctiData.Guid) {
          reason = "No hay GUID disponible.";
        } else if (this.dispoLevels[0].length > 0 && !this.selected[0]) {
          reason = "Debe seleccionar una tipificación de Nivel 1.";
        } else if (this.dispoLevels[1].length > 0 && !this.selected[1]) {
          reason = "Debe seleccionar una tipificación de Nivel 2.";
        } else if (this.dispoLevels[2].length > 0 && !this.selected[2]) {
          reason = "Debe seleccionar una tipificación de Nivel 3.";
        } else if (this.needsReschedule && !this.rescheduleDate) {
          reason = "Debe seleccionar una fecha de reagendado.";
        }

        notification("Advertencia", reason, "fa fa-warning", "warning");
        return;
      }

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
          "Cliente procesado exitosamente!",
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
        if (this.needsReschedule && this.rescheduleDate) {
          // Call with reschedule parameters
          await UC_DispositionCall_async(
            this.campaign.name,
            this.clientData.Phone,
            this.ctiData.Guid,
            this.selected[0],
            this.selected[1],
            this.selected[2],
            this.agent || "",
            this.clientData.nombre_del_cliente || "",
            this.notes,
            this.rescheduleDate,
            null
          );
        } else {
          // Normal call without reschedule parameters
          await UC_DispositionCall_async(
            this.campaign.name,
            this.clientData.Phone,
            this.ctiData.Guid,
            this.selected[0],
            this.selected[1],
            this.selected[2],
            this.agent || "",
            this.clientData.nombre_del_cliente || "",
            this.notes
          );
        }
      } catch (error) {
        console.error("Error saving client disposition:", error);
        throw error;
      }
    },
    pausarAgente() {
      let query = `UPDATE ccdata.asterisk_members SET paused = '1' WHERE membername = '${membername}';`;
      UC_exec(query, "");
    },
    realizarTransferencia(to) {
      let extension = "";
      let destination = "";
      if (to === "tokenizacion") {
        extension = "##88888#";
        destination = "Tokenización";
      } else if (to === "sanas") {
        extension = "##77777#";
        destination = "Sanas Prácticas";
      }
      if (parent.__isInCall()) {
        notification(
          "Transferencia",
          `Transfiriendo llamada a ${destination}...`,
          "fa fa-phone",
          "info"
        );
        parent.transfering = true;
        parent.__SendDTMF(extension);
        verificarLlamada();
      } else {
        console.log("No hay llamada activa");
      }
    },
    async makeRequest(endpoint, options = {}) {
      try {
        const response = await UC_Http_proxy({
          url: endpoint,
          method: "POST",
          headers: {},
          body: JSON.stringify(options),
          type: "application/json",
        });

        return {
          status: response.code,
          message: JSON.parse(response.body).message || "",
          body: response.body,
        };
      } catch (error) {
        console.error("Error making request to", endpoint, ":", error);
        throw error;
      }
    },
  },
})
  .use(vuetify)
  .mount("#app");
