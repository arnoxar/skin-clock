// SPDX-License-Identifier: GPL-3.0-or-later
// Generated with AI for personal use.
// Do NOT upload to extensions.gnome.org (EGO) unless you understand JavaScript
// and can maintain this code.

import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import {SKIN_IDS, SKINS} from './skins.js';

export default class SkinClockPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        window._settings = settings;
        window.set_default_size(560, 620);

        const page = new Adw.PreferencesPage({
            title: _('Skin Clock'),
            icon_name: 'preferences-system-time-symbolic',
        });
        window.add(page);

        const appearance = new Adw.PreferencesGroup({
            title: _('Appearance'),
            description: _('Choose a skin and adjust the clock.'),
        });
        page.add(appearance);

        const skinModel = Gtk.StringList.new(SKIN_IDS.map(id => SKINS[id].label));
        const skinRow = new Adw.ComboRow({
            title: _('Skin'),
            model: skinModel,
        });
        const currentSkin = settings.get_string('skin');
        skinRow.selected = Math.max(0, SKIN_IDS.indexOf(currentSkin));
        skinRow.connect('notify::selected', row => {
            settings.set_string('skin', SKIN_IDS[row.selected]);
        });
        appearance.add(skinRow);

        appearance.add(this._scaleRow(
            _('Size'),
            _('Diameter in pixels. You can also resize with the mouse wheel over the clock.'),
            120, 800, 10,
            settings.get_int('size'),
            value => settings.set_int('size', Math.round(value)),
            value => `${Math.round(value)} px`
        ));

        appearance.add(this._scaleRow(
            _('Opacity'),
            _('Opacity of the whole clock.'),
            0.2, 1.0, 0.05,
            settings.get_double('opacity'),
            value => settings.set_double('opacity', value),
            value => `${Math.round(value * 100)} %`
        ));

        const secondsRow = new Adw.SwitchRow({
            title: _('Second hand'),
            subtitle: _('Show the second hand.'),
        });
        settings.bind('show-seconds', secondsRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        appearance.add(secondsRow);

        const smoothRow = new Adw.SwitchRow({
            title: _('Smooth second hand'),
            subtitle: _('Animate the second hand smoothly instead of ticking once per second.'),
        });
        settings.bind('smooth-seconds', smoothRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        appearance.add(smoothRow);

        const usage = new Adw.PreferencesGroup({
            title: _('Usage'),
        });
        page.add(usage);

        const showRow = new Adw.SwitchRow({
            title: _('Show clock'),
            subtitle: _('The panel icon stays available so you can show the clock again.'),
        });
        settings.bind('visible', showRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        usage.add(showRow);

        usage.add(new Adw.ActionRow({
            title: _('Move'),
            subtitle: _('Drag the clock with the left mouse button.'),
        }));

        usage.add(new Adw.ActionRow({
            title: _('Open preferences quickly'),
            subtitle: _('Right-click the clock.'),
        }));
    }

    _scaleRow(title, subtitle, min, max, step, initial, onChange, formatValue) {
        const row = new Adw.ActionRow({title, subtitle});
        const box = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 10,
            valign: Gtk.Align.CENTER,
        });
        const valueLabel = new Gtk.Label({
            label: formatValue(initial),
            width_chars: 7,
            xalign: 1,
        });
        const adjustment = new Gtk.Adjustment({
            lower: min,
            upper: max,
            step_increment: step,
            page_increment: step * 5,
            value: initial,
        });
        const scale = new Gtk.Scale({
            orientation: Gtk.Orientation.HORIZONTAL,
            adjustment,
            draw_value: false,
            width_request: 220,
            hexpand: true,
        });
        adjustment.connect('value-changed', () => {
            const value = adjustment.value;
            valueLabel.label = formatValue(value);
            onChange(value);
        });
        box.append(scale);
        box.append(valueLabel);
        row.add_suffix(box);
        row.activatable_widget = scale;
        return row;
    }
}
