/// Error devuelto por el backend (o de red) al llamar la API.
class ApiException implements Exception {
  const ApiException(this.message);

  final String message;

  @override
  String toString() => message;
}
