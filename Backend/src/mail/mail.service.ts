import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private from = '';
  private isConfigured = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<string>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    const from = this.configService.get<string>('SMTP_FROM');

    if (!host || !user || !pass) {
      this.logger.warn(
        'MailService: SMTP no configurado, los correos se omitirán. Defina SMTP_HOST, SMTP_USER y SMTP_PASS en .env',
      );
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host,
        port: port ? Number(port) : 587,
        secure: Number(port) === 465,
        auth: { user, pass },
      });
      this.from = from ?? user;
      this.isConfigured = true;
      this.logger.log(`MailService conectado a ${host}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Error al inicializar MailService: ${message}. El backend continuará sin envío de correos.`,
      );
    }
  }

  isReady(): boolean {
    return this.isConfigured;
  }

  async enviar(
    destinatarioEmail: string,
    asunto: string,
    cuerpoHtml: string,
  ): Promise<void> {
    if (!this.isReady()) {
      this.logger.log(
        `MailService no configurado, se omite el envío a ${destinatarioEmail}: "${asunto}"`,
      );
      return;
    }

    try {
      await this.transporter!.sendMail({
        from: this.from,
        to: destinatarioEmail,
        subject: asunto,
        html: cuerpoHtml,
      });
    } catch (err) {
      // Un fallo de email nunca debe romper el flujo de negocio que lo dispara.
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Error al enviar correo a ${destinatarioEmail}: ${message}`,
      );
    }
  }
}
