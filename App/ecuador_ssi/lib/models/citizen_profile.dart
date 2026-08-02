/// Perfil del ciudadano dueño de la billetera, análogo al modelo `Usuario`
/// de Backend/prisma/schema.prisma.
class CitizenProfile {
  const CitizenProfile({
    required this.nombreCompleto,
    required this.cedula,
    required this.fechaNacimiento,
    required this.email,
    required this.wallet,
    required this.did,
  });

  final String nombreCompleto;
  final String cedula;
  final DateTime fechaNacimiento;
  final String email;
  final String wallet;
  final String did;

  bool get esMayorDeEdad {
    final now = DateTime.now();
    var edad = now.year - fechaNacimiento.year;
    final aunNoCumpleEsteAnio =
        now.month < fechaNacimiento.month ||
        (now.month == fechaNacimiento.month && now.day < fechaNacimiento.day);
    if (aunNoCumpleEsteAnio) edad--;
    return edad >= 18;
  }
}
