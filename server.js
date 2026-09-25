const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Conexión a MongoDB Atlas (usa variable de entorno o tu URL directa)
const MONGO_URI = process.env.MONGO_URI || "TU_URL_DE_MONGODB_ATLAS_AQUI";

mongoose.connect(MONGO_URI)
    .then(() => console.log("🔥 Conectado exitosamente a MongoDB Atlas"))
    .catch(err => console.error("❌ Error al conectar a MongoDB:", err));

// Definir el Esquema y Modelo del Cliente (Actualizado con cumpleanos)
const clienteSchema = new mongoose.Schema({
    telefono: { type: String, required: true, unique: true },
    nombre: { type: String, default: "Socio VIP" },
    puntos: { type: Number, default: 0 },
    meta: { type: Number, default: 10 },
    cumpleanos: { type: String, default: "" } // Nuevo campo para la fecha (Ej: "21/01")
});

const Cliente = mongoose.model('Cliente', clienteSchema);

// Obtener o crear datos del cliente por su celular
app.get('/api/cliente/:id', async (req, res) => {
    try {
        let clienteId = req.params.id.trim();
        let cliente = await Cliente.findOne({ telefono: clienteId });
        
        if (!cliente) {
            cliente = new Cliente({ 
                telefono: clienteId, 
                nombre: "Socio VIP", 
                puntos: 0, 
                meta: 10,
                cumpleanos: ""
            });
            await cliente.save();
        }
        
        res.json(cliente);
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor al buscar cliente" });
    }
});

// Registrar o crear cliente con su número
app.post('/api/cliente/:id', async (req, res) => {
    try {
        let clienteId = req.params.id.trim();
        const { nombre } = req.body;

        let cliente = await Cliente.findOne({ telefono: clienteId });

        if (!cliente) {
            cliente = new Cliente({ 
                telefono: clienteId,
                nombre: nombre || "Socio VIP", 
                puntos: 0, 
                meta: 10,
                cumpleanos: ""
            });
        } else if (nombre) {
            cliente.nombre = nombre;
        }

        await cliente.save();
        res.json({ success: true, cliente });
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor al registrar cliente" });
    }
});

// Actualizar solo el nombre del cliente
app.post('/api/cliente/:id/nombre', async (req, res) => {
    try {
        let clienteId = req.params.id.trim();
        const { nombre } = req.body;

        let cliente = await Cliente.findOne({ telefono: clienteId });
        if (!cliente) {
            return res.status(404).json({ error: "Cliente no encontrado" });
        }

        cliente.nombre = nombre || "Socio VIP";
        await cliente.save();
        res.json({ success: true, cliente });
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor al actualizar nombre" });
    }
});

// Actualizar o registrar el cumpleaños del cliente
app.post('/api/cliente/:id/cumpleanos', async (req, res) => {
    try {
        let clienteId = req.params.id.trim();
        const { cumpleanos } = req.body;

        let cliente = await Cliente.findOne({ telefono: clienteId });
        if (!cliente) {
            return res.status(404).json({ error: "Cliente no encontrado" });
        }

        cliente.cumpleanos = cumpleanos || "";
        await cliente.save();
        
        res.json({ success: true, message: "¡Cumpleaños guardado con éxito!", cliente });
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor al guardar el cumpleaños" });
    }
});

// Panel de Administración: Sumar sello validando que el cliente exista
app.post('/api/admin/sumar', async (req, res) => {
    try {
        const { pin } = req.body;
        let clienteId = req.body.clienteId ? req.body.clienteId.trim() : '';

        if (pin !== "1234") {
            return res.status(401).json({ error: "PIN incorrecto" });
        }

        if (!clienteId) {
            return res.status(400).json({ error: "El número de celular es obligatorio" });
        }

        let cliente = await Cliente.findOne({ telefono: clienteId });
        if (!cliente) {
            return res.status(404).json({ error: "Este número de celular no está registrado" });
        }

        if (cliente.puntos < cliente.meta) {
            cliente.puntos += 1;
            await cliente.save();
            res.json({ success: true, cliente });
        } else {
            res.status(400).json({ error: "¡El cliente ya completó todos los sellos!" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor al sumar sello" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});