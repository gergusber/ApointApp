/**
 * Email template for appointment approval notification to customer
 */

export function appointmentApprovedEmail(data: {
  customerName: string;
  businessName: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  paymentLink: string;
  totalAmount: number;
}) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Cita Aprobada</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #10b981;">¡Tu Cita Fue Aprobada!</h1>
          
          <p>Hola ${data.customerName},</p>
          
          <p>Tu solicitud de cita ha sido aprobada:</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Negocio:</strong> ${data.businessName}</p>
            <p><strong>Servicio:</strong> ${data.serviceName}</p>
            <p><strong>Fecha:</strong> ${data.appointmentDate}</p>
            <p><strong>Horario:</strong> ${data.appointmentTime}</p>
            <p><strong>Total:</strong> $${data.totalAmount.toLocaleString('es-AR')} ARS</p>
          </div>
          
          <p>
            <a href="${data.paymentLink}" style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Realizar Pago
            </a>
          </p>
          
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
            Una vez completado el pago, tu cita quedará confirmada.
          </p>
        </div>
      </body>
    </html>
  `;
}

