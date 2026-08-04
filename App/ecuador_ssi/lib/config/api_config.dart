/// Backend base URL (Backend/src/main.ts listens on PORT, 3005 in this repo
/// to avoid a local port clash — see Backend/docker-compose.yml).
///
/// - Windows/macOS/Linux desktop, Chrome (`flutter run -d chrome/windows`):
///   `localhost` resolves to this same machine, so the default works as-is.
/// - Android emulator: `localhost` refers to the emulator itself, not the
///   host machine. Override with `--dart-define=API_BASE_URL=http://10.0.2.2:3005`.
/// - Physical device: use your machine's LAN IP instead of localhost.
const String apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://localhost:3005',
);
