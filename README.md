# Form template for uContact v6 (with Vue3)

This template provides a structured approach to integrate Vue3 forms into uContact v6 applications.

## Project Structure

```
uc-v6-vue3-form/
├── resources/          # Source files (place your original files here)
├── assets/            # Deployed assets (files copied from resources)
├── README.md          # This documentation
└── form-code.html     # Form implementation code (to be created)
```

## Steps

### 1. Prepare Resources

- Place the `assets/vue` folder into `/etc/IntegraServer/web/uContact/assets`
- Place the files in `assets/fonts` into `/etc/IntegraServer/web/uContact/assets/fonts`
- This includes:
  - Vue3 library files
  - Custom form components
  - Stylesheets
  - Any additional dependencies

### 2. Add HTML Script References

After copying the resources, add the necessary HTML `<script>` and `<link>` tags to reference the files in the `assets/` folder.

Example script references to add to your HTML:

```html
<!-- Material Design Icons CSS -->
<link
  rel="stylesheet"
  href="../../uContact/assets/vue/materialdesignicons.min.css"
/>

<!-- Vuetify CSS -->
<link rel="stylesheet" href="../../uContact/assets/vue/vuetify.min.css" />

<!-- Vue3 Core Library -->
<script src="../../uContact/assets/vue/vue.global.prod.js"></script>

<!-- Vuetify JavaScript -->
<script src="../../uContact/assets/vue/vuetify.min.js"></script>
```

### 3. Integrate Form Code

The form code is implemented in `src/index.js` with the following features:

#### Client Data Structure

The application uses a standardized clientData structure with the following attributes:

- `Name` - Client's full name
- `Address` - Client's address
- `Phone` - Phone number (used for calling)
- `Email` - Client's email address
- `Guid` - Unique identifier for the call session

#### Key Features

- **CTI Integration**: Automatically populates client data from CTI when available
- **Campaign Management**: Supports both CTI-driven and manual campaign selection
- **Disposition Handling**: Three-level disposition system with dynamic loading
- **Call Management**: Integrated calling functionality with number selection
- **Form State Management**: Proper form reset and state handling

#### Integration Steps

1. Include the Vue3 and Vuetify dependencies (see Step 2)
2. Copy `src/index.js` to your form implementation
3. Ensure your HTML has a `<div id="app"></div>` element where the Vue app will mount
4. The form will automatically initialize and handle CTI data if available
