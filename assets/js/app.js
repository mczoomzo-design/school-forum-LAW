/* ==========================================================
   EduForum — API client + ตัวช่วยที่ใช้ร่วมกันทุกหน้า
   ========================================================== */
(function () {
  'use strict';

  var CFG = window.EDUFORUM_CONFIG || {};
  var API = CFG.API_URL || '';

  // ---------- localStorage ----------
  var Store = {
    get: function (k, d) {
      try { var v = localStorage.getItem('eduforum:' + k); return v === null ? d : JSON.parse(v); }
      catch (e) { return d; }
    },
    set: function (k, v) { try { localStorage.setItem('eduforum:' + k, JSON.stringify(v)); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem('eduforum:' + k); } catch (e) {} }
  };

  // กุญแจประจำเครื่อง ใช้กันกดถูกใจซ้ำ/นับวิวซ้ำ ของผู้เยี่ยมชม
  var voterKey = Store.get('voterKey', null);
  if (!voterKey) {
    voterKey = 'v' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    Store.set('voterKey', voterKey);
  }

  // ---------- ตัวเรียก API ----------
  function qs(params) {
    return Object.keys(params)
      .filter(function (k) { return params[k] !== undefined && params[k] !== null && params[k] !== ''; })
      .map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); })
      .join('&');
  }

  function assertConfigured() {
    if (!API || API.indexOf('script.google.com') === -1) {
      throw new Error('ยังไม่ได้ตั้งค่า API_URL ในไฟล์ assets/js/config.js');
    }
  }

  /** อ่านข้อมูล (GET) */
  function get(action, params) {
    assertConfigured();
    var p = params || {};
    p.action = action;
    p.voterKey = voterKey;
    if (Store.get('token')) p.token = Store.get('token');
    return fetch(API + '?' + qs(p), { method: 'GET' }).then(readJson);
  }

  /** เขียนข้อมูล (POST)
   *  ใช้ text/plain เพื่อเลี่ยง CORS preflight ที่ Apps Script ตอบไม่ได้ */
  function post(action, params) {
    assertConfigured();
    var p = params || {};
    p.action = action;
    p.voterKey = voterKey;
    if (Store.get('token')) p.token = Store.get('token');
    return fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(p)
    }).then(readJson);
  }

  function readJson(res) {
    return res.text().then(function (txt) {
      try { return JSON.parse(txt); }
      catch (e) { throw new Error('เซิร์ฟเวอร์ตอบกลับผิดรูปแบบ ตรวจสอบว่าเผยแพร่ Web App เป็น "Anyone" แล้ว'); }
    });
  }

  // ---------- สถานะผู้ใช้ ----------
  var Auth = {
    user: Store.get('user', null),
    token: Store.get('token', null),
    isLoggedIn: function () { return !!Store.get('token'); },
    isAdmin: function () { var u = Store.get('user'); return !!u && u.role === 'admin'; },
    save: function (token, user) { Store.set('token', token); Store.set('user', user); Auth.token = token; Auth.user = user; },
    clear: function () { Store.del('token'); Store.del('user'); Auth.token = null; Auth.user = null; },
    logout: function () {
      var t = Store.get('token');
      Auth.clear();
      if (t) post('logout', { token: t }).catch(function () {});
      location.href = 'index.html';
    }
  };

  // ---------- ตัวช่วยแสดงผล ----------
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /** แปลงข้อความธรรมดาเป็น HTML ปลอดภัย: ขึ้นบรรทัดใหม่ + ลิงก์ */
  function textToHtml(s) {
    var out = String(s == null ? '' : s);
    // ข้อความจากเซิร์ฟเวอร์ถูก escape ไว้แล้ว จึงแปลงเฉพาะลิงก์กับบรรทัด
    out = out.replace(/(https?:\/\/[^\s<]+)/g, function (m) {
      return '<a href="' + m + '" target="_blank" rel="noopener noreferrer" class="text-secondary underline break-all">' + m + '</a>';
    });
    return out.replace(/\n/g, '<br>');
  }

  function timeAgo(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return '-';
    var sec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (sec < 60) return 'เมื่อสักครู่';
    if (sec < 3600) return Math.floor(sec / 60) + ' นาทีที่แล้ว';
    if (sec < 86400) return Math.floor(sec / 3600) + ' ชั่วโมงที่แล้ว';
    if (sec < 604800) return Math.floor(sec / 86400) + ' วันที่แล้ว';
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function initials(name) {
    var n = String(name || '?').trim();
    return n.slice(0, 1).toUpperCase();
  }

  function avatarHtml(name, isGuest, size) {
    var cls = size === 'lg' ? 'size-12 text-body-lg' : 'size-9 text-label-md';
    var bg = isGuest ? 'bg-surface-container-highest text-on-surface-variant' : 'bg-primary-container text-on-primary';
    return '<div class="' + cls + ' ' + bg + ' rounded-full flex items-center justify-center font-display font-bold shrink-0">' + esc(initials(name)) + '</div>';
  }

  function badge(text, color) {
    var c = color || '#444650';
    return '<span class="px-2 py-0.5 rounded-lg text-label-sm font-medium" style="background:' + c + '1a;color:' + c + '">' + esc(text) + '</span>';
  }

  function toast(msg, type) {
    var box = document.getElementById('toast');
    if (!box) {
      box = document.createElement('div');
      box.id = 'toast';
      box.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center';
      document.body.appendChild(box);
    }
    var color = type === 'error' ? 'bg-error text-on-error' : (type === 'warn' ? 'bg-warning text-white' : 'bg-inverse-surface text-inverse-on-surface');
    var el = document.createElement('div');
    el.className = color + ' px-4 py-3 rounded-lg text-label-md shadow-hover max-w-sm text-center';
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(function () { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; }, 3000);
    setTimeout(function () { el.remove(); }, 3400);
  }

  function param(name) {
    return new URLSearchParams(location.search).get(name) || '';
  }

  // ---------- แถบเมนูบนสุด (ใช้ร่วมทุกหน้า) ----------
  function renderHeader(active) {
    var el = document.getElementById('site-header');
    if (!el) return;
    var u = Auth.user;
    var right = u
      ? '<div class="flex items-center gap-3">' +
          (Auth.isAdmin() ? '<a href="admin.html" class="hidden sm:inline text-label-md text-inverse-primary hover:text-white">แผงผู้ดูแล</a>' : '') +
          '<div class="flex items-center gap-2">' + avatarHtml(u.displayName, false) +
          '<span class="hidden sm:inline text-label-md text-white">' + esc(u.displayName) + '</span></div>' +
          '<button id="btn-logout" class="text-label-md text-inverse-primary hover:text-white">ออกจากระบบ</button>' +
        '</div>'
      : '<a href="login.html" class="bg-secondary text-on-secondary px-4 py-2 rounded-lg text-label-md hover:opacity-90">เข้าสู่ระบบ (Login)</a>';

    var nav = [
      { href: 'index.html', label: 'เรียกดู (Browse)', key: 'browse' },
      { href: 'index.html?sort=trending', label: 'กำลังมาแรง (Trending)', key: 'trending' },
      { href: 'index.html?sort=latest', label: 'ล่าสุด (Latest)', key: 'latest' }
    ].map(function (n) {
      var on = n.key === active ? 'text-white border-b-2 border-secondary-fixed' : 'text-inverse-primary hover:text-white border-b-2 border-transparent';
      return '<a href="' + n.href + '" class="' + on + ' pb-1 text-label-md transition">' + n.label + '</a>';
    }).join('');

    el.innerHTML =
      '<header class="bg-primary text-on-primary sticky top-0 z-40">' +
        '<div class="max-w-container mx-auto px-5 h-16 flex items-center justify-between gap-4">' +
          '<a href="index.html" class="flex items-center gap-2 shrink-0">' +
            '<span class="size-8 rounded bg-secondary flex items-center justify-center font-display font-bold text-on-secondary">E</span>' +
            '<span class="font-display text-title-lg text-white">' + esc(CFG.SITE_NAME || 'EduForum') + '</span>' +
          '</a>' +
          '<nav class="hidden md:flex items-center gap-6">' + nav + '</nav>' +
          right +
        '</div>' +
      '</header>';

    var lo = document.getElementById('btn-logout');
    if (lo) lo.addEventListener('click', Auth.logout);
  }

  function renderFooter() {
    var el = document.getElementById('site-footer');
    if (!el) return;
    el.innerHTML =
      '<footer class="border-t border-outline-variant mt-xl bg-surface-container-lowest">' +
        '<div class="max-w-container mx-auto px-5 py-lg flex flex-col sm:flex-row items-center justify-between gap-3 text-label-sm text-on-surface-variant">' +
          '<span>' + esc(CFG.SITE_NAME || 'EduForum') + ' — ' + esc(CFG.SCHOOL_NAME || '') + '</span>' +
          '<span class="flex gap-4"><a href="#" class="hover:text-primary">ช่วยเหลือ (Help)</a><a href="#" class="hover:text-primary">ติดต่อเรา (Contact Us)</a></span>' +
        '</div>' +
      '</footer>';
  }

  // ---------- export ----------
  window.EF = {
    api: { get: get, post: post },
    Auth: Auth, Store: Store, voterKey: voterKey,
    esc: esc, textToHtml: textToHtml, timeAgo: timeAgo,
    avatarHtml: avatarHtml, badge: badge, toast: toast, param: param,
    renderHeader: renderHeader, renderFooter: renderFooter
  };
})();
