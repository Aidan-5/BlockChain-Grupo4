import 'package:http/http.dart' as http;

/// Fábrica del `http.Client` por defecto usado por los servicios de API
/// cuando no se les inyecta uno explícitamente. Los tests de widget
/// sobreescriben `factory` con un `MockClient` antes de montar el árbol,
/// para que pantallas alcanzadas por navegación interna (que construyen
/// su propio `AuthApi()`/`SolicitudesApi()`) también queden mockeadas sin
/// tener que pasar el cliente a mano por cada ruta.
class HttpClientProvider {
  HttpClientProvider._();

  static http.Client Function() factory = http.Client.new;
}
