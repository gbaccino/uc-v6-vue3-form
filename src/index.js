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
        eleven_number: (value) => {
          const elevenDigitRegex = /^\d{11}$/;
          return (
            elevenDigitRegex.test(value) || "Debe ser un número de 11 dígitos"
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
      isProcessing: false,
      agent: "", // Store agent account code
      isSaving: false, // Track if save operation is in progress
      activeTab: "form", // Control which tab is active
      isLoadedFromTable: false, // Track if user was loaded from search table
      userSearch: {
        phone: "",
        document: "",
        name: "",
      },
      userSearchResults: [],
      isSearching: false,
      userTableHeaders: [
        { title: "Fecha", key: "fecha_atencion", align: "start" },
        { title: "Documento", key: "documento", align: "start" },
        { title: "Nombre", key: "nombre_usuario", align: "start" },
        { title: "Teléfono", key: "telefono", align: "start" },
        { title: "Región", key: "region", align: "start" },
        { title: "Acciones", key: "actions", sortable: false, align: "center" },
      ],
      formData: {
        date: "",
        startTime: "",
        finishTime: "",
        document: "",
        name: "",
        phone: "",
        email: "",
        region: "",
        userType: "",
        consultTopic: "",
        area: "",
        personal: "",
        rating: "",
      },
    };
  },
  mounted() {
    this.initializeForm();
  },
  methods: {
    async initializeForm() {
      // Set current date and time
      const now = new Date();
      this.formData.date = now.toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      this.formData.startTime = now.toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });

      this.setAgent();
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

    resetForm() {
      // Clear all form data fields
      this.formData = {
        date: "",
        startTime: "",
        finishTime: "",
        document: "",
        name: "",
        phone: "",
        email: "",
        region: "",
        userType: "",
        consultTopic: "",
        area: "",
        personal: "",
        rating: "",
      };
    },

    async searchUsers() {
      // Build WHERE clause based on filled search fields
      const conditions = [];

      if (this.userSearch.phone && this.userSearch.phone.trim() !== "") {
        conditions.push(`telefono LIKE '%${this.userSearch.phone.trim()}%'`);
      }

      if (this.userSearch.document && this.userSearch.document.trim() !== "") {
        conditions.push(
          `documento LIKE '%${this.userSearch.document.trim()}%'`
        );
      }

      if (this.userSearch.name && this.userSearch.name.trim() !== "") {
        conditions.push(
          `nombre_usuario LIKE '%${this.userSearch.name.trim()}%'`
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
        const query = `SELECT * FROM ccrepo.PERUCOMPRAS_Atenciones_Presenciales WHERE ${whereClause} LIMIT 100`;

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
      this.formData.phone = user.telefono || "";
      this.formData.email = user.correo || "";
      this.formData.document = user.documento || "";
      this.formData.name = user.nombre_usuario || "";
      this.formData.userType = user.tipo_usuario || "";
      this.formData.region = user.region || "";
      this.formData.consultTopic = user.tema_consultado || "";
      this.formData.area = user.area || "";
      this.formData.personal = user.personal || "";
      this.formData.rating = user.valoracion || "";
      this.formData.date = user.fecha_atencion || "";
      this.formData.startTime = user.hora_ingreso || "";
      this.formData.finishTime = user.hora_salida || "";

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
    async saveAndFinish() {
      // Validate form data first
      if (!this.formData.phone && !this.formData.email) {
        notification(
          "Advertencia",
          "El campo Teléfono o Email es requerido",
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

      if (!this.formData.name) {
        notification(
          "Advertencia",
          "El campo Nombre del usuario es requerido",
          "fa fa-warning",
          "warning"
        );
        return;
      }

      this.isProcessing = true;

      try {
        // Set finish time
        const now = new Date();
        this.formData.finishTime = now.toLocaleTimeString("es-PE", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        });

        // Convert date from DD/MM/YYYY to YYYY-MM-DD and combine with time
        const dateParts = this.formData.date.split("/");
        const mysqlDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
        const dateTime = `${mysqlDate} ${this.formData.startTime}`;

        // Save form data
        const data = {
          fecha_atencion: dateTime || null,
          hora_ingreso: this.formData.startTime || null,
          hora_salida: this.formData.finishTime || null,
          documento: this.formData.document,
          nombre_usuario: this.formData.name,
          telefono: this.formData.phone || null,
          correo: this.formData.email || null,
          region: this.formData.region || null,
          tipo_usuario: this.formData.userType || null,
          tema_consultado: this.formData.consultTopic || null,
          area: this.formData.area || null,
          personal: this.agent || null,
          valoracion: this.formData.rating || null,
        };

        // Check if record exists (by document)
        const checkQuery = `SELECT COUNT(*) as count FROM ccrepo.PERUCOMPRAS_Atenciones_Presenciales WHERE documento = '${this.formData.document}'`;
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
          query = `UPDATE ccrepo.PERUCOMPRAS_Atenciones_Presenciales SET ${updateFields.join(
            ", "
          )} WHERE documento = '${this.formData.document}'`;
        } else {
          // Insert new record
          const columns = Object.keys(data).join(", ");
          const values = Object.values(data)
            .map((v) =>
              v !== null ? `'${String(v).replace(/'/g, "''")}' ` : "NULL"
            )
            .join(", ");
          query = `INSERT INTO ccrepo.PERUCOMPRAS_Atenciones_Presenciales (${columns}) VALUES (${values})`;
        }

        const result = await UC_exec_async(query, "Repo");
        
        // Check if the operation was successful
        if (result !== "OK") {
          throw new Error(`Error en la base de datos: ${result}`);
        }

        // Reset form for next entry
        this.resetForm();

        // Reset the flag
        this.isLoadedFromTable = false;

        // Re-initialize date and time for next entry
        const newNow = new Date();
        this.formData.date = newNow.toLocaleDateString("es-PE", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
        this.formData.startTime = newNow.toLocaleTimeString("es-PE", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        });

        notification(
          "Éxito",
          "Datos guardados exitosamente!",
          "fa fa-check",
          "success"
        );

        // Close the form
        if (typeof UC_closeForm !== "undefined") {
          UC_closeForm();
        }
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
