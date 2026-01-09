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
        "Acceso al Sistema",

        "Acceso a la Informacion Publica",
        "Acreditacion de Marca",
        "Actuaciones Preparatorias",
        "Actualizacion de datos",
        "Actualizacion de Recaudo",
        "Ampliacion de Plazo de Entrega",
        "Ampliacion de Publicacion de OCAM",
        "Anexo 2 Proforma",
        "Anexo 3 Orden de Compra",
        "Bandeja de notificaciones",
        "Boletos Aereos",
        "Busqueda de fichas producto",
        "Canales de Atencion",
        "Capacitacion",
        "Carta de Originalidad",
        "Carta de Presentacion",
        "Catalogo Electronico",
        "Certificacion Presupuestal",
        "Cesion de Derechos",
        "Clasificadores",
        "Codigo CIIU",
        "Competencias de Peru Compras",
        "Compra Agregada",
        "Compra asistida",
        "Compra Individual",
        "Compra Ordinaria",
        "Compra por Paquete",
        "Compra por Encargo",
        "Compras Corporativas",
        "Comunicados",
        "Constancia",
        "Consultas generales / Solicitud de Informacion",
        "Convocatoria de Personal CAS",
        "Convocatorias",
        "Compras financiadas por el BID",
        "Correspondencia / Notificaciones",
        "Cotizaciones",
        "Creacion de Valores",
        "Datos de Representante de Marca",
        "Denuncia",
        "Deposito de Garantia de Fiel Cumplimiento",
        "Devolucion de Garantia de Fiel Cumplimiento",
        "Difusion DCEME",
        "Directivas",
        "Directorio Institucional",
        "Ejecucion Contractual",
        "Entrega de Bienes",
        "Estado de Orden de Compra",
        "Estimador de precios",
        "Evaluacion y Subsanacion de Fichas Producto",
        "Exceptuacion de Compra por Catalogo Electronico",
        "Exclusion e Inclusion de Proveedores",
        "Expediente de Contratacion",
        "Fichas Producto",
        "Gran Compra",
        "Homologacion",
        "ID Certificacion",
        "Incidencia",
        "Incorporacion de nuevos productos",
        "Incumplimiento de Pago",
        "Inscripcion Proveedor",
        "Ley y Reglamento de Contrataciones Publicas",
        "Liberacion de Certificado Presupuestal",
        "Listado de Bienes y Servicios comunes",
        "Manual de Operatividad",
        "Mejora de Ofertas",
        "Mesa de Partes",
        "Modificacion de reserva del CCP",
        "Monto minimo de atencion",
        "Montos minimos de Contratacion",
        "Multiusuarios",
        "Notificacion de Transparencia",
        "Obligatoriedad de Contratar por Catalogo Electronico",
        "Ofertas no Adjudicadas",
        "Operatividad del Catalogo Electronico",
        "Orden de Compra",
        "Pladicop",
        "Plazos de Entrega",
        "Presentacion de Ofertas",
        "Prevision presupuestal",
        "Productos falsificados",
        "Proforma",
        "Reclamo",
        "Recurso Impugnatorio",
        "Rechazo de OCAM",
        "Registro de nuevos Proveedores",
        "Reglas de Operatividad",
        "Requerimiento",
        "Resolucion de Orden de Compra",
        "Resultado de Proveedores",
        "Sancion TCP",
        "Seguimiento de Tramite / Correo",
        "Semaforo",
        "Solicitud de Capacitacion",
        "Solicitud de reunion",
        "Subasta Inversa Electronica",
        "Tipo de Cambio",
        "Tipo de Contratacion",
        "Tipo de Entrega",
        "Transparencia",
        "Uso de imagen Institucional",
        "Vigencia del Acuerdo Marco",
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
        "Otro",
      ],
      consultStatus: ["Atendido", "Pendiente", "Encauzado"],
      causeDetails: [
        "Reclamo",
        "Incidente",
        "Denuncia",
        "Acceso a la información",
        "Consulta técnica",
        "Otro",
      ],
      acuerdosMarco: [
        "EXT-CE-2024-1 Baterías, pilas y accesorios",
        "EXT-CE-2024-2 Equipos multimedia y accesorios",
        "EXT-CE-2024-3 Materiales e insumos de limpieza y papeles para aseo y limpieza",
        "EXT-CE-2022-5 Computadoras de escritorio, portátiles y escánere",
        "EXT-CE-2021-6 Impresoras; consumibles; repuestos y accesorios de oficina",
        "EXT-CE-2021-7 Útiles de escritorio, papeles y cartones",
        "EXT-CE-2024-10 Llantas, neumáticos y accesorios",
        "EXT-CE-2024-12 Pinturas, cerámicos, pisos, tuberías, sanitarios, accesorios y complementos",
        "EXT-CE-2024-13 Equipos de aire acondicionado, similares y accesorios",
        "EXT-CE-2024-14 Luminarias, materiales y cables eléctricos",
        "IM-CE-2020-15 Servicio de emisión de boletos aéreos",
        "EXT-CE-2024-16 Accesorios domésticos y bienes para usos diversos",
        "EXT-CE-2024-17 Bebidas no alcohólicas",
        "EXT-CE-2024-18 Cereales, aceite, azúcares y menestras",
        "EXT-CE-2024-26 Máquinas y equipos, y herramientas para jardinería, silvicultura y agricultura",
        "EXT-CE-2024-28 Calzado y botas",
        "No aplica",
      ],
      documentTypes: ["RUC", "DNI", "C.E.", "Otros"],
      encauzadoEmails: [
        "acuerdosmarco@perucompras.gob.pe",
        "administrador.acuerdos@perucompras.gob.pe",
        "estandarizacion@perucompras.gob.pe",
        "comprascorporativas@perucompras.gob.pe",
        "comunicaciones@perucompras.gob.pe",
        "transparencia@perucompras.gob.pe",
        "mesadepartes@perucompras.gob.pe",
        "reclamaciones@perucompras.gob.pe",
        "correspondencia@perucompras.gob.pe",
        "consultasconvocatorias@perucompras.gob.pe",
      ],
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
        documentNumber: "",
        razonSocial: "",
        userType: "",
        region: "",
        contractType: "",
        consultDisposition: "",
        consultDetails: "",
        acuerdoMarco: "",
        otros: "",
        atentionOrgan: "",
        consultStatus: "",
        encauzadoEmail: "",
        causeDetail: "",
        encauzadoDate: new Date().toISOString().split("T")[0],
        encauzadoDays: "",
      },
    };
  },
  mounted() {
    this.initializeForm();
  },
  computed: {},
  methods: {
    getTodayDate() {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      return `${day}/${month}/${year}`;
    },
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
      this.notes = "";

      // Clear all form data fields
      this.formData = {
        phoneOrEmail: "",
        document: "",
        documentNumber: "",
        razonSocial: "",
        userType: "",
        region: "",
        contractType: "",
        consultDisposition: "",
        consultDetails: "",
        acuerdoMarco: "",
        otros: "",
        atentionOrgan: "",
        consultStatus: "",
        encauzadoEmail: "",
        causeDetail: "",
        encauzadoDate: new Date().toISOString().split("T")[0],
        encauzadoDays: "",
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
          `numero_documento LIKE '%${this.userSearch.document.trim()}%'`
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
      this.formData.document = user.tipo_documento || "";
      this.formData.documentNumber = user.numero_documento || "";
      this.formData.razonSocial = user.razon_social || "";
      this.formData.userType = user.tipo_usuario || "";
      this.formData.region = user.region || "";
      this.formData.contractType = user.modalidad || "";
      this.formData.consultDisposition = user.tipificacion || "";
      this.formData.consultDetails = user.detalle || "";
      this.formData.atentionOrgan = user.organo || "";
      this.formData.consultStatus = user.estado || "";
      this.formData.encauzadoEmail = user.email_encauzado || "";
      this.formData.causeDetail = user.detalle_encauzado || "";
      this.formData.encauzadoDate = user.fecha_encauzado || "";
      this.formData.encauzadoDays = user.dias_atencion || "";
      this.formData.acuerdoMarco = user.acuerdo || "";
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

      if (!this.formData.documentNumber) {
        notification(
          "Advertencia",
          "El campo Número de documento es requerido",
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
          tipo_documento: this.formData.document,
          numero_documento: this.formData.documentNumber,
          razon_social: this.formData.razonSocial,
          tipo_usuario: this.formData.userType || null,
          region: this.formData.region || null,
          modalidad: this.formData.contractType || null,
          tipificacion: this.formData.consultDisposition || null,
          detalle: this.formData.consultDetails || null,
          acuerdo: this.formData.acuerdoMarco || null,
          otros: this.formData.otros || null,
          organo: this.formData.atentionOrgan || null,
          estado: this.formData.consultStatus || null,
          email_encauzado: this.formData.encauzadoEmail || null,
          detalle_encauzado: this.formData.causeDetail || null,
          fecha_encauzado: this.formData.encauzadoDate || null,
          dias_atencion: this.formData.encauzadoDays || null,
          atendido: this.agent || null,
          observaciones: this.notes || null,
        };

        // Check if record exists (by document number)
        const checkQuery = `SELECT COUNT(*) as count FROM ccrepo.PERUCOMPRAS_Atenciones_Llamadas WHERE numero_documento = '${this.formData.documentNumber}'`;
        const checkResult = await UC_get_async(checkQuery, "Repo");
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
          )} WHERE numero_documento = '${this.formData.documentNumber}'`;
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

      if (!this.formData.documentNumber) {
        notification(
          "Advertencia",
          "El campo Número de documento es requerido",
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
          tipo_documento: this.formData.document,
          numero_documento: this.formData.documentNumber,
          razon_social: this.formData.razonSocial,
          tipo_usuario: this.formData.userType || null,
          region: this.formData.region || null,
          modalidad: this.formData.contractType || null,
          tipificacion: this.formData.consultDisposition || null,
          detalle: this.formData.consultDetails || null,
          acuerdo: this.formData.acuerdoMarco || null,
          otros: this.formData.otros || null,
          organo: this.formData.atentionOrgan || null,
          estado: this.formData.consultStatus || null,
          email_encauzado: this.formData.encauzadoEmail || null,
          detalle_encauzado: this.formData.causeDetail || null,
          fecha_encauzado: this.formData.encauzadoDate || null,
          dias_atencion: this.formData.encauzadoDays || null,
          atendido: this.agent || null,
          observaciones: this.notes || null,
        };

        // Check if record exists (by document number)
        const checkQuery = `SELECT COUNT(*) as count FROM ccrepo.PERUCOMPRAS_Atenciones_Llamadas WHERE numero_documento = '${this.formData.documentNumber}'`;
        const checkResult = await UC_get_async(checkQuery, "Repo");
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
          )} WHERE numero_documento = '${this.formData.documentNumber}'`;
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
