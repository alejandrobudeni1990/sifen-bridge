const express = require('express');
const axios = require('axios');
const { parseString } = require('xml2js');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Configuración SIFEN
const SIFEN_URL = 'https://sifen-test.set.gov.py/de/ws/consultas/consulta-ruc';

// Ruta raíz
app.get('/', (req, res) => {
    res.json({ estado: 'ok', servicio: 'SIFEN Bridge' });
});

// Consulta de RUC
app.get('/api/consultar-ruc/:ruc', async (req, res) => {
    const ruc = req.params.ruc;
    
    const soapRequest = `<?xml version="1.0" encoding="UTF-8"?>
<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope"
                 xmlns:xsd="http://ekuatia.set.gov.py/sifen/xsd">
    <soap12:Body>
        <xsd:rEnviConsRUC>
            <xsd:dId>1</xsd:dId>
            <xsd:dRUCCons>${ruc}</xsd:dRUCCons>
        </xsd:rEnviConsRUC>
    </soap12:Body>
</soap12:Envelope>`;

    try {
        const respuesta = await axios.post(SIFEN_URL, soapRequest, {
            headers: {
                'Content-Type': 'application/soap+xml; charset=utf-8',
                'SOAPAction': ''
            },
            timeout: 15000
        });

        parseString(respuesta.data, { explicitArray: false, ignoreAttrs: false }, (err, result) => {
            if (err) {
                res.json({ error: true, mensaje: 'Error al parsear XML', xml_crudo: respuesta.data.substring(0, 500) });
                return;
            }
            res.json({ error: false, datos: result });
        });

    } catch (error) {
        res.json({ 
            error: true, 
            mensaje: 'Error al consultar SIFEN', 
            detalle: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log('SIFEN Bridge iniciado en puerto ' + PORT);
});
