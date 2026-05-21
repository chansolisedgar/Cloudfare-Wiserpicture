const https = require('https');
const crypto = require('crypto');

exports.handler = async (event) => {
  // Solo permitir peticiones POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { email, tags = [] } = JSON.parse(event.body);

    if (!email) {
      return { statusCode: 400, body: JSON.stringify({ error: 'El email es requerido' }) };
    }

    const apiKey = process.env.MAILCHIMP_API_KEY;
    const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;

    if (!apiKey || !audienceId) {
      console.error('La clave de API de Mailchimp o el ID de la audiencia no están configurados en Netlify.');
      return { statusCode: 500, body: JSON.stringify({ error: 'Error de configuración en el servidor' }) };
    }

    // Extraer el centro de datos de la clave API (ej. "abcd-us14" -> "us14")
    const datacenter = apiKey.split('-')[1] || 'us14';
    
    // El hash del suscriptor en Mailchimp es el MD5 del email en minúsculas
    const subscriberHash = crypto.createHash('md5').update(email.toLowerCase()).digest('hex');

    const url = `https://${datacenter}.api.mailchimp.com/3.0/lists/${audienceId}/members/${subscriberHash}`;

    // Si no se envían etiquetas, usar la etiqueta por defecto del Lead Magnet
    const tagsToAdd = tags.length > 0 ? tags : ['Lead Magnet Módulo 1'];
    
    // Configuración para añadir/actualizar al miembro
    // Usamos status_if_new: 'subscribed' para que no pida confirmación si es nuevo.
    // Si ya existe, PUT actualiza sus datos y etiquetas.
    const data = JSON.stringify({
      email_address: email,
      status_if_new: 'subscribed',
      tags: tagsToAdd
    });

    const options = {
      method: 'PUT',
      headers: {
        'Authorization': `apikey ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(url, options, (res) => {
        let responseBody = '';
        res.on('data', (chunk) => { responseBody += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({
              statusCode: 200,
              body: JSON.stringify({ success: true, message: '¡Te has suscrito exitosamente!' })
            });
          } else {
            console.error('Error de Mailchimp:', responseBody);
            resolve({
              statusCode: res.statusCode,
              body: JSON.stringify({ error: 'Error al suscribir', details: JSON.parse(responseBody) })
            });
          }
        });
      });

      req.on('error', (e) => {
        console.error('Error en la petición a Mailchimp:', e);
        resolve({
          statusCode: 500,
          body: JSON.stringify({ error: 'Error de comunicación con el servidor de correos' })
        });
      });

      req.write(data);
      req.end();
    });

  } catch (error) {
    console.error('Error en la función subscribe:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error interno del servidor' })
    };
  }
};
