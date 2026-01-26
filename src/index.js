const { createApp } = Vue;
const { createVuetify } = Vuetify;

const vuetify = createVuetify();
const api_url = "http://localhost:8085/IntegraChannels/resources/webhook";

// Sample CTI : '{"Guid":"824da669-2239-46f2-98c7-1a8cafa34701","Screen":"FALSE","Form":"testCapacitacion","Campaign":"SalienteTest->","Callerid":"17410632","ParAndValues":"","Beep":"FALSE","Answer":"FALSE"}'

createApp({
  data() {
    return {
      rules: {
        required: (value) =>
          !!(value && String(value).trim()) || "Campo requerido",
        number: (value) => {
          if (!value) return true;
          const trimmed = String(value).trim();
          const numberRegex = /^\d+$/;
          return numberRegex.test(trimmed) || "Debe ser un número válido";
        },
        email: (value) => {
          if (!value) return true;
          const trimmed = String(value).trim();
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return (
            emailRegex.test(trimmed) || "Debe ser un correo electrónico válido"
          );
        },
        phone: (value) => {
          if (!value) return true; // Optional field
          const trimmed = String(value).trim();
          const phoneRegex = /^\d{0,11}$/;
          return (
            phoneRegex.test(trimmed) ||
            "Debe ser un número de teléfono válido (máximo 11 dígitos)"
          );
        },
        phoneRequired: (value) => {
          if (!value)
            return "Debe ser un número de teléfono válido (máximo 11 dígitos)";
          const trimmed = String(value).trim();
          const phoneRegex = /^\d{0,11}$/;
          return (
            phoneRegex.test(trimmed) ||
            "Debe ser un número de teléfono válido (máximo 11 dígitos)"
          );
        },
        document: (value) => {
          if (!value) return true; // Optional field
          const trimmed = String(value).trim();
          const docRegex = /^\d{11,}$/;
          return (
            docRegex.test(trimmed) ||
            "Debe ser un número de documento válido (mínimo 11 dígitos)"
          );
        },
      },

      // Catalog data loaded from database
      catalogs: {
        tipoUsuario: [],
        tipoDocumento: [],
        region: [],
        temaConsulta: [],
        estadoConsulta: [],
        organoAtencion: [],
        satisfaccionServicio: [],
        valoracionAtencion: [],
        acuerdoMarco: [],
      },

      isProcessing: false,
      isSaving: false,
      ctiData: {},
      hasCTI: false,
      agent: "",
      agentId: null,
      activeTab: "form",
      isLoadedFromTable: false,

      // Common interaction data (PERUCOMPRAS_interactions table)
      interaction: {
        guid: "",
        channel: "",
        fecha_hora_interaccion: "",
        tipo_usuario_id: null,
        tipo_documento_id: null,
        numero_documento: "",
        razon_social: "",
        region_id: null,
        tema_consulta_id: null,
        estado_consulta_id: null,
        organo_atencion_id: null,
        agente_id: null,
        satisfaccion_servicio_id: null,
      },

      // Channel-specific data (PERUCOMPRAS_interaction_llamada)
      llamadaData: {
        numero_telefonico: "",
        duracion_llamada: 0,
        acuerdo_marco_id: null,
        detalle_acuerdo_marco: "",
        detalle_consulta: "",
      },

      // Channel-specific data (PERUCOMPRAS_interaction_whatsapp)
      whatsappData: {
        numero_celular: "",
        consulta: "",
        respuesta: "",
        valoracion_atencion_id: null,
      },

      // Channel-specific data (PERUCOMPRAS_interaction_email)
      emailData: {
        correo: "",
        asunto: "",
        fecha_atencion: null,
        estado_atencion_encauzado: false,
        fecha_derivacion: null,
        dias_atencion_organo: null,
        estado_atencion_organo_id: null,
        agente_atendio_id: null,
      },

      // Channel-specific data (PERUCOMPRAS_interaction_presencial)
      presencialData: {
        hora_ingreso: "",
        hora_salida: "",
        numero_telefonico: "",
        correo: "",
        detalle_consulta: "",
      },

      // User search functionality
      userSearch: {
        phone: "",
        document: "",
        razonSocial: "",
        channels: ["LLAMADA", "WHATSAPP", "EMAIL", "WEBCHAT", "PRESENCIAL"],
        agentId: null,
        estadoConsultaId: null,
      },
      userSearchResults: [],
      isSearching: false,
      availableChannels: [
        { value: "LLAMADA", title: "Llamada" },
        { value: "WHATSAPP", title: "WhatsApp" },
        { value: "EMAIL", title: "Email" },
        { value: "WEBCHAT", title: "WebChat" },
        { value: "PRESENCIAL", title: "Presencial" },
      ],
      agentList: [],
      userTableHeaders: [
        { title: "Canal", key: "channel", align: "start" },
        { title: "Razón Social", key: "razon_social", align: "start" },
        { title: "Documento", key: "numero_documento", align: "start" },
        { title: "Fecha", key: "fecha_hora_interaccion", align: "start" },
        { title: "Agente", key: "agente_nombre", align: "start" },
        { title: "Estado", key: "estado_consulta_nombre", align: "start" },
        { title: "Acciones", key: "actions", sortable: false, align: "center" },
      ],
      hasLoadedInitialSearch: false,
    };
  },
  mounted() {
    this.initializeForm();
  },
  watch: {
    activeTab(newTab) {
      // When switching to the list tab, perform an initial search if not done yet
      if (newTab === "list" && !this.hasLoadedInitialSearch) {
        this.performInitialSearch();
      }
    },
  },
  computed: {
    // Helper to get catalog item name by ID
    getCatalogName() {
      return (catalogArray, id) => {
        const item = catalogArray.find((c) => c.id === id);
        return item ? item.nombre : "";
      };
    },
  },
  methods: {
    // Load all catalog data from database
    async loadCatalogs() {
      try {
        const catalogQueries = [
          {
            key: "tipoUsuario",
            query:
              "SELECT id, nombre FROM ccrepo.PERUCOMPRAS_tipo_usuario ORDER BY nombre",
          },
          {
            key: "tipoDocumento",
            query:
              "SELECT id, nombre FROM ccrepo.PERUCOMPRAS_tipo_documento ORDER BY nombre",
          },
          {
            key: "region",
            query:
              "SELECT id, nombre FROM ccrepo.PERUCOMPRAS_region ORDER BY nombre",
          },
          {
            key: "temaConsulta",
            query:
              "SELECT id, nombre FROM ccrepo.PERUCOMPRAS_tema_consulta ORDER BY nombre",
          },
          {
            key: "estadoConsulta",
            query:
              "SELECT id, nombre FROM ccrepo.PERUCOMPRAS_estado_consulta ORDER BY nombre",
          },
          {
            key: "organoAtencion",
            query:
              "SELECT id, nombre FROM ccrepo.PERUCOMPRAS_organo_atencion ORDER BY nombre",
          },
          {
            key: "satisfaccionServicio",
            query:
              "SELECT id, nombre FROM ccrepo.PERUCOMPRAS_satisfaccion_servicio ORDER BY nombre",
          },
          {
            key: "valoracionAtencion",
            query:
              "SELECT id, nombre FROM ccrepo.PERUCOMPRAS_valoracion_atencion ORDER BY nombre",
          },
          {
            key: "acuerdoMarco",
            query:
              "SELECT id, nombre FROM ccrepo.PERUCOMPRAS_acuerdo_marco ORDER BY nombre",
          },
        ];

        // Load all catalogs in parallel
        const promises = catalogQueries.map(async ({ key, query }) => {
          try {
            const result = await UC_get_async(query, "Repo");
            const data = JSON.parse(result);
            this.catalogs[key] = data || [];
          } catch (error) {
            console.error(`Error loading catalog ${key}:`, error);
            this.catalogs[key] = [];
          }
        });

        await Promise.all(promises);
        console.log("Catalogs loaded successfully");
      } catch (error) {
        console.error("Error loading catalogs:", error);
        notification(
          "Error",
          "Error al cargar los catálogos: " + error.message,
          "fa fa-times",
          "danger",
        );
      }
    },

    async loadAgentList() {
      try {
        const query =
          "SELECT id, accountcode, name FROM ccdata.sip ORDER BY accountcode";
        const result = await UC_get_async(query, "Repo");
        const data = JSON.parse(result);
        this.agentList = data || [];
        console.log("Agent list loaded successfully");
      } catch (error) {
        console.error("Error loading agent list:", error);
        this.agentList = [];
      }
    },

    async getAgentId() {
      try {
        if (this.agent && this.agent !== "No agent") {
          const query = `SELECT id FROM ccdata.sip WHERE accountcode = '${this.agent}' LIMIT 1`;
          const result = await UC_get_async(query, "Repo");
          const data = JSON.parse(result);
          if (data && data.length > 0) {
            this.agentId = data[0].id;
          }
        }
      } catch (error) {
        console.error("Error getting agent ID:", error);
      }
    },
    getTodayDate() {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      return `${day}/${month}/${year}`;
    },
    async initializeForm() {
      this.setAgent();
      await this.loadCatalogs();
      await this.loadAgentList();
      await this.getAgentId();

      // Set default search filter for estado_consulta to "Pendiente"
      const pendienteEstado = this.catalogs.estadoConsulta.find(
        (estado) => estado.nombre.toLowerCase() === "pendiente",
      );
      if (pendienteEstado) {
        this.userSearch.estadoConsultaId = pendienteEstado.id;
      }

      if (await this.initializeCTI()) {
        this.hasCTI = true;
      } else {
        this.hasCTI = false;
        // When there's no CTI, it's a manual form opening = PRESENCIAL
        this.interaction.channel = "PRESENCIAL";
        const now = new Date();
        this.presencialData.hora_ingreso = now.toTimeString().slice(0, 5); // HH:MM format
      }

      // Initialize interaction data
      this.interaction.guid = this.ctiData.Guid || this.generateGuid();
      this.interaction.fecha_hora_interaccion = new Date()
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");
      this.interaction.agente_id = this.agentId;
    },

    generateGuid() {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        function (c) {
          const r = (Math.random() * 16) | 0;
          const v = c === "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        },
      );
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

    async initializeCTI() {
      try {
        if (typeof CTI !== "undefined" && CTI) {
          this.ctiData = JSON.parse(CTI);
          this.detectInteractionChannel();
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
          "danger",
        );
        return false;
      }
    },
    detectInteractionChannel() {
      if (!this.ctiData) {
        this.interaction.channel = "";
        return;
      }

      // Check if Channel key exists in CTI data
      if (this.ctiData.Channel) {
        const channelValue = this.ctiData.Channel.toLowerCase();

        if (
          channelValue === "whatsapp" ||
          channelValue.includes("whatsapp") ||
          channelValue === "sms" ||
          channelValue.includes("sms")
        ) {
          this.interaction.channel = "WHATSAPP";
          // For WhatsApp, Callerid contains the phone number
          if (this.ctiData.Callerid) {
            this.whatsappData.numero_celular = this.ctiData.Callerid;
          }
        } else if (channelValue === "email" || channelValue.includes("mail")) {
          this.interaction.channel = "EMAIL";
          // For email, Callerid contains the email address
          if (this.ctiData.Callerid) {
            this.emailData.correo = this.ctiData.Callerid;
          }
        } else if (
          channelValue === "webchat" ||
          channelValue.includes("chat")
        ) {
          this.interaction.channel = "WEBCHAT";
          // Webchat has no additional channel-specific fields
          // Uses only common interaction fields
        } else {
          // Default to phone call
          this.interaction.channel = "LLAMADA";
          if (this.ctiData.Callerid) {
            this.llamadaData.numero_telefonico = this.ctiData.Callerid;
          }
        }
      } else {
        // No Channel key means it's a phone call
        this.interaction.channel = "LLAMADA";
        // For phone calls, Callerid contains the phone number
        if (this.ctiData.Callerid) {
          this.llamadaData.numero_telefonico = this.ctiData.Callerid;
        }
      }

      console.log(`Interaction channel detected: ${this.interaction.channel}`);
    },
    getChannelColor() {
      switch (this.interaction.channel) {
        case "LLAMADA":
          return "light-blue";
        case "WHATSAPP":
          return "light-green";
        case "EMAIL":
          return "orange";
        case "WEBCHAT":
          return "pink";
        case "PRESENCIAL":
          return "amber";
        default:
          return "grey";
      }
    },
    resetForm() {
      // Determine the channel for the new form
      // If there's no CTI, default to PRESENCIAL
      const newChannel = this.hasCTI ? this.interaction.channel : "PRESENCIAL";

      // Reset common interaction data
      this.interaction = {
        guid: this.generateGuid(),
        channel: newChannel,
        fecha_hora_interaccion: new Date()
          .toISOString()
          .slice(0, 19)
          .replace("T", " "),
        tipo_usuario_id: null,
        tipo_documento_id: null,
        numero_documento: "",
        razon_social: "",
        region_id: null,
        tema_consulta_id: null,
        estado_consulta_id: null,
        organo_atencion_id: null,
        agente_id: this.agentId,
        satisfaccion_servicio_id: null,
      };

      // Reset channel-specific data
      this.llamadaData = {
        numero_telefonico: "",
        duracion_llamada: 0,
        acuerdo_marco_id: null,
        detalle_acuerdo_marco: "",
        detalle_consulta: "",
      };

      this.whatsappData = {
        numero_celular: "",
        consulta: "",
        respuesta: "",
        valoracion_atencion_id: null,
      };

      this.emailData = {
        correo: "",
        asunto: "",
        fecha_atencion: null,
        estado_atencion_encauzado: false,
        fecha_derivacion: null,
        dias_atencion_organo: null,
        estado_atencion_organo_id: null,
        agente_atendio_id: this.agentId,
      };

      this.presencialData = {
        hora_ingreso: "",
        hora_salida: "",
        numero_telefonico: "",
        correo: "",
        detalle_consulta: "",
      };

      // Set hora_ingreso for PRESENCIAL channel
      if (newChannel === "PRESENCIAL") {
        const now = new Date();
        this.presencialData.hora_ingreso = now.toTimeString().slice(0, 5);
      }

      this.isLoadedFromTable = false;
    },

    async performInitialSearch() {
      // Perform a search with just the default channels selected
      this.hasLoadedInitialSearch = true;
      await this.searchUsers();
    },

    async searchUsers() {
      // Build WHERE clause based on filled search fields
      const conditions = [];

      if (this.userSearch.phone && this.userSearch.phone.trim() !== "") {
        // Search in all channel-specific tables for phone/contact
        conditions.push(
          `(il.numero_telefonico LIKE '%${this.userSearch.phone.trim()}%' OR iw.numero_celular LIKE '%${this.userSearch.phone.trim()}%' OR ie.correo LIKE '%${this.userSearch.phone.trim()}%' OR ip.numero_telefonico LIKE '%${this.userSearch.phone.trim()}%' OR ip.correo LIKE '%${this.userSearch.phone.trim()}%')`,
        );
      }

      if (this.userSearch.document && this.userSearch.document.trim() !== "") {
        conditions.push(
          `i.numero_documento LIKE '%${this.userSearch.document.trim()}%'`,
        );
      }

      if (
        this.userSearch.razonSocial &&
        this.userSearch.razonSocial.trim() !== ""
      ) {
        conditions.push(
          `i.razon_social LIKE '%${this.userSearch.razonSocial.trim()}%'`,
        );
      }

      // Filter by channels
      if (this.userSearch.channels && this.userSearch.channels.length > 0) {
        const channelList = this.userSearch.channels
          .map((ch) => `'${ch}'`)
          .join(", ");
        conditions.push(`i.channel IN (${channelList})`);
      }

      // Filter by agent
      if (this.userSearch.agentId) {
        conditions.push(`i.agente_id = ${this.userSearch.agentId}`);
      }

      // Filter by status
      if (this.userSearch.estadoConsultaId) {
        conditions.push(
          `i.estado_consulta_id = ${this.userSearch.estadoConsultaId}`,
        );
      }

      // If no search criteria provided, don't search
      if (conditions.length === 0) {
        notification(
          "Advertencia",
          "Por favor ingrese al menos un criterio de búsqueda",
          "fa fa-warning",
          "warning",
        );
        return;
      }

      this.isSearching = true;

      try {
        const whereClause = conditions.join(" AND ");
        const query = `
          SELECT 
            i.guid,
            i.channel,
            i.numero_documento,
            i.razon_social,
            i.fecha_hora_interaccion,
            COALESCE(s.accountcode, 'N/A') as agente_nombre,
            COALESCE(ec.nombre, 'N/A') as estado_consulta_nombre
          FROM ccrepo.PERUCOMPRAS_interactions i
          LEFT JOIN ccrepo.PERUCOMPRAS_interaction_llamada il ON i.guid = il.guid
          LEFT JOIN ccrepo.PERUCOMPRAS_interaction_whatsapp iw ON i.guid = iw.guid
          LEFT JOIN ccrepo.PERUCOMPRAS_interaction_email ie ON i.guid = ie.guid
          LEFT JOIN ccrepo.PERUCOMPRAS_interaction_presencial ip ON i.guid = ip.guid
          LEFT JOIN ccdata.sip s ON i.agente_id = s.id
          LEFT JOIN ccrepo.PERUCOMPRAS_estado_consulta ec ON i.estado_consulta_id = ec.id
          WHERE ${whereClause}
          GROUP BY i.guid, i.channel, i.numero_documento, i.razon_social, i.fecha_hora_interaccion, s.accountcode, ec.nombre
          ORDER BY i.fecha_hora_interaccion DESC
          LIMIT 100
        `;

        const result = await UC_get_async(query, "Repo");
        const userData = JSON.parse(result);

        this.userSearchResults = userData || [];

        if (this.userSearchResults.length === 0) {
          notification(
            "Info",
            "No se encontraron interacciones con los criterios especificados",
            "fa fa-info",
            "info",
          );
        }
      } catch (error) {
        console.error("Error searching users:", error);
        notification(
          "Error",
          "Error al buscar usuarios: " + error.message,
          "fa fa-times",
          "danger",
        );
        this.userSearchResults = [];
      } finally {
        this.isSearching = false;
      }
    },
    async loadUserToForm(user) {
      try {
        // Load full interaction data from database
        const query = `
          SELECT 
            i.*,
            il.numero_telefonico, il.duracion_llamada, il.acuerdo_marco_id, 
            il.detalle_acuerdo_marco, il.detalle_consulta,
            iw.numero_celular, iw.consulta, iw.respuesta, iw.valoracion_atencion_id,
            ie.correo, ie.asunto, ie.fecha_atencion, ie.estado_atencion_id,
            ie.estado_atencion_encauzado, ie.fecha_derivacion, ie.dias_atencion_organo,
            ie.estado_atencion_organo_id, ie.agente_atendio_id,
            ip.hora_ingreso, ip.hora_salida, ip.numero_telefonico as ip_numero_telefonico,
            ip.correo as ip_correo, ip.detalle_consulta as ip_detalle_consulta
          FROM ccrepo.PERUCOMPRAS_interactions i
          LEFT JOIN ccrepo.PERUCOMPRAS_interaction_llamada il ON i.guid = il.guid
          LEFT JOIN ccrepo.PERUCOMPRAS_interaction_whatsapp iw ON i.guid = iw.guid
          LEFT JOIN ccrepo.PERUCOMPRAS_interaction_email ie ON i.guid = ie.guid
          LEFT JOIN ccrepo.PERUCOMPRAS_interaction_presencial ip ON i.guid = ip.guid
          WHERE i.guid = '${user.guid}'
        `;

        const result = await UC_get_async(query, "Repo");
        const data = JSON.parse(result);

        if (data && data.length > 0) {
          const fullData = data[0];

          // Load common interaction data
          this.interaction = {
            guid: fullData.guid,
            channel: fullData.channel,
            fecha_hora_interaccion: fullData.fecha_hora_interaccion,
            tipo_usuario_id: fullData.tipo_usuario_id,
            tipo_documento_id: fullData.tipo_documento_id,
            numero_documento: fullData.numero_documento,
            razon_social: fullData.razon_social,
            region_id: fullData.region_id,
            tema_consulta_id: fullData.tema_consulta_id,
            estado_consulta_id: fullData.estado_consulta_id,
            organo_atencion_id: fullData.organo_atencion_id,
            agente_id: fullData.agente_id,
            satisfaccion_servicio_id: fullData.satisfaccion_servicio_id,
          };

          // Load channel-specific data
          if (fullData.channel === "LLAMADA") {
            this.llamadaData = {
              numero_telefonico: fullData.numero_telefonico || "",
              duracion_llamada: fullData.duracion_llamada || 0,
              acuerdo_marco_id: fullData.acuerdo_marco_id,
              detalle_acuerdo_marco: fullData.detalle_acuerdo_marco || "",
              detalle_consulta: fullData.detalle_consulta || "",
            };
          } else if (fullData.channel === "WHATSAPP") {
            this.whatsappData = {
              numero_celular: fullData.numero_celular || "",
              consulta: fullData.consulta || "",
              respuesta: fullData.respuesta || "",
              valoracion_atencion_id: fullData.valoracion_atencion_id,
            };
          } else if (fullData.channel === "EMAIL") {
            this.emailData = {
              correo: fullData.correo || "",
              asunto: fullData.asunto || "",
              fecha_atencion: fullData.fecha_atencion,
              estado_atencion_encauzado:
                fullData.estado_atencion_encauzado || false,
              fecha_derivacion: fullData.fecha_derivacion,
              dias_atencion_organo: fullData.dias_atencion_organo,
              estado_atencion_organo_id: fullData.estado_atencion_organo_id,
              agente_atendio_id: fullData.agente_atendio_id,
            };
          } else if (fullData.channel === "PRESENCIAL") {
            this.presencialData = {
              hora_ingreso: fullData.hora_ingreso || "",
              hora_salida: fullData.hora_salida || "",
              numero_telefonico: fullData.ip_numero_telefonico || "",
              correo: fullData.ip_correo || "",
              detalle_consulta: fullData.ip_detalle_consulta || "",
            };
          }

          // Mark as loaded from table
          this.isLoadedFromTable = true;

          // Switch to form tab
          this.activeTab = "form";

          notification(
            "Success",
            "Interacci\u00f3n cargada exitosamente",
            "fa fa-check",
            "success",
          );
        }
      } catch (error) {
        console.error("Error loading user to form:", error);
        notification(
          "Error",
          "Error al cargar la interacci\u00f3n: " + error.message,
          "fa fa-times",
          "danger",
        );
      }
    },
    async saveFormData() {
      // Trim all string fields before validation
      if (this.interaction.razon_social) {
        this.interaction.razon_social = this.interaction.razon_social.trim();
      }
      if (this.interaction.numero_documento) {
        this.interaction.numero_documento =
          this.interaction.numero_documento.trim();
      }

      // Validate required common fields
      if (!this.interaction.razon_social) {
        notification(
          "Advertencia",
          "El campo Razón Social es requerido",
          "fa fa-warning",
          "warning",
        );
        return false;
      }

      if (!this.interaction.tipo_usuario_id) {
        notification(
          "Advertencia",
          "El campo Tipo de Usuario es requerido",
          "fa fa-warning",
          "warning",
        );
        return false;
      }

      if (!this.interaction.tema_consulta_id) {
        notification(
          "Advertencia",
          "El campo Tema de Consulta es requerido",
          "fa fa-warning",
          "warning",
        );
        return false;
      }

      if (!this.interaction.estado_consulta_id) {
        notification(
          "Advertencia",
          "El campo Estado de Consulta es requerido",
          "fa fa-warning",
          "warning",
        );
        return false;
      }

      // Trim channel-specific fields
      if (this.interaction.channel === "LLAMADA") {
        if (this.llamadaData.numero_telefonico) {
          this.llamadaData.numero_telefonico =
            this.llamadaData.numero_telefonico.trim();
        }
        if (this.llamadaData.detalle_acuerdo_marco) {
          this.llamadaData.detalle_acuerdo_marco =
            this.llamadaData.detalle_acuerdo_marco.trim();
        }
        if (this.llamadaData.detalle_consulta) {
          this.llamadaData.detalle_consulta =
            this.llamadaData.detalle_consulta.trim();
        }
      } else if (this.interaction.channel === "WHATSAPP") {
        if (this.whatsappData.numero_celular) {
          this.whatsappData.numero_celular =
            this.whatsappData.numero_celular.trim();
        }
        if (this.whatsappData.consulta) {
          this.whatsappData.consulta = this.whatsappData.consulta.trim();
        }
        if (this.whatsappData.respuesta) {
          this.whatsappData.respuesta = this.whatsappData.respuesta.trim();
        }
      } else if (this.interaction.channel === "EMAIL") {
        if (this.emailData.correo) {
          this.emailData.correo = this.emailData.correo.trim();
        }
        if (this.emailData.asunto) {
          this.emailData.asunto = this.emailData.asunto.trim();
        }
      } else if (this.interaction.channel === "PRESENCIAL") {
        if (this.presencialData.numero_telefonico) {
          this.presencialData.numero_telefonico =
            this.presencialData.numero_telefonico.trim();
        }
        if (this.presencialData.correo) {
          this.presencialData.correo = this.presencialData.correo.trim();
        }
        if (this.presencialData.detalle_consulta) {
          this.presencialData.detalle_consulta =
            this.presencialData.detalle_consulta.trim();
        }
      }

      // Validate channel-specific fields
      if (
        this.interaction.channel === "LLAMADA" &&
        !this.llamadaData.numero_telefonico
      ) {
        notification(
          "Advertencia",
          "El número telefónico es requerido para llamadas",
          "fa fa-warning",
          "warning",
        );
        return false;
      }

      if (
        this.interaction.channel === "WHATSAPP" &&
        !this.whatsappData.numero_celular
      ) {
        notification(
          "Advertencia",
          "El número de WhatsApp es requerido",
          "fa fa-warning",
          "warning",
        );
        return false;
      }

      if (this.interaction.channel === "EMAIL" && !this.emailData.correo) {
        notification(
          "Advertencia",
          "El correo electrónico es requerido",
          "fa fa-warning",
          "warning",
        );
        return false;
      }

      if (
        this.interaction.channel === "PRESENCIAL" &&
        !this.presencialData.hora_ingreso
      ) {
        notification(
          "Advertencia",
          "La hora de ingreso es requerida para atención presencial",
          "fa fa-warning",
          "warning",
        );
        return false;
      }

      // WEBCHAT has no additional required fields beyond common interaction data

      this.isSaving = true;

      try {
        // Check if interaction exists
        const checkQuery = `SELECT COUNT(*) as count FROM ccrepo.PERUCOMPRAS_interactions WHERE guid = '${this.interaction.guid}'`;
        const checkResult = await UC_get_async(checkQuery, "Repo");
        const recordCount = JSON.parse(checkResult)[0].count;
        const recordExists = recordCount > 0;

        // Prepare interaction data
        const interactionValues = [
          `'${this.interaction.guid}'`,
          `'${this.interaction.channel}'`,
          `'${this.interaction.fecha_hora_interaccion}'`,
          this.interaction.tipo_usuario_id || "NULL",
          this.interaction.tipo_documento_id || "NULL",
          this.interaction.numero_documento
            ? `'${this.interaction.numero_documento.replace(/'/g, "''")}'`
            : "NULL",
          this.interaction.razon_social
            ? `'${this.interaction.razon_social.replace(/'/g, "''")}'`
            : "NULL",
          this.interaction.region_id || "NULL",
          this.interaction.tema_consulta_id || "NULL",
          this.interaction.estado_consulta_id || "NULL",
          this.interaction.organo_atencion_id || "NULL",
          this.interaction.agente_id || "NULL",
          this.interaction.satisfaccion_servicio_id || "NULL",
        ];

        let query;
        if (recordExists) {
          // Update existing record
          query = `
            UPDATE ccrepo.PERUCOMPRAS_interactions SET
              channel = '${this.interaction.channel}',
              fecha_hora_interaccion = '${
                this.interaction.fecha_hora_interaccion
              }',
              tipo_usuario_id = ${this.interaction.tipo_usuario_id || "NULL"},
              tipo_documento_id = ${
                this.interaction.tipo_documento_id || "NULL"
              },
              numero_documento = ${
                this.interaction.numero_documento
                  ? `'${this.interaction.numero_documento.replace(/'/g, "''")}'`
                  : "NULL"
              },
              razon_social = ${
                this.interaction.razon_social
                  ? `'${this.interaction.razon_social.replace(/'/g, "''")}'`
                  : "NULL"
              },
              region_id = ${this.interaction.region_id || "NULL"},
              tema_consulta_id = ${this.interaction.tema_consulta_id || "NULL"},
              estado_consulta_id = ${
                this.interaction.estado_consulta_id || "NULL"
              },
              organo_atencion_id = ${
                this.interaction.organo_atencion_id || "NULL"
              },
              agente_id = ${this.interaction.agente_id || "NULL"},
              satisfaccion_servicio_id = ${
                this.interaction.satisfaccion_servicio_id || "NULL"
              }
            WHERE guid = '${this.interaction.guid}'
          `;
        } else {
          // Insert new interaction record
          query = `
            INSERT INTO ccrepo.PERUCOMPRAS_interactions 
            (guid, channel, fecha_hora_interaccion, tipo_usuario_id, tipo_documento_id, 
             numero_documento, razon_social, region_id, tema_consulta_id, estado_consulta_id, 
             organo_atencion_id, agente_id, satisfaccion_servicio_id)
            VALUES (${interactionValues.join(", ")})
          `;
        }

        const result = await UC_exec_async(query, "Repo");

        // Check if the query execution was successful
        if (result === "ERROR") {
          notification(
            "Error",
            "Error al guardar la interacción. Verifique que los datos no excedan los límites permitidos.",
            "fa fa-times",
            "danger",
          );
          return false;
        }

        // Save channel-specific data
        const channelResult = await this.saveChannelSpecificData(recordExists);

        if (!channelResult) {
          return false;
        }

        notification(
          "Éxito",
          recordExists
            ? "Datos actualizados correctamente"
            : "Datos guardados correctamente",
          "fa fa-check",
          "success",
        );
        return true;
      } catch (error) {
        console.error("Error saving form data:", error);
        notification(
          "Error",
          "Error al guardar los datos: " + error.message,
          "fa fa-times",
          "danger",
        );
        return false;
      } finally {
        this.isSaving = false;
      }
    },

    async saveChannelSpecificData(isUpdate) {
      const guid = this.interaction.guid;

      // WEBCHAT has no channel-specific table, only uses common interaction fields
      if (this.interaction.channel === "WEBCHAT") {
        return true; // No additional data to save
      }

      if (this.interaction.channel === "LLAMADA") {
        const values = [
          `'${guid}'`,
          `'${this.llamadaData.numero_telefonico}'`,
          this.llamadaData.duracion_llamada || 0,
          this.llamadaData.acuerdo_marco_id || "NULL",
          this.llamadaData.detalle_acuerdo_marco
            ? `'${this.llamadaData.detalle_acuerdo_marco.replace(/'/g, "''")}'`
            : "NULL",
          this.llamadaData.detalle_consulta
            ? `'${this.llamadaData.detalle_consulta.replace(/'/g, "''")}'`
            : "NULL",
        ];

        const query = isUpdate
          ? `
            UPDATE ccrepo.PERUCOMPRAS_interaction_llamada SET
              numero_telefonico = '${this.llamadaData.numero_telefonico}',
              duracion_llamada = ${this.llamadaData.duracion_llamada || 0},
              acuerdo_marco_id = ${this.llamadaData.acuerdo_marco_id || "NULL"},
              detalle_acuerdo_marco = ${
                this.llamadaData.detalle_acuerdo_marco
                  ? `'${this.llamadaData.detalle_acuerdo_marco.replace(
                      /'/g,
                      "''",
                    )}'`
                  : "NULL"
              },
              detalle_consulta = ${
                this.llamadaData.detalle_consulta
                  ? `'${this.llamadaData.detalle_consulta.replace(/'/g, "''")}'`
                  : "NULL"
              }
            WHERE guid = '${guid}'
          `
          : `
            INSERT INTO ccrepo.PERUCOMPRAS_interaction_llamada 
            (guid, numero_telefonico, duracion_llamada, acuerdo_marco_id, detalle_acuerdo_marco, detalle_consulta)
            VALUES (${values.join(", ")})
          `;

        const result = await UC_exec_async(query, "Repo");

        if (result === "ERROR") {
          notification(
            "Error",
            "Error al guardar los datos de llamada. Verifique que los datos no excedan los límites permitidos.",
            "fa fa-times",
            "danger",
          );
          return false;
        }
      } else if (this.interaction.channel === "WHATSAPP") {
        const values = [
          `'${guid}'`,
          `'${this.whatsappData.numero_celular}'`,
          this.whatsappData.consulta
            ? `'${this.whatsappData.consulta.replace(/'/g, "''")}'`
            : "NULL",
          this.whatsappData.respuesta
            ? `'${this.whatsappData.respuesta.replace(/'/g, "''")}'`
            : "NULL",
          this.whatsappData.valoracion_atencion_id || "NULL",
        ];

        const query = isUpdate
          ? `
            UPDATE ccrepo.PERUCOMPRAS_interaction_whatsapp SET
              numero_celular = '${this.whatsappData.numero_celular}',
              consulta = ${
                this.whatsappData.consulta
                  ? `'${this.whatsappData.consulta.replace(/'/g, "''")}'`
                  : "NULL"
              },
              respuesta = ${
                this.whatsappData.respuesta
                  ? `'${this.whatsappData.respuesta.replace(/'/g, "''")}'`
                  : "NULL"
              },
              valoracion_atencion_id = ${
                this.whatsappData.valoracion_atencion_id || "NULL"
              }
            WHERE guid = '${guid}'
          `
          : `
            INSERT INTO ccrepo.PERUCOMPRAS_interaction_whatsapp 
            (guid, numero_celular, consulta, respuesta, valoracion_atencion_id)
            VALUES (${values.join(", ")})
          `;

        const result = await UC_exec_async(query, "Repo");

        if (result === "ERROR") {
          notification(
            "Error",
            "Error al guardar los datos de WhatsApp. Verifique que los datos no excedan los límites permitidos.",
            "fa fa-times",
            "danger",
          );
          return false;
        }
      } else if (this.interaction.channel === "EMAIL") {
        const values = [
          `'${guid}'`,
          `'${this.emailData.correo}'`,
          this.emailData.asunto
            ? `'${this.emailData.asunto.replace(/'/g, "''")}'`
            : "NULL",
          this.emailData.fecha_atencion
            ? `'${this.emailData.fecha_atencion}'`
            : "NULL",
          this.interaction.estado_consulta_id || "NULL",
          this.emailData.estado_atencion_encauzado ? 1 : 0,
          this.emailData.fecha_derivacion
            ? `'${this.emailData.fecha_derivacion}'`
            : "NULL",
          this.emailData.dias_atencion_organo || "NULL",
          this.emailData.estado_atencion_organo_id || "NULL",
          this.emailData.agente_atendio_id || "NULL",
        ];

        const query = isUpdate
          ? `
            UPDATE ccrepo.PERUCOMPRAS_interaction_email SET
              correo = '${this.emailData.correo}',
              asunto = ${
                this.emailData.asunto
                  ? `'${this.emailData.asunto.replace(/'/g, "''")}'`
                  : "NULL"
              },
              fecha_atencion = ${
                this.emailData.fecha_atencion
                  ? `'${this.emailData.fecha_atencion}'`
                  : "NULL"
              },
              estado_atencion_id = ${
                this.interaction.estado_consulta_id || "NULL"
              },
              estado_atencion_encauzado = ${
                this.emailData.estado_atencion_encauzado ? 1 : 0
              },
              fecha_derivacion = ${
                this.emailData.fecha_derivacion
                  ? `'${this.emailData.fecha_derivacion}'`
                  : "NULL"
              },
              dias_atencion_organo = ${
                this.emailData.dias_atencion_organo || "NULL"
              },
              estado_atencion_organo_id = ${
                this.emailData.estado_atencion_organo_id || "NULL"
              },
              agente_atendio_id = ${this.emailData.agente_atendio_id || "NULL"}
            WHERE guid = '${guid}'
          `
          : `
            INSERT INTO ccrepo.PERUCOMPRAS_interaction_email 
            (guid, correo, asunto, fecha_atencion, estado_atencion_id, estado_atencion_encauzado,
             fecha_derivacion, dias_atencion_organo, estado_atencion_organo_id, agente_atendio_id)
            VALUES (${values.join(", ")})
          `;

        const result = await UC_exec_async(query, "Repo");

        if (result === "ERROR") {
          notification(
            "Error",
            "Error al guardar los datos de email. Verifique que los datos no excedan los límites permitidos.",
            "fa fa-times",
            "danger",
          );
          return false;
        }
      } else if (this.interaction.channel === "PRESENCIAL") {
        const values = [
          `'${guid}'`,
          this.presencialData.hora_ingreso
            ? `'${this.presencialData.hora_ingreso}'`
            : "NULL",
          this.presencialData.hora_salida
            ? `'${this.presencialData.hora_salida}'`
            : "NULL",
          this.presencialData.numero_telefonico
            ? `'${this.presencialData.numero_telefonico}'`
            : "NULL",
          this.presencialData.correo
            ? `'${this.presencialData.correo}'`
            : "NULL",
          this.presencialData.detalle_consulta
            ? `'${this.presencialData.detalle_consulta.replace(/'/g, "''")}'`
            : "NULL",
        ];

        const query = isUpdate
          ? `
            UPDATE ccrepo.PERUCOMPRAS_interaction_presencial SET
              hora_ingreso = ${
                this.presencialData.hora_ingreso
                  ? `'${this.presencialData.hora_ingreso}'`
                  : "NULL"
              },
              hora_salida = ${
                this.presencialData.hora_salida
                  ? `'${this.presencialData.hora_salida}'`
                  : "NULL"
              },
              numero_telefonico = ${
                this.presencialData.numero_telefonico
                  ? `'${this.presencialData.numero_telefonico}'`
                  : "NULL"
              },
              correo = ${
                this.presencialData.correo
                  ? `'${this.presencialData.correo}'`
                  : "NULL"
              },
              detalle_consulta = ${
                this.presencialData.detalle_consulta
                  ? `'${this.presencialData.detalle_consulta.replace(
                      /'/g,
                      "''",
                    )}'`
                  : "NULL"
              }
            WHERE guid = '${guid}'
          `
          : `
            INSERT INTO ccrepo.PERUCOMPRAS_interaction_presencial 
            (guid, hora_ingreso, hora_salida, numero_telefonico, correo, detalle_consulta)
            VALUES (${values.join(", ")})
          `;

        const result = await UC_exec_async(query, "Repo");

        if (result === "ERROR") {
          notification(
            "Error",
            "Error al guardar los datos presenciales. Verifique que los datos no excedan los límites permitidos.",
            "fa fa-times",
            "danger",
          );
          return false;
        }
      }

      return true;
    },

    async saveAndFinish() {
      // First, save the form data
      const saveSuccess = await this.saveFormData();

      // Only proceed if save was successful
      if (!saveSuccess) {
        return;
      }

      // Then close form if CTI (skip if loaded from table)
      if (!this.isLoadedFromTable && this.hasCTI) {
        try {
          UC_closeForm();
        } catch (error) {
          console.error("Error closing form:", error);
        }
      }

      // Reset form only after successful save
      this.resetForm();
      // Reset the flag
      this.isLoadedFromTable = false;
    },
  },
})
  .use(vuetify)
  .mount("#app");
