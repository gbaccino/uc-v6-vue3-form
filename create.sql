/* =========================
   CATALOG TABLES
========================= */

CREATE TABLE ccrepo.PERUCOMPRAS_tipo_usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE ccrepo.PERUCOMPRAS_tipo_documento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE ccrepo.PERUCOMPRAS_region (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE ccrepo.PERUCOMPRAS_tema_consulta (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL UNIQUE
);

CREATE TABLE ccrepo.PERUCOMPRAS_estado_consulta (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE ccrepo.PERUCOMPRAS_estado_atencion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE ccrepo.PERUCOMPRAS_organo_atencion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL UNIQUE
);

CREATE TABLE ccrepo.PERUCOMPRAS_satisfaccion_servicio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE ccrepo.PERUCOMPRAS_valoracion_atencion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE ccrepo.PERUCOMPRAS_acuerdo_marco (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL UNIQUE
);

/* =========================
   INTERACTIONS
========================= */

CREATE TABLE ccrepo.PERUCOMPRAS_interactions (
    guid VARCHAR(64) PRIMARY KEY,

    channel ENUM('LLAMADA','WHATSAPP','EMAIL') NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_hora_interaccion DATETIME NOT NULL,

    tipo_usuario_id INT NOT NULL,
    tipo_documento_id INT NULL,
    numero_documento VARCHAR(30) NULL,
    razon_social VARCHAR(100) NULL,
    region_id INT NULL,

    tema_consulta_id INT NOT NULL,
    estado_consulta_id INT NOT NULL,
    organo_atencion_id INT NOT NULL,

    agente_id INT NOT NULL,
    satisfaccion_servicio_id INT NOT NULL,

    FOREIGN KEY (tipo_usuario_id) REFERENCES ccrepo.PERUCOMPRAS_tipo_usuario(id),
    FOREIGN KEY (tipo_documento_id) REFERENCES ccrepo.PERUCOMPRAS_tipo_documento(id),
    FOREIGN KEY (region_id) REFERENCES ccrepo.PERUCOMPRAS_region(id),
    FOREIGN KEY (tema_consulta_id) REFERENCES ccrepo.PERUCOMPRAS_tema_consulta(id),
    FOREIGN KEY (estado_consulta_id) REFERENCES ccrepo.PERUCOMPRAS_estado_consulta(id),
    FOREIGN KEY (organo_atencion_id) REFERENCES ccrepo.PERUCOMPRAS_organo_atencion(id),
    FOREIGN KEY (agente_id) REFERENCES ccdata.sip(id),
    FOREIGN KEY (satisfaccion_servicio_id) REFERENCES ccrepo.PERUCOMPRAS_satisfaccion_servicio(id)
);

/* =========================
   LLAMADAS
========================= */

CREATE TABLE ccrepo.PERUCOMPRAS_interaction_llamada (
    guid VARCHAR(64) PRIMARY KEY,

    numero_telefonico VARCHAR(20) NOT NULL,
    duracion_llamada INT NOT NULL,

    acuerdo_marco_id INT NULL,
    detalle_acuerdo_marco TEXT NULL,
    detalle_consulta TEXT NULL,

    FOREIGN KEY (guid) REFERENCES ccrepo.PERUCOMPRAS_interactions(guid),
    FOREIGN KEY (acuerdo_marco_id) REFERENCES ccrepo.PERUCOMPRAS_acuerdo_marco(id)
);

/* =========================
   WHATSAPP
========================= */

CREATE TABLE ccrepo.PERUCOMPRAS_interaction_whatsapp (
    guid VARCHAR(64) PRIMARY KEY,

    numero_celular VARCHAR(20) NOT NULL,
    consulta TEXT NOT NULL,
    respuesta TEXT NOT NULL,
    valoracion_atencion_id INT NULL,

    FOREIGN KEY (guid) REFERENCES ccrepo.PERUCOMPRAS_interactions(guid),
    FOREIGN KEY (valoracion_atencion_id) REFERENCES ccrepo.PERUCOMPRAS_valoracion_atencion(id)
);

/* =========================
   EMAIL
========================= */

CREATE TABLE ccrepo.PERUCOMPRAS_interaction_email (
    guid VARCHAR(64) PRIMARY KEY,

    correo VARCHAR(150) NOT NULL,
    asunto VARCHAR(200) NOT NULL,
    fecha_atencion DATETIME NULL,

    estado_atencion_id INT NOT NULL,
    estado_atencion_encauzado BOOLEAN NOT NULL DEFAULT 0,

    fecha_derivacion DATETIME NULL,
    dias_atencion_organo INT NULL,
    estado_atencion_organo_id INT NULL,

    agente_atendio_id INT NOT NULL,

    FOREIGN KEY (guid) REFERENCES ccrepo.PERUCOMPRAS_interactions(guid),
    FOREIGN KEY (estado_atencion_id) REFERENCES ccrepo.PERUCOMPRAS_estado_atencion(id),
    FOREIGN KEY (estado_atencion_organo_id) REFERENCES ccrepo.PERUCOMPRAS_estado_atencion(id),
    FOREIGN KEY (agente_atendio_id) REFERENCES ccdata.sip(id)
);

/* =========================
    PRESENCIAL
========================= */

CREATE TABLE ccrepo.PERUCOMPRAS_interaction_presencial (
    guid VARCHAR(64) PRIMARY KEY,

    hora_ingreso TIME NOT NULL,
    hora_salida TIME NULL,

    numero_telefonico VARCHAR(20) NULL,
    correo VARCHAR(150) NULL,

    detalle_consulta TEXT NULL,

    CONSTRAINT fk_presencial_interaction
        FOREIGN KEY (guid)
        REFERENCES ccrepo.PERUCOMPRAS_interactions (guid)
        ON DELETE CASCADE
);


CREATE INDEX idx_int_tipo_doc_num ON ccrepo.PERUCOMPRAS_interactions (tipo_documento_id, numero_documento);
CREATE INDEX idx_interactions_channel_fecha ON ccrepo.PERUCOMPRAS_interactions (channel, fecha_hora_interaccion);
CREATE INDEX idx_interactions_agente ON ccrepo.PERUCOMPRAS_interactions (agente_id);
CREATE INDEX idx_llamada_numero ON ccrepo.PERUCOMPRAS_interaction_llamada (numero_telefonico);
CREATE INDEX idx_email_correo ON ccrepo.PERUCOMPRAS_interaction_email (correo);
CREATE INDEX idx_presencial_telefono ON ccrepo.PERUCOMPRAS_interaction_presencial (numero_telefonico);
CREATE INDEX idx_presencial_correo ON ccrepo.PERUCOMPRAS_interaction_presencial (correo);