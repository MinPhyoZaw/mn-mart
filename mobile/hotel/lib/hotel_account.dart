import 'dart:ui' show ImageFilter;

import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import 'api.dart';

const _green = Color(0xff164638);

class HotelAccount extends StatelessWidget {
  const HotelAccount({
    super.key,
    required this.user,
    required this.signingOut,
    required this.onSignOut,
  });

  final Json user;
  final bool signingOut;
  final VoidCallback onSignOut;

  Future<void> _open(BuildContext context, String path) async {
    try {
      if (await launchUrl(HotelApi.origin.resolve(path),
          mode: LaunchMode.externalApplication)) {
        return;
      }
    } catch (_) {
      // Report launcher failures below.
    }
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open MN Mart. Try again.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final name = (user['name'] as String? ?? '').trim();
    final email = (user['email'] as String? ?? '').trim();
    final displayName = name.isNotEmpty ? name : email;
    final initials = name.isEmpty
        ? email.characters.take(1).toString().toUpperCase()
        : name.split(RegExp(r'\s+')).take(2)
            .map((word) => word.characters.first.toUpperCase()).join();
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      children: [
        DecoratedBox(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            boxShadow: const [
              BoxShadow(color: Color(0x24907144), blurRadius: 18, offset: Offset(0, 8)),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(24),
            child: DecoratedBox(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xfffffaf2), Color(0xffebd8b8), Color(0xfffaf4eb)],
                ),
              ),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
                child: Material(
                  color: const Color(0xbafffbf4),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(24),
                    side: const BorderSide(color: Colors.white, width: 1.5),
                  ),
                  child: InkWell(
                    onTap: () => showDialog<void>(
                      context: context,
                      builder: (context) => AlertDialog(
                        title: const Text('Profile'),
                        content: SingleChildScrollView(
                          child: Text([
                            if (name.isNotEmpty) name,
                            if (email.isNotEmpty) email,
                            'Profile editing is unavailable in the hotel app.',
                          ].join('\n\n')),
                        ),
                        actions: [
                          TextButton(onPressed: () => Navigator.pop(context),
                            child: Text(MaterialLocalizations.of(context).closeButtonLabel)),
                        ],
                      ),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(children: [
                        CircleAvatar(
                          radius: 25,
                          backgroundColor: _green,
                          foregroundColor: Colors.white,
                          child: initials.isEmpty
                              ? const Icon(Icons.person_outline)
                              : Padding(
                                  padding: const EdgeInsets.all(8),
                                  child: FittedBox(child: Text(initials)),
                                ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(displayName.isEmpty ? 'Profile' : displayName,
                              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                color: _green, fontWeight: FontWeight.w700)),
                            const Text('Edit profile'),
                          ],
                        )),
                        const Icon(Icons.chevron_right),
                      ]),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 24),
        _AccountGroup(title: 'Settings', rows: [
          const ListTile(
            leading: Icon(Icons.language, color: _green),
            title: Text('Language'),
            subtitle: Text('English'),
          ),
          ListTile(
            leading: const Icon(Icons.lock_outline, color: _green),
            title: const Text('Reset password'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => _open(context, '/forgot-password'),
          ),
        ]),
        const SizedBox(height: 20),
        _AccountGroup(title: 'Help', rows: [
          ListTile(
            leading: const Icon(Icons.support_agent, color: _green),
            title: const Text('Contact support'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => _open(context, '/privacy#contact'),
          ),
          ListTile(
            leading: const Icon(Icons.privacy_tip_outlined, color: _green),
            title: const Text('Privacy policy'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => _open(context, '/privacy'),
          ),
        ]),
        const SizedBox(height: 24),
        OutlinedButton.icon(
          onPressed: signingOut ? null : onSignOut,
          icon: const Icon(Icons.logout),
          label: Text(signingOut ? 'Signing out…' : 'Sign out'),
          style: OutlinedButton.styleFrom(
            foregroundColor: const Color(0xffa52f38),
            backgroundColor: const Color(0xffffe9e7),
            side: const BorderSide(color: Color(0xffb94850)),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            minimumSize: const Size(0, 52),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          ),
        ),
      ],
    );
  }
}

class _AccountGroup extends StatelessWidget {
  const _AccountGroup({required this.title, required this.rows});

  final String title;
  final List<Widget> rows;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      Text(title, style: Theme.of(context).textTheme.titleLarge?.copyWith(
        fontWeight: FontWeight.w700)),
      const SizedBox(height: 10),
      Material(
        color: Colors.white,
        clipBehavior: Clip.antiAlias,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: Color(0xffdce3df)),
        ),
        child: Column(children: ListTile.divideTiles(
          context: context, tiles: rows,
        ).toList()),
      ),
    ],
  );
}
