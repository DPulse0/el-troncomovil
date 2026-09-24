const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Base de datos en memoria para múltiples clientes
const clientesDB = {
    "3101234567": {
        nombre: "David Ruiz",
        puntos: 0,
        meta: 10
    }
};

// Obtener o crear datos del cliente por su celular
app.get('/api/cliente/:id', (req, res) => {
    let clienteId = req.params.id.trim();
    
    if (!clientesDB[clienteId]) {
        clientesDB[clienteId] = {
            nombre: "Socio VIP",
            puntos: 0,
            meta: 10
        };
    }
    
    res.json(clientesDB[clienteId]);
});

// Registrar o crear cliente con su número
app.post('/api/cliente/:id', (req, res) => {
    let clienteId = req.params.id.trim();
    const { nombre } = req.body;

    if (!clientesDB[clienteId]) {
        clientesDB[clienteId] = { 
            nombre: nombre || "Socio VIP", 
            puntos: 0, 
            meta: 10 
        };
    } else if (nombre) {
        clientesDB[clienteId].nombre = nombre;
    }

    res.json({ success: true, cliente: clientesDB[clienteId] });
});

// Actualizar solo el nombre del cliente
app.post('/api/cliente/:id/nombre', (req, res) => {
    let clienteId = req.params.id.trim();
    const { nombre } = req.body;

    if (!clientesDB[clienteId]) {
        return res.status(404).json({ error: "Cliente no encontrado" });
    }

    clientesDB[clienteId].nombre = nombre || "Socio VIP";
    res.json({ success: true, cliente: clientesDB[clienteId] });
});

// Panel de Administración: Sumar sello validando que el cliente exista
app.post('/api/admin/sumar', (req, res) => {
    const { pin } = req.body;
    let clienteId = req.body.clienteId ? req.body.clienteId.trim() : '';

    if (pin !== "1234") {
        return res.status(401).json({ error: "PIN incorrecto" });
    }

    if (!clienteId) {
        return res.status(400).json({ error: "El número de celular es obligatorio" });
    }

    if (!clientesDB[clienteId]) {
        return res.status(404).json({ error: "Este número de celular no está registrado" });
    }

    if (clientesDB[clienteId].puntos < clientesDB[clienteId].meta) {
        clientesDB[clienteId].puntos += 1;
        res.json({ success: true, cliente: clientesDB[clienteId] });
    } else {
        res.status(400).json({ error: "¡El cliente ya completó todos los sellos!" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});