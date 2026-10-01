// SPDX-License-Identifier: GPL-3.0-or-later
// Generated with AI for personal use.
// Do NOT upload to extensions.gnome.org (EGO) unless you understand JavaScript
// and can maintain this code.

import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import St from 'gi://St';

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import {SKINS} from './skins.js';

function hexToRgb(hex) {
    const value = Number.parseInt(hex.replace('#', ''), 16);
    return [
        ((value >> 16) & 0xff) / 255,
        ((value >> 8) & 0xff) / 255,
        (value & 0xff) / 255,
    ];
}

function setColor(cr, hex, alpha = 1) {
    const [r, g, b] = hexToRgb(hex);
    cr.setSourceRGBA(r, g, b, alpha);
}

const ClockActor = GObject.registerClass(class ClockActor extends St.DrawingArea {
    _init(extension, settings) {
        super._init({
            reactive: true,
            can_focus: true,
            track_hover: true,
        });

        this._extension = extension;
        this._settings = settings;
        this._dragging = false;
        this._dragStartX = 0;
        this._dragStartY = 0;
        this._actorStartX = 0;
        this._actorStartY = 0;
        this._signalIds = [];
        this._settingsIds = [];
        this._timerId = 0;

        this._signalIds.push(this.connect('repaint', area => this._draw(area)));
        this._signalIds.push(this.connect('button-press-event', (_actor, event) => this._onButtonPress(event)));
        this._signalIds.push(this.connect('button-release-event', (_actor, event) => this._onButtonRelease(event)));
        this._signalIds.push(this.connect('motion-event', (_actor, event) => this._onMotion(event)));
        this._signalIds.push(this.connect('scroll-event', (_actor, event) => this._onScroll(event)));

        for (const key of ['skin', 'size', 'opacity', 'show-seconds', 'smooth-seconds', 'visible']) {
            this._settingsIds.push(this._settings.connect(`changed::${key}`, () => this._applySettings()));
        }

        this._applySettings();
    }

    destroyClock() {
        if (this._timerId) {
            GLib.Source.remove(this._timerId);
            this._timerId = 0;
        }

        for (const id of this._settingsIds)
            this._settings.disconnect(id);
        this._settingsIds = [];

        for (const id of this._signalIds)
            this.disconnect(id);
        this._signalIds = [];

        this.destroy();
    }

    _applySettings() {
        const size = this._settings.get_int('size');
        this.set_size(size, size);
        this.opacity = Math.round(this._settings.get_double('opacity') * 255);
        this.visible = this._settings.get_boolean('visible');
        this.set_position(this._settings.get_int('x'), this._settings.get_int('y'));
        this._restartTimer();
        this.queue_repaint();
    }

    _restartTimer() {
        if (this._timerId) {
            GLib.Source.remove(this._timerId);
            this._timerId = 0;
        }

        const interval = this._settings.get_boolean('smooth-seconds') ? 50 : 250;
        this._timerId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, interval, () => {
            this.queue_repaint();
            return GLib.SOURCE_CONTINUE;
        });
    }

    _onButtonPress(event) {
        const button = event.get_button();

        if (button === Clutter.BUTTON_SECONDARY) {
            this._extension.openPreferences();
            return Clutter.EVENT_STOP;
        }

        if (button !== 1)
            return Clutter.EVENT_PROPAGATE;

        const [stageX, stageY] = event.get_coords();
        this._dragging = true;
        this._dragStartX = stageX;
        this._dragStartY = stageY;
        this._actorStartX = this.x;
        this._actorStartY = this.y;
        return Clutter.EVENT_STOP;
    }

    _onButtonRelease(event) {
        if (event.get_button() !== 1 || !this._dragging)
            return Clutter.EVENT_PROPAGATE;

        this._dragging = false;
        this._savePosition();
        return Clutter.EVENT_STOP;
    }

    _onMotion(event) {
        if (!this._dragging)
            return Clutter.EVENT_PROPAGATE;

        const [stageX, stageY] = event.get_coords();
        this.set_position(
            Math.round(this._actorStartX + stageX - this._dragStartX),
            Math.round(this._actorStartY + stageY - this._dragStartY)
        );
        return Clutter.EVENT_STOP;
    }

    _onScroll(event) {
        const direction = event.get_scroll_direction();
        let delta = 0;
        if (direction === Clutter.ScrollDirection.UP)
            delta = 20;
        else if (direction === Clutter.ScrollDirection.DOWN)
            delta = -20;
        else
            return Clutter.EVENT_PROPAGATE;

        const next = Math.max(120, Math.min(800, this._settings.get_int('size') + delta));
        this._settings.set_int('size', next);
        return Clutter.EVENT_STOP;
    }

    _savePosition() {
        this._settings.set_int('x', Math.round(this.x));
        this._settings.set_int('y', Math.round(this.y));
    }

    _draw(area) {
        const cr = area.get_context();
        const [width, height] = area.get_surface_size();
        const skinId = this._settings.get_string('skin');
        const skin = SKINS[skinId] ?? SKINS.classic;
        const radius = Math.min(width, height) * 0.47;
        const cx = width / 2;
        const cy = height / 2;

        setColor(cr, skin.face, skin.faceAlpha);
        cr.arc(cx, cy, radius, 0, Math.PI * 2);
        cr.fill();

        setColor(cr, skin.rim, 0.95);
        cr.setLineWidth(Math.max(2, radius * 0.018));
        cr.arc(cx, cy, radius, 0, Math.PI * 2);
        cr.stroke();

        for (let i = 0; i < 60; i++) {
            const major = i % 5 === 0;
            const angle = i * Math.PI / 30 - Math.PI / 2;
            const outer = radius * 0.92;
            const inner = radius * (major ? 0.78 : 0.86);
            setColor(cr, skin.tick, major ? 0.95 : 0.55);
            cr.setLineWidth(major ? Math.max(2, radius * 0.018) : Math.max(1, radius * 0.006));
            cr.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
            cr.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
            cr.stroke();
        }

        if (skin.numbers === 'arabic') {
            setColor(cr, skin.text, 0.95);
            cr.selectFontFace('Sans', 0, 1);
            cr.setFontSize(radius * 0.15);
            for (let n = 1; n <= 12; n++) {
                const angle = n * Math.PI / 6 - Math.PI / 2;
                const label = `${n}`;
                const ext = cr.textExtents(label);
                const tx = cx + Math.cos(angle) * radius * 0.66 - ext.width / 2 - ext.xBearing;
                const ty = cy + Math.sin(angle) * radius * 0.66 - ext.height / 2 - ext.yBearing;
                cr.moveTo(tx, ty);
                cr.showText(label);
            }
        }

        const now = new Date();
        const milliseconds = this._settings.get_boolean('smooth-seconds') ? now.getMilliseconds() : 0;
        const seconds = now.getSeconds() + milliseconds / 1000;
        const minutes = now.getMinutes() + seconds / 60;
        const hours = (now.getHours() % 12) + minutes / 60;

        this._drawHand(cr, cx, cy, hours * Math.PI / 6 - Math.PI / 2,
            radius * 0.48, radius * 0.05, skin.hour);
        this._drawHand(cr, cx, cy, minutes * Math.PI / 30 - Math.PI / 2,
            radius * 0.70, radius * 0.032, skin.minute);

        if (this._settings.get_boolean('show-seconds')) {
            this._drawHand(cr, cx, cy, seconds * Math.PI / 30 - Math.PI / 2,
                radius * 0.80, Math.max(1.5, radius * 0.012), skin.second, radius * 0.14);
        }

        setColor(cr, skin.hub, 1);
        cr.arc(cx, cy, Math.max(4, radius * 0.045), 0, Math.PI * 2);
        cr.fill();

        cr.$dispose();
    }

    _drawHand(cr, cx, cy, angle, length, width, color, tail = 0) {
        setColor(cr, color, 1);
        cr.setLineCap(1);
        cr.setLineWidth(width);
        cr.moveTo(cx - Math.cos(angle) * tail, cy - Math.sin(angle) * tail);
        cr.lineTo(cx + Math.cos(angle) * length, cy + Math.sin(angle) * length);
        cr.stroke();
    }
});

