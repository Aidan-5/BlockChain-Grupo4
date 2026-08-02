import 'package:flutter/material.dart';

import '../../theme/app_theme.dart';
import '../../widgets/glass_card.dart';

class HelpScreen extends StatelessWidget {
  const HelpScreen({super.key});

  static const _faqs = [
    (
      pregunta: '¿Qué es Ecuador SSI?',
      respuesta:
          'Es tu billetera de identidad digital soberana: tus documentos y '
          'credenciales se guardan en tu dispositivo y su autenticidad se '
          'verifica mediante blockchain, sin depender de un intermediario.',
    ),
    (
      pregunta: '¿Qué pasa si pierdo mi dispositivo?',
      respuesta:
          'Puedes restaurar tu billetera en un dispositivo nuevo usando tu '
          'última copia de seguridad, disponible en Ajustes > Copia de '
          'seguridad.',
    ),
    (
      pregunta: '¿Quién puede ver mi información al compartir un QR?',
      respuesta:
          'Solo se comparte la información mínima necesaria (por ejemplo, '
          'si eres mayor de edad y tu nombre), nunca todos tus datos '
          'personales.',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Ayuda y soporte')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const Text(
              'Preguntas frecuentes',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: AppColors.textMain,
              ),
            ),
            const SizedBox(height: 12),
            GlassCard(
              padding: EdgeInsets.zero,
              child: Theme(
                data: Theme.of(
                  context,
                ).copyWith(dividerColor: Colors.transparent),
                child: Column(
                  children: [
                    for (final faq in _faqs)
                      ExpansionTile(
                        title: Text(
                          faq.pregunta,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textMain,
                          ),
                        ),
                        children: [
                          Padding(
                            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                            child: Align(
                              alignment: Alignment.centerLeft,
                              child: Text(
                                faq.respuesta,
                                style: const TextStyle(
                                  fontSize: 13,
                                  color: AppColors.textMuted,
                                  height: 1.5,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Contáctanos',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: AppColors.textMain,
              ),
            ),
            const SizedBox(height: 12),
            GlassCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: const [
                  ListTile(
                    leading: Icon(Icons.email_outlined, color: AppColors.primary),
                    title: Text('soporte@ecuadorssi.gob.ec'),
                  ),
                  Divider(height: 1, color: AppColors.glassBorder),
                  ListTile(
                    leading: Icon(Icons.phone_outlined, color: AppColors.primary),
                    title: Text('1800-IDENTIDAD'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
