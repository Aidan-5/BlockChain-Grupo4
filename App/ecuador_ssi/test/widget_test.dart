import 'dart:convert';

import 'package:ecuador_ssi/main.dart';
import 'package:ecuador_ssi/models/session.dart';
import 'package:ecuador_ssi/services/http_client_provider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

/// Backend falso en memoria: responde a las mismas rutas que el NestJS
/// real (/auth/login, /solicitudes/usuario/:id, /solicitudes) para poder
/// probar el flujo completo sin red.
MockClient buildFakeBackend({List<Map<String, dynamic>>? solicitudes}) {
  final store = solicitudes ?? [];

  return MockClient((request) async {
    if (request.url.path == '/auth/login') {
      return http.Response(
        jsonEncode({
          'access_token': 'fake-token',
          'user': {
            'id': 1,
            'nombre': 'María Vásquez',
            'email': 'maria@ejemplo.ec',
            'rol': 'CIUDADANO',
          },
        }),
        200,
      );
    }

    if (request.url.path == '/solicitudes' && request.method == 'POST') {
      final body = jsonDecode(request.body) as Map<String, dynamic>;
      final created = {
        'id': store.length + 1,
        'tipoCredencial': body['tipoCredencial'],
        'datosJSON': body['datosJSON'],
        'estado': 'PENDIENTE',
        'hashTemporal': 'temp-hash-${store.length + 1}',
        'createdAt': DateTime.now().toIso8601String(),
      };
      store.add(created);
      return http.Response(jsonEncode(created), 201);
    }

    if (request.url.path.startsWith('/solicitudes/usuario/')) {
      return http.Response(jsonEncode(store), 200);
    }

    return http.Response('Not found', 404);
  });
}

Future<void> loginAndReachWalletHome(
  WidgetTester tester, {
  required List<Map<String, dynamic>> solicitudes,
}) async {
  HttpClientProvider.factory = () => buildFakeBackend(solicitudes: solicitudes);

  await tester.pumpWidget(const MyApp());
  await tester.tap(find.text('Continuar'));
  await tester.pumpAndSettle();

  await tester.enterText(find.byType(TextFormField).first, 'maria@ejemplo.ec');
  await tester.enterText(find.byType(TextFormField).last, 'secret123');
  await tester.tap(find.text('Iniciar sesión'));
  await tester.pumpAndSettle();

  expect(find.text('Protege tu billetera'), findsOneWidget);

  await tester.tap(find.text('Usar huella digital'));
  await tester.pumpAndSettle();
}

void main() {
  setUp(() => AuthSession.instance.clear());

  testWidgets('Onboarding screen shows title and Continuar button', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(const MyApp());

    expect(find.text('Tú eres dueño de tu identidad'), findsOneWidget);
    expect(find.text('Continuar'), findsOneWidget);
  });

  testWidgets('Tapping Continuar navigates to the login screen', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(const MyApp());

    await tester.tap(find.text('Continuar'));
    await tester.pumpAndSettle();

    expect(find.text('Inicia sesión'), findsOneWidget);
  });

  testWidgets('Logging in reaches Protege tu billetera, then the wallet home', (
    WidgetTester tester,
  ) async {
    await loginAndReachWalletHome(tester, solicitudes: []);

    expect(find.text('Mi Billetera'), findsOneWidget);
    expect(find.text('Tu billetera está vacía'), findsOneWidget);
  });

  testWidgets('Wallet splits approved and pending solicitudes like the web', (
    WidgetTester tester,
  ) async {
    await loginAndReachWalletHome(
      tester,
      solicitudes: [
        {
          'id': 1,
          'tipoCredencial': 'Cédula de Identidad',
          'datosJSON': jsonEncode({
            'nombres': 'María',
            'apellidos': 'Vásquez',
            'cedula': '1723456789',
            'fechaNacimiento': '1998-04-22',
          }),
          'estado': 'APROBADA',
          'hashTemporal': 'abc123',
          'createdAt': DateTime.now().toIso8601String(),
        },
        {
          'id': 2,
          'tipoCredencial': 'Cédula de Identidad',
          'datosJSON': jsonEncode({'nombres': 'María', 'apellidos': 'Vásquez'}),
          'estado': 'PENDIENTE',
          'hashTemporal': 'def456',
          'createdAt': DateTime.now().toIso8601String(),
        },
      ],
    );

    expect(find.text('Credenciales Activas'), findsOneWidget);
    expect(find.text('Solicitudes en Revisión'), findsOneWidget);
    expect(find.text('María Vásquez'), findsOneWidget);
  });

  testWidgets('Ajustes lists the settings sections and logout clears the session', (
    WidgetTester tester,
  ) async {
    await loginAndReachWalletHome(tester, solicitudes: []);

    await tester.tap(find.text('Ajustes'));
    await tester.pumpAndSettle();

    expect(find.text('Mi perfil'), findsOneWidget);
    expect(find.text('Autenticación (PIN/Huella)'), findsOneWidget);

    await tester.tap(find.text('Cerrar sesión'));
    await tester.pumpAndSettle();

    expect(find.text('Tú eres dueño de tu identidad'), findsOneWidget);
    expect(AuthSession.instance.isAuthenticated, isFalse);
  });

  testWidgets('Sharing an approved credential shows the privacy disclosure box', (
    WidgetTester tester,
  ) async {
    await loginAndReachWalletHome(
      tester,
      solicitudes: [
        {
          'id': 1,
          'tipoCredencial': 'Cédula de Identidad',
          'datosJSON': jsonEncode({
            'nombres': 'María',
            'apellidos': 'Vásquez',
            'cedula': '1723456789',
            'fechaNacimiento': '1998-04-22',
          }),
          'estado': 'APROBADA',
          'hashTemporal': 'abc123',
          'createdAt': DateTime.now().toIso8601String(),
        },
      ],
    );

    await tester.tap(find.text('María Vásquez'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Compartir identidad con QR'));
    await tester.pumpAndSettle();

    expect(find.text('Privacidad protegida'), findsOneWidget);
    expect(find.text('Mayor de edad'), findsOneWidget);
  });

  testWidgets('Requesting identity posts to /solicitudes and shows the tracking hash', (
    WidgetTester tester,
  ) async {
    await loginAndReachWalletHome(tester, solicitudes: []);

    await tester.tap(find.text('Solicitar identidad').first);
    await tester.pumpAndSettle();

    await tester.enterText(find.widgetWithText(TextFormField, 'Nombres'), 'Juan');
    await tester.enterText(find.widgetWithText(TextFormField, 'Apellidos'), 'Pérez');
    await tester.enterText(find.widgetWithText(TextFormField, 'Edad'), '30');
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Lugar de nacimiento'),
      'Quito, Ecuador',
    );
    await tester.tap(find.text('Selecciona una fecha'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('OK'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Enviar solicitud'));
    await tester.pumpAndSettle();

    expect(find.text('¡Solicitud enviada exitosamente!'), findsOneWidget);
  });
}