export default class SkinClockExtension extends Extension {
    enable() {
        this._settings = this.getSettings();

        this._clock = new ClockActor(this, this._settings);
        Main.layoutManager.addTopChrome(this._clock);

        this._indicator = new PanelMenu.Button(0.0, _('Skin Clock'));
        this._indicator.add_child(new St.Icon({
            icon_name: 'preferences-system-time-symbolic',
            style_class: 'system-status-icon',
        }));

        this._visibleItem = new PopupMenu.PopupSwitchMenuItem(
            _('Show clock'),
            this._settings.get_boolean('visible')
        );
        this._visibleItem.connect('toggled', (_item, state) => {
            this._settings.set_boolean('visible', state);
        });
        this._indicator.menu.addMenuItem(this._visibleItem);

        this._indicator.menu.addAction(_('Preferences'), () => this.openPreferences());
        this._indicator.menu.addAction(_('Reset position'), () => this._resetPosition());

        this._visibleChangedId = this._settings.connect('changed::visible', () => {
            this._visibleItem.setToggleState(this._settings.get_boolean('visible'));
        });

        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }

    disable() {
        if (this._visibleChangedId) {
            this._settings.disconnect(this._visibleChangedId);
            this._visibleChangedId = 0;
        }

        this._indicator?.destroy();
        this._indicator = null;
        this._visibleItem = null;

        if (this._clock) {
            Main.layoutManager.removeChrome(this._clock);
            this._clock.destroyClock();
            this._clock = null;
        }

        this._settings = null;
    }

    _resetPosition() {
        const monitor = Main.layoutManager.primaryMonitor;
        const size = this._settings.get_int('size');
        this._settings.set_int('x', Math.round(monitor.x + monitor.width - size - 40));
        this._settings.set_int('y', Math.round(monitor.y + 80));
        this._clock?.set_position(this._settings.get_int('x'), this._settings.get_int('y'));
    }
}
