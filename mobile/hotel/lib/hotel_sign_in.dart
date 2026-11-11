import 'dart:ui' show ImageFilter;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'api.dart';

class SignIn extends StatefulWidget {
  const SignIn({
    super.key,
    required this.api,
    this.onSignedIn,
    this.initialError,
  });

  final HotelApi api;
  final VoidCallback? onSignedIn;
  final String? initialError;

  @override
  State<SignIn> createState() => _SignInState();
}

class _SignInState extends State<SignIn> {
  final form = GlobalKey<FormState>();
  final name = TextEditingController();
  final email = TextEditingController();
  final password = TextEditingController();
  final confirmPassword = TextEditingController();
  bool creating = false;
  bool busy = false;
  String? error;
  String? notice;

  @override
  void initState() {
    super.initState();
    error = widget.initialError;
  }

  @override
  void dispose() {
    name.dispose();
    email.dispose();
    password.dispose();
    confirmPassword.dispose();
    super.dispose();
  }

  void changeMode() {
    setState(() {
      creating = !creating;
      error = null;
      notice = null;
      password.clear();
      confirmPassword.clear();
    });
  }

  Future<void> submit() async {
    if (busy || form.currentState?.validate() != true) return;
    FocusScope.of(context).unfocus();
    setState(() {
      busy = true;
      error = null;
      notice = null;
    });
    try {
      if (creating) {
        await widget.api.registerCustomer(
          name: name.text.trim(),
          email: email.text.trim(),
          password: password.text,
        );
        if (!mounted) return;
        setState(() {
          creating = false;
          password.clear();
          confirmPassword.clear();
          notice = 'Account created. Sign in with your new MN Mart account.';
        });
      } else {
        await widget.api.signIn(email.text.trim(), password.text);
        if (!mounted) return;
        TextInput.finishAutofillContext();
        final onSignedIn = widget.onSignedIn;
        if (onSignedIn != null) {
          onSignedIn();
        } else {
          Navigator.of(context).pop(true);
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => error = e is ApiError ? e.message : 'Please try again.');
      }
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return PopScope(
      canPop: !busy,
      child: Scaffold(
        body: Stack(
          fit: StackFit.expand,
          children: [
            Image.asset(
              'assets/images/login-background.jpg',
              fit: BoxFit.cover,
              excludeFromSemantics: true,
            ),
            const ColoredBox(color: Color(0x550d2521)),
            SafeArea(
              child: Column(
                children: [
                  if (widget.onSignedIn == null)
                    const Align(
                      alignment: Alignment.centerLeft,
                      child: BackButton(color: Colors.white),
                    ),
                  Expanded(
                    child: Center(
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.all(20),
                        child: ConstrainedBox(
                          constraints: const BoxConstraints(maxWidth: 440),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(24),
                            child: BackdropFilter(
                              filter: ImageFilter.blur(sigmaX: 14, sigmaY: 14),
                              child: Container(
                                padding: const EdgeInsets.all(22),
                                decoration: BoxDecoration(
                                  color: const Color(0xe6fffbf3),
                                  borderRadius: BorderRadius.circular(24),
                                  border: Border.all(color: Colors.white70),
                                ),
                                child: AutofillGroup(
                                  child: Form(
                                    key: form,
                                    child: Column(
                                      mainAxisSize: MainAxisSize.min,
                                      crossAxisAlignment: CrossAxisAlignment.stretch,
                                      children: [
                                        Align(
                                          child: Image.asset(
                                            'assets/images/mn-mart-logo.png',
                                            width: 64,
                                            height: 64,
                                            semanticLabel: 'MN Mart',
                                          ),
                                        ),
                                        const SizedBox(height: 10),
                                        Text(
                                          creating ? 'Create your account' : 'Sign in to MN Mart Hotels',
                                          style: theme.textTheme.headlineSmall,
                                          textAlign: TextAlign.center,
                                        ),
                                        const SizedBox(height: 8),
                                        Text(
                                          creating
                                              ? 'Your MN Mart account works here and in the marketplace.'
                                              : 'Use your MN Mart customer account.',
                                          textAlign: TextAlign.center,
                                        ),
                                        const SizedBox(height: 18),
                                        if (creating) ...[
                                          TextFormField(
                                            controller: name,
                                            enabled: !busy,
                                            textCapitalization: TextCapitalization.words,
                                            autofillHints: const [AutofillHints.name],
                                            decoration: const InputDecoration(labelText: 'Full name'),
                                            validator: (value) => (value ?? '').trim().isEmpty
                                                ? 'Enter your name.' : null,
                                          ),
                                          const SizedBox(height: 12),
                                        ],
                                        TextFormField(
                                          controller: email,
                                          enabled: !busy,
                                          keyboardType: TextInputType.emailAddress,
                                          autofillHints: const [AutofillHints.email],
                                          decoration: const InputDecoration(labelText: 'Email'),
                                          validator: (value) => RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')
                                              .hasMatch((value ?? '').trim())
                                              ? null : 'Enter a valid email.',
                                        ),
                                        const SizedBox(height: 12),
                                        TextFormField(
                                          controller: password,
                                          enabled: !busy,
                                          obscureText: true,
                                          autofillHints: [
                                            creating ? AutofillHints.newPassword : AutofillHints.password,
                                          ],
                                          decoration: const InputDecoration(labelText: 'Password'),
                                          validator: (value) {
                                            if (value == null || value.isEmpty) return 'Enter your password.';
                                            if (creating && value.length < 8) return 'Use at least 8 characters.';
                                            return null;
                                          },
                                        ),
                                        if (creating) ...[
                                          const SizedBox(height: 12),
                                          TextFormField(
                                            controller: confirmPassword,
                                            enabled: !busy,
                                            obscureText: true,
                                            decoration: const InputDecoration(labelText: 'Confirm password'),
                                            validator: (value) => value != password.text
                                                ? 'Passwords do not match.' : null,
                                          ),
                                        ],
                                        if (error case final message?)
                                          Padding(
                                            padding: const EdgeInsets.only(top: 10),
                                            child: Text(message, style: TextStyle(color: theme.colorScheme.error)),
                                          ),
                                        if (notice case final message?)
                                          Padding(
                                            padding: const EdgeInsets.only(top: 10),
                                            child: Text(message),
                                          ),
                                        const SizedBox(height: 14),
                                        FilledButton(
                                          onPressed: busy ? null : submit,
                                          child: Text(busy ? 'Please wait…' : creating ? 'Create account' : 'Sign in'),
                                        ),
                                        TextButton(
                                          onPressed: busy ? null : changeMode,
                                          child: Text(creating ? 'Back to sign in' : 'Create an MN Mart account'),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
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
