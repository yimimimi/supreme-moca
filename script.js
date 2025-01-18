document.addEventListener("DOMContentLoaded", () => {
    const proteccionesTable = document.getElementById("calculoProtecciones").querySelector("tbody");
    const fasorialTable = document.getElementById("calculoFasorial").querySelector("tbody");
    const sumaResultadosTable = document.getElementById("sumaResultados").querySelector("tbody");

    // Configurar event listeners para los botones
    document.getElementById("addRowProtecciones").addEventListener("click", () => addRow(proteccionesTable, true));
    document.getElementById("addRowFasorial").addEventListener("click", () => addRow(fasorialTable, false));

    function addRow(table, isProtecciones) {
        const firstRow = table.querySelector("tr");
        const newRow = firstRow.cloneNode(true);
        
        // Limpiar valores readonly
        newRow.querySelectorAll("input[readonly]").forEach(input => {
            input.value = "0";
        });

        if (isProtecciones) {
            // Actualizar número de motor
            const motorInput = newRow.querySelector(".motor-input");
            const lastMotorNum = parseInt(table.lastElementChild.querySelector(".motor-input").value.replace("M", "")) || 0;
            motorInput.value = `M${lastMotorNum + 1}`;
            // Copiar valores de la primera fila excepto motor
            const inputs = newRow.querySelectorAll('input:not(.motor-input):not([readonly]), select');
            const firstInputs = firstRow.querySelectorAll('input:not(.motor-input):not([readonly]), select');
            inputs.forEach((input, index) => {
                input.value = firstInputs[index].value;
            });
        }
        
        table.appendChild(newRow);
        
        if (isProtecciones) {
            calculateProtecciones();
        }
        updateFasorialTable();
    }

    function calculateProtecciones() {
        const rows = proteccionesTable.querySelectorAll("tr");
        rows.forEach(row => {
            const potencia = parseFloat(row.querySelector(".potencia").value) || 0;
            const fd = parseFloat(row.querySelector(".fd").value) || 1;
            const voltaje = parseFloat(row.querySelector(".voltaje").value) || 1;
            const fp = parseFloat(row.querySelector(".fp").value) || 1;
            const ren = parseFloat(row.querySelector(".ren").value) || 1;
            const fc = parseFloat(row.querySelector(".fc").value) || 1;

            // Cálculo de IN
            const inValue = (potencia * fd) / (voltaje * fp * ren); // Corrección de FP
            row.querySelector(".in").value = inValue.toFixed(2);
            const ipValue = inValue * fc;
            row.querySelector(".ip").value = ipValue.toFixed(2);
        });
    }

    function updateFasorialTable() {
        const proteccionesIPs = Array.from(proteccionesTable.querySelectorAll(".in")).map(input => parseFloat(input.value) || 0);
        const fasorialRows = fasorialTable.querySelectorAll("tr");
        
        // Asegurarse de que haya suficientes filas en la tabla fasorial
        while (fasorialRows.length < proteccionesIPs.length) {
            addRow(fasorialTable, false);
        }
        while (fasorialRows.length > proteccionesIPs.length) {
            removeLastRow(fasorialTable);
        }

        let sumaReal = 0;
        let sumaImag = 0;

        // Actualizar cada fila de la tabla fasorial
        fasorialRows.forEach((row, index) => {
            const inPolar = proteccionesIPs[index];
            const fp = parseFloat(proteccionesTable.querySelectorAll(".fp")[index].value) || 0;
            const angulo = Math.acos(fp) * (180 / Math.PI);

            row.querySelector(".in-polar").value = inPolar.toFixed(2);
            row.querySelector(".angulo").value = angulo.toFixed(2);

            // Calcular valores rectangulares usando las fórmulas proporcionadas
            const real = inPolar * Math.cos((angulo * Math.PI) / 180);
            const imag = -Math.abs(inPolar * Math.sin((angulo * Math.PI) / 180));

            row.querySelector(".real").value = real.toFixed(2);
            row.querySelector(".imag").value = imag.toFixed(2);

            sumaReal += real;
            sumaImag += imag;

            // Actualizar la tabla de suma y resultado
            const sumaRow = sumaResultadosTable.querySelector("tr");
            sumaRow.querySelector(".suma-real").value = sumaReal.toFixed(2);
            sumaRow.querySelector(".suma-imag").value = sumaImag.toFixed(2);

            const polarResult = Math.sqrt(sumaReal ** 2 + sumaImag ** 2);
            const anguloResult = Math.atan2(sumaImag, sumaReal) * (180 / Math.PI);

            sumaRow.querySelector(".polar-resultado").value = polarResult.toFixed(2);
            sumaRow.querySelector(".fx3").value = anguloResult.toFixed(2); // F(X)3 ahora contiene el resultado del ángulo
            sumaRow.querySelector(".angulo-resultado").value = Math.cos(anguloResult * Math.PI / 180).toFixed(2); // Ángulo como coseno de F(X)3
        });
    }

    // Event listeners para cambios en las tablas
    proteccionesTable.addEventListener("input", () => {
        calculateProtecciones();
        updateFasorialTable(); 
    });

    // Calcular valores iniciales
    calculateProtecciones();
    updateFasorialTable();
});
// Navegación con Enter/Return - Archivo separado
document.addEventListener("DOMContentLoaded", () => {
    function handleEnterKey(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            const inputs = Array.from(document.querySelectorAll('input:not([readonly]), select'));
            const currentIndex = inputs.indexOf(event.target);
            const nextInput = inputs[currentIndex + 1];
            
            if (nextInput) {
                nextInput.focus();
                if (nextInput.tagName === 'INPUT') {
                    nextInput.select();
                }
            }
        }
    }

    // Aplicar el event listener a todos los inputs editables existentes
    document.querySelectorAll('input:not([readonly]), select').forEach(input => {
        input.addEventListener('keydown', handleEnterKey);
    });

    // Observador para nuevos elementos añadidos
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) { // Es un elemento
                    node.querySelectorAll('input:not([readonly]), select').forEach(input => {
                        input.addEventListener('keydown', handleEnterKey);
                    });
                }
            });
        });
    });

    // Observar cambios en las tablas
    const tables = document.querySelectorAll('tbody');
    tables.forEach(table => {
        observer.observe(table, {
            childList: true,
            subtree: true
        });
    });
});