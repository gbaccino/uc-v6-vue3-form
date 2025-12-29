const { createApp } = Vue;
const { createVuetify } = Vuetify;

const vuetify = createVuetify();
const api_url = "http://localhost:8085/IntegraChannels/resources/webhook";

// Sample CTI : '{"Guid":"824da669-2239-46f2-98c7-1a8cafa34701","Screen":"FALSE","Form":"testCapacitacion","Campaign":"SalienteTest->","Callerid":"17410632","ParAndValues":"","Beep":"FALSE","Answer":"FALSE"}'

createApp({
  data() {
    return {
      rules: {
        required: (value) => !!value || "Campo requerido",
        number: (value) => {
          const numberRegex = /^\d+$/;
          return numberRegex.test(value) || "Debe ser un número válido";
        },
        email: (value) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return (
            emailRegex.test(value) || "Debe ser un correo electrónico válido"
          );
        },
        text_fifty_length: (value) => {
          return (
            (value && value.length <= 50) || "No debe exceder los 50 caracteres"
          );
        },
        eleven_number_or_email: (value) => {
          const elevenDigitRegex = /^\d{11}$/;
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return (
            elevenDigitRegex.test(value) ||
            emailRegex.test(value) ||
            "Debe ser un número de 11 dígitos o un correo electrónico válido"
          );
        },
      },
      userTypes: ["Proveedor", "Entidad", "Marca", "Otros"],
      regions: [
        "Amazonas",
        "Ancash",
        "Apurímac",
        "Arequipa",
        "Ayacucho",
        "Cajamarca",
        "Callao",
        "Cusco",
        "Huancavelica",
        "Huánuco",
        "Ica",
        "Junín",
        "La Libertad",
        "Lambayeque",
      ],
      contractTypes: [
        "Contratos menores",
        "Compra por encargo",
        "Compra centralizada",
        "Compra pública de innovación",
        "Ficha técnica",
        "Compra directa",
        "Acuerdo marco",
        "Estandarización",
        "Otros",
      ],
      consultDispositions: [
        "Acceso al sistema",
        "Acreditación de marca",
        "Actos preparatorios",
        "Actualización de datos",
        "Anexo 2 proforma",
        "Anexo 3 orden de compra",
        "Antisoborno",
        "Atención de visitas",
        "Boletos aéreos",
        "Canales de atención",
        "Capacitación",
        "Catálogo electrónico",
        "Certificado presupuestal",
        "Cesión de derechos",
      ],
      atentionOrgans: [
        "Jefatura",
        "Gerencia General",
        "Órgano de Control Institucional",
        "Oficina de Asesoría Jurídica",
        "Oficina de Planeamiento y Presupuesto",
        "Oficina de Administración",
        "Oficina de Tecnología de la Información",
        "Oficina de Comunicaciones",
        "Oficina de Atención al Usuario y Gestión Documentaria",
        "Dirección de Estrategias Técnicas y Normativas",
        "Dirección de Compras Electrónicas y Modalidades Eficientes",
        "Dirección de Estandarización",
      ],
      consultStatus: ["Atendido", "Pendiente", "Encausado"],
      causeDetails: [
        "Reclamo",
        "Incidente",
        "Denuncia",
        "Acceso a la información",
        "Consulta técnica",
      ],
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
      isProcessing: false,
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
      isSaving: false, // Track if save operation is in progress
      interactionChannel: "", // Store the channel type: "Teléfono", "Webchat", or "SMS"
      activeTab: "form", // Control which tab is active
      isLoadedFromTable: false, // Track if user was loaded from search table
      userSearch: {
        phone: "",
        document: "",
        razonSocial: "",
      },
      userSearchResults: [],
      isSearching: false,
      userTableHeaders: [
        { title: "Contacto", key: "contacto_cliente", align: "start" },
        { title: "Documento", key: "documento", align: "start" },
        { title: "Razón Social", key: "razon_social", align: "start" },
        { title: "Tipo de Usuario", key: "tipo_usuario", align: "start" },
        { title: "Región", key: "region", align: "start" },
        { title: "Acciones", key: "actions", sortable: false, align: "center" },
      ],
      formData: {
        phoneOrEmail: "",
        document: "",
        razonSocial: "",
        userType: "",
        region: "",
        contractType: "",
        consultDisposition: "",
        consultDetails: "",
        acuerdoMacro: "",
        otros: "",
        atentionOrgan: "",
        consultStatus: "",
        causeDetail: "",
      },
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
          this.detectInteractionChannel();
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
    detectInteractionChannel() {
      if (!this.ctiData) {
        this.interactionChannel = "";
        return;
      }

      // Check if Channel key exists in CTI data
      if (this.ctiData.Channel) {
        const channelValue = this.ctiData.Channel.toLowerCase();

        if (channelValue === "webchat" || channelValue.includes("chat")) {
          this.interactionChannel = "Webchat";
          // For webchat, Callerid contains the email
          if (this.ctiData.Callerid) {
            this.formData.phoneOrEmail = this.ctiData.Callerid;
          }
        } else if (channelValue === "sms" || channelValue.includes("sms")) {
          this.interactionChannel = "SMS";
          // For SMS, Callerid contains the phone number
          if (this.ctiData.Callerid) {
            this.formData.phoneOrEmail = this.ctiData.Callerid;
          }
        } else {
          // Other channel types
          this.interactionChannel =
            channelValue.charAt(0).toUpperCase() + channelValue.slice(1);
          if (this.ctiData.Callerid) {
            this.formData.phoneOrEmail = this.ctiData.Callerid;
          }
        }
      } else {
        // No Channel key means it's a phone call
        this.interactionChannel = "Teléfono";
        // For phone calls, Callerid contains the phone number
        if (this.ctiData.Callerid) {
          this.formData.phoneOrEmail = this.ctiData.Callerid;
        }
      }

      console.log(`Interaction channel detected: ${this.interactionChannel}`);
    },
    getChannelColor() {
      switch (this.interactionChannel) {
        case "Teléfono":
          return "blue";
        case "Webchat":
          return "green";
        case "SMS":
          return "orange";
        default:
          return "grey";
      }
    },
    resetForm() {
      this.selected = ["", "", ""];
      this.dispoLevels = [[], [], []];
      this.notes = "";
      this.rescheduleDate = "";

      // Clear all form data fields
      this.formData = {
        phoneOrEmail: "",
        document: "",
        razonSocial: "",
        userType: "",
        region: "",
        contractType: "",
        consultDisposition: "",
        consultDetails: "",
        acuerdoMacro: "",
        otros: "",
        atentionOrgan: "",
        consultStatus: "",
        causeDetail: "",
      };
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
    async searchUsers() {
      // Build WHERE clause based on filled search fields
      const conditions = [];

      if (this.userSearch.phone && this.userSearch.phone.trim() !== "") {
        conditions.push(
          `contacto_cliente LIKE '%${this.userSearch.phone.trim()}%'`
        );
      }

      if (this.userSearch.document && this.userSearch.document.trim() !== "") {
        conditions.push(
          `documento LIKE '%${this.userSearch.document.trim()}%'`
        );
      }

      if (
        this.userSearch.razonSocial &&
        this.userSearch.razonSocial.trim() !== ""
      ) {
        conditions.push(
          `razon_social LIKE '%${this.userSearch.razonSocial.trim()}%'`
        );
      }

      // If no search criteria provided, don't search
      if (conditions.length === 0) {
        notification(
          "Advertencia",
          "Por favor ingrese al menos un criterio de búsqueda",
          "fa fa-warning",
          "warning"
        );
        return;
      }

      this.isSearching = true;

      try {
        // TODO: Replace with your actual table name and columns
        const whereClause = conditions.join(" AND ");
        const query = `SELECT * FROM ccrepo.PERUCOMPRAS_Atenciones_Llamadas WHERE ${whereClause} LIMIT 100`;

        const result = await UC_get_async(query, "Repo");
        const userData = JSON.parse(result);

        this.userSearchResults = userData || [];

        if (this.userSearchResults.length === 0) {
          notification(
            "Info",
            "No se encontraron usuarios con los criterios especificados",
            "fa fa-info",
            "info"
          );
        }
      } catch (error) {
        console.error("Error searching users:", error);
        notification(
          "Error",
          "Error al buscar usuarios: " + error.message,
          "fa fa-times",
          "danger"
        );
        this.userSearchResults = [];
      } finally {
        this.isSearching = false;
      }
    },
    loadUserToForm(user) {
      // Load user data into the form fields
      this.formData.phoneOrEmail = user.contacto_cliente || "";
      this.formData.document = user.documento || "";
      this.formData.razonSocial = user.razon_social || "";
      this.formData.userType = user.tipo_usuario || "";
      this.formData.region = user.region || "";
      this.formData.contractType = user.modalidad || "";
      this.formData.consultDisposition = user.tipificacion || "";
      this.formData.consultDetails = user.detalle || "";
      this.formData.atentionOrgan = user.organo || "";
      this.formData.consultStatus = user.estado || "";
      this.formData.causeDetail = user.detalle_encauzado || "";
      this.formData.acuerdoMacro = user.acuerdo || "";
      this.formData.otros = user.otros || "";

      // Mark as loaded from table to skip GUID/disposition validation
      this.isLoadedFromTable = true;

      // Switch to form tab
      this.activeTab = "form";

      notification(
        "Success",
        "Usuario cargado exitosamente",
        "fa fa-check",
        "success"
      );
    },
    async saveFormData() {
      // Validate required fields
      if (!this.formData.phoneOrEmail) {
        notification(
          "Advertencia",
          "El campo Teléfono o email es requerido",
          "fa fa-warning",
          "warning"
        );
        return;
      }

      if (!this.formData.document) {
        notification(
          "Advertencia",
          "El campo Documento es requerido",
          "fa fa-warning",
          "warning"
        );
        return;
      }

      if (!this.formData.razonSocial) {
        notification(
          "Advertencia",
          "El campo Razón Social es requerido",
          "fa fa-warning",
          "warning"
        );
        return;
      }

      this.isSaving = true;

      try {
        // Prepare the data for insertion/update
        const data = {
          GUID: this.ctiData.Guid || null,
          contacto_cliente: this.formData.phoneOrEmail,
          documento: this.formData.document,
          razon_social: this.formData.razonSocial,
          tipo_usuario: this.formData.userType || null,
          region: this.formData.region || null,
          modalidad: this.formData.contractType || null,
          tipificacion: this.formData.consultDisposition || null,
          detalle: this.formData.consultDetails || null,
          acuerdo: this.formData.acuerdoMacro || null,
          otros: this.formData.otros || null,
          organo: this.formData.atentionOrgan || null,
          estado: this.formData.consultStatus || null,
          detalle_encauzado: this.formData.causeDetail || null,
          atendido: this.agent || null,
          observaciones: this.notes || null,
        };

        // Check if record exists (by document)
        const checkQuery = `SELECT COUNT(*) as count FROM ccrepo.PERUCOMPRAS_Atenciones_Llamadas WHERE document = '${this.formData.document}'`;
        const checkResult = await UC_get_async(checkQuery);
        const recordExists = checkResult > 0;

        let query;
        if (recordExists) {
          // Update existing record
          const updateFields = [];
          for (const [key, value] of Object.entries(data)) {
            if (value !== null) {
              updateFields.push(
                `${key} = '${String(value).replace(/'/g, "''")}'`
              );
            }
          }
          query = `UPDATE ccrepo.PERUCOMPRAS_Atenciones_Llamadas SET ${updateFields.join(
            ", "
          )} WHERE document = '${this.formData.document}'`;
        } else {
          // Insert new record
          const columns = Object.keys(data).join(", ");
          const values = Object.values(data)
            .map((v) =>
              v !== null ? `'${String(v).replace(/'/g, "''")}' ` : "NULL"
            )
            .join(", ");
          query = `INSERT INTO ccrepo.PERUCOMPRAS_Atenciones_Llamadas (${columns}) VALUES (${values})`;
        }

        await UC_exec_async(query, "Repo");

        notification(
          "Éxito",
          recordExists
            ? "Datos actualizados correctamente"
            : "Datos guardados correctamente",
          "fa fa-check",
          "success"
        );
      } catch (error) {
        console.error("Error saving form data:", error);
        notification(
          "Error",
          "Error al guardar los datos: " + error.message,
          "fa fa-times",
          "danger"
        );
      } finally {
        this.isSaving = false;
      }
    },
    async saveAndFinish() {
      // Validate form data first
      if (!this.formData.phoneOrEmail) {
        notification(
          "Advertencia",
          "El campo Teléfono o email es requerido",
          "fa fa-warning",
          "warning"
        );
        return;
      }

      if (!this.formData.document) {
        notification(
          "Advertencia",
          "El campo Documento es requerido",
          "fa fa-warning",
          "warning"
        );
        return;
      }

      if (!this.formData.razonSocial) {
        notification(
          "Advertencia",
          "El campo Razón Social es requerido",
          "fa fa-warning",
          "warning"
        );
        return;
      }

      // Validate disposition before proceeding (skip if loaded from table)
      if (!this.isLoadedFromTable && !this.canFinish) {
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

      this.isProcessing = true;

      try {
        // Step 1: Save form data
        const data = {
          GUID: this.ctiData.Guid || null,
          contacto_cliente: this.formData.phoneOrEmail,
          documento: this.formData.document,
          razon_social: this.formData.razonSocial,
          tipo_usuario: this.formData.userType || null,
          region: this.formData.region || null,
          modalidad: this.formData.contractType || null,
          tipificacion: this.formData.consultDisposition || null,
          detalle: this.formData.consultDetails || null,
          acuerdo: this.formData.acuerdoMacro || null,
          otros: this.formData.otros || null,
          organo: this.formData.atentionOrgan || null,
          estado: this.formData.consultStatus || null,
          detalle_encauzado: this.formData.causeDetail || null,
          atendido: this.agent || null,
          observaciones: this.notes || null,
        };

        // Check if record exists (by document)
        const checkQuery = `SELECT COUNT(*) as count FROM ccrepo.PERUCOMPRAS_Atenciones_Llamadas WHERE document = '${this.formData.document}'`;
        const checkResult = await UC_get_async(checkQuery);
        const recordExists = checkResult > 0;

        let query;
        if (recordExists) {
          // Update existing record
          const updateFields = [];
          for (const [key, value] of Object.entries(data)) {
            if (value !== null) {
              updateFields.push(
                `${key} = '${String(value).replace(/'/g, "''")}'`
              );
            }
          }
          query = `UPDATE ccrepo.PERUCOMPRAS_Atenciones_Llamadas SET ${updateFields.join(
            ", "
          )} WHERE document = '${this.formData.document}'`;
        } else {
          // Insert new record
          const columns = Object.keys(data).join(", ");
          const values = Object.values(data)
            .map((v) =>
              v !== null ? `'${String(v).replace(/'/g, "''")}' ` : "NULL"
            )
            .join(", ");
          query = `INSERT INTO ccrepo.PERUCOMPRAS_Atenciones_Llamadas (${columns}) VALUES (${values})`;
        }

        await UC_exec_async(query, "Repo");

        // Step 2: Save disposition and finish (skip if loaded from table)
        if (!this.isLoadedFromTable) {
          await this.saveClientDisposition();

          if (this.hasCTI) {
            UC_closeForm();
          }
        }

        // Unblock UI after finishing
        this.isCallActive = false;

        // Clear campaign selection if no CTI
        if (!this.hasCTI) {
          this.campaign.name = "";
        }
        // Reset form but don't auto-load next client
        this.resetForm();

        // Reset the flag
        this.isLoadedFromTable = false;

        notification(
          "Éxito",
          "Datos guardados y cliente procesado exitosamente!",
          "fa fa-check",
          "success"
        );
      } catch (error) {
        console.error("Error in save and finish process:", error);
        notification(
          "Error",
          "Error al procesar: " + error.message,
          "fa fa-times",
          "danger"
        );
      } finally {
        this.isProcessing = false;
      }
    },
  },
})
  .use(vuetify)
  .mount("#app");
