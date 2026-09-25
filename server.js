const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const MONGO_URI = process.env.MONGO_URI || "TU_URL_DE_MONGODB_ATLAS_AQUI";

mongoose.connect(MONGO_URI)
    .then(() => console.log("🔥 Conectado exitosamente a MongoDB Atlas"))
    .catch(err => console.error("❌ Error al conectar a MongoDB:", err));

const clienteSchema = new mongoose.Schema({
    telefono: { type: String, required: true, unique: true },
    nombre: { type: String, default: "Socio VIP" },
    puntos: { type: Number, default: 0 },
    meta: { type: Number, default: 10 },
    cumpleanos: { type: String, default: "" }
});

const Cliente = mongoose.model('Cliente', clienteSchema);

// Variable global para promociones
let ultimaPromocion = "";

// 1. Obtener todos los clientes para el panel de administración
app.get('/api/clientes', async (req, res) => {
    try {
        const clientes = await Cliente.find();
        res.json(clientes);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener la lista de clientes" });
    }
});

// 2. Buscar o crear cliente por teléfono
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

// 3. Registrar o actualizar datos básicos del cliente
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

// 4. Actualizar solo el nombre
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

// 5. Guardar cumpleaños
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

// 6. Sumar sello desde el panel de administrador
app.post('/api/cliente/:id/sello', async (req, res) => {
    try {
        let clienteId = req.params.id.trim();
        let cliente = await Cliente.findOne({ telefono: clienteId });
        if (!cliente) {
            return res.status(404).json({ error: "Cliente no encontrado" });
        }

        if (cliente.puntos < cliente.meta) {
            cliente.puntos += 1;
            await cliente.save();
            res.json({ success: true, cliente });
        } else {
            res.status(400).json({ error: "El cliente ya completó su meta" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error al sumar sello" });
    }
});

// 7. Eliminar cliente desde el panel de administración
app.delete('/api/cliente/:id', async (req, res) => {
    try {
        let clienteId = req.params.id.trim();
        await Cliente.findOneAndDelete({ telefono: clienteId });
        res.json({ success: true, message: "Cliente eliminado" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar cliente" });
    }
});

// 8. Endpoints de promociones globales
app.post('/api/admin/promocion', (req, res) => {
    const { mensaje } = req.body;
    if (!mensaje) return res.status(400).json({ error: "Mensaje vacío" });
    
    ultimaPromocion = mensaje;
    res.json({ success: true, mensaje: "Promoción guardada con éxito" });
});

app.get('/api/promocion-activa', (req, res) => {
    res.json({ promocion: ultimaPromocion });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});