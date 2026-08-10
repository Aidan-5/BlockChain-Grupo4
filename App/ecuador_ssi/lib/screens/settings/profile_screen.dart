import 'package:flutter/material.dart';

import '../../models/citizen_profile.dart';
import '../../services/profile_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/glass_card.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key, required this.userId});

  final int userId;

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  late Future<CitizenProfile?> _profileFuture;

  @override
  void initState() {
    super.initState();
    _profileFuture = ProfileService.fetchProfile(widget.userId);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Mi perfil')),
      body: SafeArea(
        child: FutureBuilder<CitizenProfile?>(
          future: _profileFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }

            if (widget.userId <= 0) {
              return _MessageState(
                icon: Icons.login_rounded,
                message:
                    'Inicia sesión con tu cuenta para ver los datos de tu perfil.',
              );
            }

            if (snapshot.hasError || snapshot.data == null) {
              return _MessageState(
                icon: Icons.cloud_off_outlined,
                message:
                    'No se pudo cargar tu perfil. Verifica que el backend esté activo e intenta de nuevo.',
                actionLabel: 'Reintentar',
                onAction: () {
                  setState(() {
                    _profileFuture = ProfileService.fetchProfile(widget.userId);
                  });
                },
              );
            }

            return _ProfileContent(profile: snapshot.data!);
          },
        ),
      ),
    );
  }
}

class _ProfileContent extends StatelessWidget {
  const _ProfileContent({required this.profile});

  final CitizenProfile profile;

  @override
  Widget build(BuildContext context) {
    final initials = profile.nombreCompleto
        .trim()
        .split(RegExp(r'\s+'))
        .take(2)
        .map((part) => part.isEmpty ? '' : part[0])
        .join()
        .toUpperCase();

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Center(
          child: Column(
            children: [
              CircleAvatar(
                radius: 40,
                backgroundColor: AppColors.primary.withValues(alpha: 0.12),
                child: Text(
                  initials.isEmpty ? '?' : initials,
                  style: const TextStyle(
                    fontSize: 26,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primary,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                profile.nombreCompleto,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textMain,
                ),
              ),
              Text(
                'Cédula ${profile.cedula}',
                style: const TextStyle(
                  fontSize: 13,
                  color: AppColors.textMuted,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 28),
        GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _ProfileField(label: 'Correo electrónico', value: profile.email),
              const SizedBox(height: 16),
              _ProfileField(
                label: 'Fecha de nacimiento',
                value: profile.fechaNacimiento != null
                    ? _formatDate(profile.fechaNacimiento!)
                    : 'No registrada',
              ),
              const SizedBox(height: 16),
              _ProfileField(
                label: 'Wallet',
                value: profile.wallet,
                monospace: true,
              ),
              const SizedBox(height: 16),
              _ProfileField(label: 'DID', value: profile.did, monospace: true),
            ],
          ),
        ),
      ],
    );
  }

  static String _formatDate(DateTime date) {
    final day = date.day.toString().padLeft(2, '0');
    final month = date.month.toString().padLeft(2, '0');
    return '$day/$month/${date.year}';
  }
}

class _MessageState extends StatelessWidget {
  const _MessageState({
    required this.icon,
    required this.message,
    this.actionLabel,
    this.onAction,
  });

  final IconData icon;
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 48, color: AppColors.textMuted),
            const SizedBox(height: 16),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.textMuted, height: 1.5),
            ),
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: 20),
              OutlinedButton(onPressed: onAction, child: Text(actionLabel!)),
            ],
          ],
        ),
      ),
    );
  }
}

class _ProfileField extends StatelessWidget {
  const _ProfileField({
    required this.label,
    required this.value,
    this.monospace = false,
  });

  final String label;
  final String value;
  final bool monospace;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            color: AppColors.textMain,
            fontSize: 14,
            fontFamily: monospace ? 'monospace' : null,
          ),
        ),
      ],
    );
  }
}
