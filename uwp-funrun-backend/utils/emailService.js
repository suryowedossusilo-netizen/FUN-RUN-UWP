const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendRegistrationConfirmation = async (participant) => {
  const mailOptions = {
    from: '"UWP Fun Run" <noreply@uwpfunrun.id>',
    to: participant.email,
    subject: `Pendaftaran Berhasil - BIB ${participant.bib}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #FF6B35 0%, #004E89 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0;">UWP FUN RUN 2024</h1>
          <p style="margin: 10px 0 0 0;">Run For Fun, Run For Health</p>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #004E89;">Halo ${participant.fullName},</h2>
          <p>Terima kasih telah mendaftar UWP Fun Run 2024. Berikut detail pendaftaran Anda:</p>
          
          <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #FF6B35;">
            <p style="margin: 5px 0;"><strong>Nomor BIB:</strong> <span style="font-size: 24px; color: #FF6B35;">${participant.bib}</span></p>
            <p style="margin: 5px 0;"><strong>Kategori:</strong> ${participant.category}</p>
            <p style="margin: 5px 0;"><strong>Ukuran Kaos:</strong> ${participant.shirtSize}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> ${participant.status === 'pending' ? 'Menunggu Pembayaran' : 'Terverifikasi'}</p>
          </div>
          
          ${participant.status === 'pending' ? `
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;"><strong>Instruksi Pembayaran:</strong></p>
            <p style="margin: 10px 0;">Silakan transfer ke:<br>
            Bank BCA<br>
            No. Rekening: 123-456-7890<br>
            Atas Nama: UWP Fun Run<br>
            Nominal: Rp ${participant.payment?.amount?.toLocaleString('id-ID') || '0'}</p>
            <p style="margin: 5px 0; font-size: 12px;">Keterangan: UWP-${participant.bib}</p>
          </div>
          ` : ''}
          
          <p style="margin-top: 30px; font-size: 12px; color: #666;">
            Simpan email ini sebagai bukti pendaftaran. Race pack dapat diambil di venue H-1 acara dengan menunjukkan BIB ini.
          </p>
        </div>
        
        <div style="background: #1a1a2e; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p>&copy; 2024 UWP Fun Run. All rights reserved.</p>
        </div>
      </div>
    `
  };
  
  await transporter.sendMail(mailOptions);
};

const sendPaymentConfirmation = async (participant) => {
  const mailOptions = {
    from: '"UWP Fun Run" <noreply@uwpfunrun.id>',
    to: participant.email,
    subject: 'Pembayaran Terverifikasi - UWP Fun Run 2024',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #28a745; padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0;">PEMBAYARAN BERHASIL</h1>
        </div>
        <div style="padding: 30px;">
          <p>Halo ${participant.fullName},</p>
          <p>Pembayaran Anda telah terverifikasi. Status pendaftaran Anda sekarang <strong>AKTIF</strong>.</p>
          <p>Nomor BIB Anda: <strong style="font-size: 20px; color: #FF6B35;">${participant.bib}</strong></p>
          <p>Sampai jumpa di garis start!</p>
        </div>
      </div>
    `
  };
  
  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendRegistrationConfirmation,
  sendPaymentConfirmation
};