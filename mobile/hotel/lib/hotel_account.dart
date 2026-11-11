import 'dart:convert';
import 'dart:ui' show ImageFilter, instantiateImageCodec;

import 'package:flutter/foundation.dart' show listEquals;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:url_launcher/url_launcher.dart';

import 'api.dart';

const _green = Color(0xff164638);

class HotelAccount extends StatelessWidget {
  const HotelAccount({
    super.key,
    required this.user,
    required this.signingOut,
    required this.onSignOut,
    required this.onSavePhoto,
  });

  final Json user;
  final bool signingOut;
  final VoidCallback onSignOut;
  final Future<void> Function(String) onSavePhoto;

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
                    onTap: signingOut ? null : () => showDialog<void>(
                      context: context,
                      builder: (_) => _ProfilePhotoDialog(
                        name: displayName,
                        email: email,
                        initials: initials,
                        currentPhoto: user['profileImage'] as String?,
                        onSave: onSavePhoto,
                      ),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(children: [
                        _ProfileAvatar(
                          initials: initials,
                          photo: user['profileImage'] as String?,
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
            onTap: () => _showSupportContacts(context),
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


const _officePhone = '09793927883';
const _internationalPhone = '+959793927883';

void _showSupportContacts(BuildContext context) {
  showModalBottomSheet<void>(
    context: context,
    backgroundColor: const Color(0xfffffaf2),
    showDragHandle: true,
    useSafeArea: true,
    isScrollControlled: true,
    builder: (context) => SafeArea(
      top: false,
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
        child: _AccountGroup(title: 'Contact support', rows: [
          _SupportContact(
            label: 'Viber',
            value: _officePhone,
            icon: Icons.phone_in_talk_outlined,
            color: const Color(0xff6650a4),
            destination: Uri(
              scheme: 'viber',
              host: 'chat',
              queryParameters: {'number': _internationalPhone},
            ),
          ),
          _SupportContact(
            label: 'Office phone',
            value: _officePhone,
            icon: Icons.call_outlined,
            color: _green,
            destination: Uri(scheme: 'tel', path: _internationalPhone),
          ),
          _SupportContact(
            label: 'Gmail',
            value: 'mnmart694@gmail.com',
            icon: Icons.mail_outline,
            color: const Color(0xffb63b32),
            destination: Uri(scheme: 'mailto', path: 'mnmart694@gmail.com'),
          ),
          _SupportContact(
            label: 'TikTok',
            value: '@m.n.mart',
            icon: Icons.tiktok,
            color: const Color(0xff202124),
            destination: Uri.https('www.tiktok.com', '/@m.n.mart'),
          ),
        ]),
      ),
    ),
  );
}

class _SupportContact extends StatelessWidget {
  const _SupportContact({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
    required this.destination,
  });

  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final Uri destination;

  void _message(BuildContext context, String message) {
    if (!context.mounted) return;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }

  Future<void> _launch(BuildContext context) async {
    try {
      if (await launchUrl(destination, mode: LaunchMode.externalApplication)) {
        return;
      }
    } catch (_) {
      // The contact remains available to copy if the device cannot open it.
    }
    _message(context, 'Could not open $label. You can copy the contact details.');
  }

  Future<void> _copy(BuildContext context) async {
    try {
      await Clipboard.setData(ClipboardData(text: value));
      _message(context, '$label contact copied.');
    } catch (_) {
      _message(context, 'Could not copy the $label contact.');
    }
  }

  @override
  Widget build(BuildContext context) => ListTile(
    leading: Icon(icon, color: color),
    title: Text(label),
    subtitle: Text(value),
    onTap: () => _launch(context),
    trailing: IconButton(
      tooltip: 'Copy $label contact',
      icon: const Icon(Icons.copy_outlined),
      onPressed: () => _copy(context),
    ),
  );
}


class _ProfileAvatar extends StatelessWidget {
  const _ProfileAvatar({required this.initials, this.photo, this.radius = 25});

  final String initials;
  final String? photo;
  final double radius;

  ImageProvider<Object>? get image {
    final uri = Uri.tryParse(photo ?? '');
    if (uri == null) return null;
    if (uri.scheme == 'https' && uri.host.isNotEmpty) {
      return NetworkImage(uri.toString());
    }
    if (uri.scheme == 'data') {
      try {
        final data = uri.data;
        if (data != null && data.mimeType.startsWith('image/')) {
          return MemoryImage(data.contentAsBytes());
        }
      } on FormatException {
        return null;
      }
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final provider = image;
    return CircleAvatar(
      radius: radius,
      backgroundColor: _green,
      foregroundColor: Colors.white,
      foregroundImage: provider,
      onForegroundImageError: provider == null ? null : (_, _) {},
      child: initials.isEmpty
          ? const Icon(Icons.person_outline)
          : Padding(
              padding: const EdgeInsets.all(8),
              child: FittedBox(child: Text(initials)),
            ),
    );
  }
}

class _ProfilePhotoDialog extends StatefulWidget {
  const _ProfilePhotoDialog({
    required this.name,
    required this.email,
    required this.initials,
    required this.currentPhoto,
    required this.onSave,
  });

  final String name;
  final String email;
  final String initials;
  final String? currentPhoto;
  final Future<void> Function(String) onSave;

  @override
  State<_ProfilePhotoDialog> createState() => _ProfilePhotoDialogState();
}

class _ProfilePhotoDialogState extends State<_ProfilePhotoDialog> {
  String? selectedPhoto;
  String? error;
  bool busy = false;

  Future<void> choosePhoto() async {
    setState(() { busy = true; error = null; });
    try {
      final file = await ImagePicker().pickImage(
        source: ImageSource.gallery,
        maxWidth: 512,
        maxHeight: 512,
        imageQuality: 85,
      );
      if (file == null || !mounted) return;
      if (await file.length() > 1024 * 1024) {
        throw const ApiError('Choose a photo under 1 MB.');
      }
      final bytes = await file.readAsBytes();
      final jpeg = bytes.length >= 3 && bytes[0] == 255 &&
          bytes[1] == 216 && bytes[2] == 255;
      const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];
      final png = listEquals(bytes.take(pngSignature.length).toList(), pngSignature);
      if (!jpeg && !png) throw const ApiError('Choose a JPG or PNG photo.');
      final codec = await instantiateImageCodec(bytes, targetWidth: 128);
      try {
        final frame = await codec.getNextFrame();
        frame.image.dispose();
      } finally {
        codec.dispose();
      }
      if (mounted) {
        setState(() => selectedPhoto =
            'data:image/${jpeg ? 'jpeg' : 'png'};base64,${base64Encode(bytes)}');
      }
    } catch (e) {
      if (mounted) {
        setState(() => error = e is ApiError ? e.message : 'Could not open your photo.');
      }
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<void> save() async {
    final photo = selectedPhoto;
    if (busy || photo == null) return;
    setState(() { busy = true; error = null; });
    try {
      await widget.onSave(photo);
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      if (mounted) {
        setState(() => error = e is ApiError ? e.message : 'Could not save your photo.');
      }
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => PopScope(
    canPop: !busy,
    child: AlertDialog(
      title: const Text('Edit profile'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _ProfileAvatar(
              initials: widget.initials,
              photo: selectedPhoto ?? widget.currentPhoto,
              radius: 42,
            ),
            const SizedBox(height: 12),
            Text(widget.name, textAlign: TextAlign.center),
            if (widget.email.isNotEmpty && widget.email != widget.name)
              Text(widget.email, textAlign: TextAlign.center),
            TextButton.icon(
              onPressed: busy ? null : choosePhoto,
              icon: const Icon(Icons.photo_library_outlined),
              label: const Text('Change photo'),
            ),
            if (error case final message?)
              Text(message, style: TextStyle(color: Theme.of(context).colorScheme.error)),
            if (busy) const LinearProgressIndicator(),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: busy ? null : () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: busy || selectedPhoto == null ? null : save,
          child: const Text('Save photo'),
        ),
      ],
    ),
  );
}
