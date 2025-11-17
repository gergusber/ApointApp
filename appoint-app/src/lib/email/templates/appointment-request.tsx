/**
 * Email template for appointment request notification to business
 */

export function appointmentRequestEmail(data: {
  businessName: string;
  customerName: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  customerNotes?: string;
  approvalLink: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Nueva Solicitud de Cita</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">Nueva Solicitud de Cita</h1>
          
          <p>Hola ${data.businessName},</p>
          
          <p>Has recibido una nueva solicitud de cita:</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Cliente:</strong> ${data.customerName}</p>
            <p><strong>Servicio:</strong> ${data.serviceName}</p>
            <p><strong>Fecha:</strong> ${data.appointmentDate}</p>
            <p><strong>Horario:</strong> ${data.appointmentTime}</p>
            ${data.customerNotes ? `<p><strong>Notas:</strong> ${data.customerNotes}</p>` : ''}
          </div>
          
          <p>
            <a href="${data.approvalLink}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Ver y Aprobar Solicitud
            </a>
          </p>
          
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
            Tienes 2 horas para responder a esta solicitud.
          </p>
        </div>
      </body>
    </html>
  `;
}

