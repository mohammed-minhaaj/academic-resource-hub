/**
 * Bootstrap 5 Client-Side Form Validation Logic
 * Disables form submissions if there are invalid or empty fields
 * and triggers Bootstrap validation feedback styles.
 */
(() => {
    "use strict";

    // Fetch all forms with the .needs-validation class
    const forms = document.querySelectorAll(".needs-validation");

    // Loop over forms and attach submit event listeners
    Array.from(forms).forEach((form) => {
        form.addEventListener(
            "submit",
            (event) => {
                if (!form.checkValidity()) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                form.classList.add("was-validated");
            },
            false
        );
    });
})();
