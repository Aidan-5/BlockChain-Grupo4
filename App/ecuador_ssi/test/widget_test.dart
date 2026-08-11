import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:ecuador_ssi/main.dart';

void main() {
  testWidgets('Onboarding screen shows title and Continuar button', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(const MyApp());

    expect(find.text('Tú eres dueño de tu identidad'), findsOneWidget);
    expect(find.text('Continuar'), findsOneWidget);
  });

  testWidgets('Tapping Continuar navigates to Protege tu billetera', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(const MyApp());

    await tester.tap(find.text('Continuar'));
    await tester.pumpAndSettle();

    expect(find.text('Protege tu billetera'), findsOneWidget);
    expect(find.text('Usar huella digital'), findsOneWidget);
    expect(find.text('Crear PIN'), findsOneWidget);
  });

  testWidgets('Choosing an unlock method opens the wallet home', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(const MyApp());

    await tester.tap(find.text('Continuar'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Usar huella digital'));
    await tester.pumpAndSettle();

    expect(find.text('Mi Billetera'), findsOneWidget);
    expect(find.text('Cédula de Identidad'), findsOneWidget);
    expect(find.text('Carnet de Discapacidad'), findsOneWidget);
  });

  Future<void> openWalletHome(WidgetTester tester) async {
    await tester.pumpWidget(const MyApp());
    await tester.tap(find.text('Continuar'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Usar huella digital'));
    await tester.pumpAndSettle();
  }

  testWidgets('Adding a credential lists authorized institutions to pick from', (
    WidgetTester tester,
  ) async {
    await openWalletHome(tester);

    await tester.tap(find.text('Añadir credencial').last);
    await tester.pumpAndSettle();

    expect(find.text('Institución emisora'), findsOneWidget);
    expect(find.text('Registro Civil del Ecuador'), findsOneWidget);
    expect(find.text('SENESCYT'), findsOneWidget);

    await tester.dragUntilVisible(
      find.text('Guardar credencial'),
      find.byType(ListView),
      const Offset(0, -200),
    );
    await tester.tap(find.text('Guardar credencial'));
    await tester.pumpAndSettle();

    expect(find.text('Selecciona una institución emisora'), findsOneWidget);
  });

  testWidgets('Sharing a credential shows the privacy-protected disclosure box', (
    WidgetTester tester,
  ) async {
    await openWalletHome(tester);

    await tester.tap(find.text('Cédula de Identidad'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Compartir identidad con QR'));
    await tester.pumpAndSettle();

    expect(find.text('Privacidad protegida'), findsOneWidget);
    expect(find.text('Mayor de edad'), findsOneWidget);
    expect(find.text('Nombres completos'), findsOneWidget);
  });

  testWidgets('Ajustes lists the new settings sections and opens Mi perfil', (
    WidgetTester tester,
  ) async {
    await openWalletHome(tester);

    await tester.tap(find.text('Ajustes'));
    await tester.pumpAndSettle();

    expect(find.text('Mi perfil'), findsOneWidget);
    expect(find.text('Autenticación (PIN/Huella)'), findsOneWidget);
    expect(find.text('Copia de seguridad'), findsOneWidget);
    expect(find.text('Historial de uso'), findsOneWidget);
    expect(find.text('Ayuda y soporte'), findsOneWidget);

    await tester.tap(find.text('Mi perfil'));
    await tester.pumpAndSettle();

    expect(find.text('Inicia sesión con tu cuenta para ver los datos de tu perfil.'), findsOneWidget);
  });
}
