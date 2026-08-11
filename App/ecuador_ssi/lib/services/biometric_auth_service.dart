import 'package:flutter/services.dart';
import 'package:local_auth/local_auth.dart';

/// Resultado de un intento de autenticación biométrica.
class BiometricAuthResult {
  const BiometricAuthResult._(this.success, this.message);

  const BiometricAuthResult.success() : this._(true, null);

  /// El usuario canceló el prompt del sistema — no hace falta mostrar error.
  const BiometricAuthResult.canceled() : this._(false, null);

  const BiometricAuthResult.failure(String message) : this._(false, message);

  final bool success;

  /// Null cuando no hace falta mostrarle nada al usuario (éxito o cancelación).
  final String? message;
}

/// Envoltorio sobre `local_auth` para autenticar con huella digital / Face ID.
class BiometricAuthService {
  BiometricAuthService({LocalAuthentication? auth})
    : _auth = auth ?? LocalAuthentication();

  final LocalAuthentication _auth;

  /// Si el dispositivo soporta biometría y tiene al menos una huella/rostro
  /// registrado. Útil para no ofrecer la opción si nunca podrá funcionar.
  Future<bool> isAvailable() async {
    try {
      final supported = await _auth.isDeviceSupported();
      final canCheck = await _auth.canCheckBiometrics;
      return supported && canCheck;
    } on PlatformException {
      return false;
    }
  }

  /// Lanza el prompt biométrico del sistema con [reason] como explicación.
  Future<BiometricAuthResult> authenticate(String reason) async {
    try {
      final ok = await _auth.authenticate(
        localizedReason: reason,
        biometricOnly: true,
        persistAcrossBackgrounding: true,
      );
      return ok
          ? const BiometricAuthResult.success()
          : const BiometricAuthResult.canceled();
    } on LocalAuthException catch (e) {
      if (e.code == LocalAuthExceptionCode.userCanceled ||
          e.code == LocalAuthExceptionCode.systemCanceled) {
        return const BiometricAuthResult.canceled();
      }
      return BiometricAuthResult.failure(_messageFor(e.code));
    } on PlatformException catch (e) {
      return BiometricAuthResult.failure(
        e.message ?? 'No se pudo iniciar la autenticación biométrica.',
      );
    }
  }

  String _messageFor(LocalAuthExceptionCode code) {
    switch (code) {
      case LocalAuthExceptionCode.noBiometricsEnrolled:
        return 'No tienes huella digital ni Face ID configurados en este '
            'dispositivo. Configúralo en los ajustes del teléfono.';
      case LocalAuthExceptionCode.noCredentialsSet:
        return 'Este dispositivo no tiene ningún bloqueo de pantalla '
            'configurado (huella, PIN o patrón).';
      case LocalAuthExceptionCode.noBiometricHardware:
        return 'Este dispositivo no cuenta con sensor de huella digital ni '
            'reconocimiento facial.';
      case LocalAuthExceptionCode.biometricHardwareTemporarilyUnavailable:
        return 'El sensor biométrico no está disponible en este momento. '
            'Intenta de nuevo.';
      case LocalAuthExceptionCode.temporaryLockout:
        return 'Demasiados intentos fallidos. Espera unos segundos e '
            'inténtalo de nuevo.';
      case LocalAuthExceptionCode.biometricLockout:
        return 'La huella digital fue bloqueada por intentos fallidos. '
            'Desbloquea tu teléfono con el PIN o patrón para reactivarla.';
      case LocalAuthExceptionCode.timeout:
        return 'Se agotó el tiempo de espera. Intenta de nuevo.';
      default:
        return 'No se pudo verificar tu huella digital. Intenta de nuevo.';
    }
  }
}
