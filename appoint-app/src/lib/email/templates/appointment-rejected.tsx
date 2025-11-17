/**
 * Email template for appointment rejection notification to customer
 */

export function appointmentRejectedEmail(data: {
  customerName: string;
  businessName: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  reason?: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Cita Rechazada</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #ef4444;">Cita Rechazada</h1>
          
          <p>Hola ${data.customerName},</p>
          
          <p>Lamentamos informarte que tu solicitud de cita ha sido rechazada:</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Negocio:</strong> ${data.businessName}</p>
            <p><strong>Servicio:</strong> ${data.serviceName}</p>
            <p><strong>Fecha:</strong> ${data.appointmentDate}</p>
            <p><strong>Horario:</strong> ${data.appointmentTime}</p>
            ${data.reason ? `<p><strong>Razón:</strong> ${data.reason}</p>` : ''}
          </div>
          
          <p>Puedes intentar reservar otro horario o contactar directamente con el negocio.</p>
        </div>
      </body>
    </html>
  `;
}

