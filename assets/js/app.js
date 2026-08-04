/* ==========================================================
   EduForum — แกนกลางฝั่งเบราว์เซอร์
   API, สถานะผู้ใช้, รูปโปรไฟล์, ตัวช่วยแสดงผล, ร่างอัตโนมัติ
   ========================================================== */
(function () {
  'use strict';

  var CFG = window.EDUFORUM_CONFIG || {};
  var API = CFG.API_URL || '';

  // ---------- ที่เก็บข้อมูลในเครื่อง ----------
  var Store = {
    get: function (k, d) {
      try { var v = localStorage.getItem('eduforum:' + k); return v === null ? d : JSON.parse(v); }
      catch (e) { return d; }
    },
    set: function (k, v) { try { localStorage.setItem('eduforum:' + k, JSON.stringify(v)); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem('eduforum:' + k); } catch (e) {} }
  };

  // กุญแจประจำเครื่อง กันกดถูกใจซ้ำและนับวิวซ้ำของผู้เยี่ยมชม
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

  function get(action, params) {
    assertConfigured();
    var p = params || {};
    p.action = action;
    p.voterKey = voterKey;
    if (Store.get('token')) p.token = Store.get('token');
    return fetch(API + '?' + qs(p)).then(readJson);
  }

  /** POST ใช้ text/plain เพื่อเลี่ยง CORS preflight ที่ Apps Script ตอบไม่ได้ */
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
      catch (e) { throw new Error('เซิร์ฟเวอร์ตอบกลับผิดรูปแบบ ตรวจว่าเผยแพร่ Web App เป็น Anyone แล้ว'); }
    });
  }

  // ---------- สถานะผู้ใช้ ----------
  var Auth = {
    get user() { return Store.get('user', null); },
    get token() { return Store.get('token', null); },
    isLoggedIn: function () { return !!Store.get('token'); },
    isAdmin: function () { var u = Store.get('user'); return !!u && u.role === 'admin'; },
    save: function (token, user) { Store.set('token', token); Store.set('user', user); },
    patch: function (user) { Store.set('user', user); },
    clear: function () { Store.del('token'); Store.del('user'); },
    logout: function () {
      var t = Store.get('token');
      Auth.clear();
      if (t) post('logout', { token: t }).catch(function () {});
      location.href = 'index.html';
    },
    requireLogin: function (next) {
      if (Auth.isLoggedIn()) return true;
      location.href = 'login.html?next=' + encodeURIComponent(next || location.pathname.split('/').pop());
      return false;
    }
  };

  // ---------- ตัวช่วยแสดงผล ----------
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /** ข้อความจากเซิร์ฟเวอร์ผ่านการ escape มาแล้ว ที่นี่แปลงแค่ลิงก์กับการขึ้นบรรทัด */
  function textToHtml(s) {
    return String(s == null ? '' : s)
      .replace(/(https?:\/\/[^\s<]+)/g, function (m) {
        return '<a href="' + m + '" target="_blank" rel="noopener noreferrer" class="text-secondary underline break-all">' + m + '</a>';
      })
      .replace(/\n/g, '<br>');
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

  function fullDate(iso) {
    var d = new Date(iso);
    return isNaN(d) ? '-' : d.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  // ---------- รูปโปรไฟล์ ----------
  // เก็บได้ 3 แบบ: '' (ตัวอักษรย่อ), 'p:N' (ชุดสำเร็จรูป), 'data:image/...' (รูปที่ผู้ใช้อัปเอง)
  var PRESETS = [
    ['#e6591a', '#ff8a4c'], ['#b8480d', '#e6591a'], ['#c2410c', '#f97316'],
    ['#d97706', '#fbbf24'], ['#9a3412', '#ea6a2b'], ['#be123c', '#f4708c'],
    ['#a16207', '#e0b13c'], ['#dc2626', '#f97362'], ['#7c2d12', '#c2703c'],
    ['#ea580c', '#ffb37a'], ['#92400e', '#d98a3c'], ['#b45309', '#f0a94c']
  ];

  function presetCount() { return PRESETS.length; }

  function presetGradient(i) {
    var p = PRESETS[Number(i) % PRESETS.length] || PRESETS[0];
    return 'linear-gradient(135deg,' + p[0] + ',' + p[1] + ')';
  }

  function initial(name) { return String(name || '?').trim().slice(0, 1).toUpperCase(); }

  /**
   * สร้าง HTML รูปโปรไฟล์
   * size: 'sm' 32px | 'md' 40px | 'lg' 56px | 'xl' 96px
   */
  function avatar(user, size, opts) {
    var o = opts || {};
    var px = { sm: 32, md: 40, lg: 56, xl: 96 }[size || 'md'];
    var font = { sm: 13, md: 15, lg: 20, xl: 34 }[size || 'md'];
    var name = user && (user.displayName || user.authorName || user.name) || '?';
    var src = user && (user.avatar || user.authorAvatar) || '';
    var isGuest = user && (user.isGuest === true);
    var ring = (user && (user.role === 'admin' || user.role === 'teacher' ||
                         user.authorRole === 'admin' || user.authorRole === 'teacher'))
      ? 'box-shadow:0 0 0 2px #e6591a;' : '';

    var style = 'width:' + px + 'px;height:' + px + 'px;font-size:' + font + 'px;' + ring;
    var cls = 'inline-flex items-center justify-center rounded-full shrink-0 font-display font-bold overflow-hidden select-none';

    if (String(src).indexOf('data:image') === 0) {
      return '<img src="' + src + '" alt="รูปโปรไฟล์ของ ' + esc(name) + '" class="' + cls + ' object-cover" style="' + style + '">';
    }
    if (String(src).indexOf('p:') === 0) {
      return '<span class="' + cls + ' text-white" style="' + style + 'background:' + presetGradient(src.slice(2)) + '" aria-label="' + esc(name) + '">' + esc(initial(name)) + '</span>';
    }
    var bg = isGuest ? 'background:#ecddcc;color:#5a4c3e;' : 'background:linear-gradient(135deg,#e6591a,#b8480d);color:#fff;';
    return '<span class="' + cls + '" style="' + style + bg + '" aria-label="' + esc(name) + '">' + esc(initial(name)) + '</span>';
  }

  function badge(text, color) {
    var c = color || '#444650';
    return '<span class="px-2 py-0.5 rounded-lg text-label-sm font-medium whitespace-nowrap" style="background:' + c + '1f;color:' + c + '">' + esc(text) + '</span>';
  }

  function roleBadge(role) {
    if (role === 'admin') return badge('ผู้ดูแล', '#ba1a1a');
    if (role === 'teacher') return badge('ครู', '#b8480d');
    return '';
  }

  function param(name) { return new URLSearchParams(location.search).get(name) || ''; }

  // ---------- ร่างอัตโนมัติในช่องพิมพ์ ----------
  function autosave(key, els) {
    var saved = Store.get('draft:' + key, null);
    if (saved) Object.keys(els).forEach(function (f) { if (els[f] && saved[f]) els[f].value = saved[f]; });
    var timer;
    Object.keys(els).forEach(function (f) {
      if (!els[f]) return;
      els[f].addEventListener('input', function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
          var data = {};
          Object.keys(els).forEach(function (g) { if (els[g]) data[g] = els[g].value; });
          Store.set('draft:' + key, data);
        }, 600);
      });
    });
    return {
      clear: function () { Store.del('draft:' + key); },
      hasSaved: !!saved
    };
  }

  // ---------- โหมดมืด ----------
  var Theme = {
    get: function () { return Store.get('theme', 'light'); },
    apply: function (mode) {
      document.documentElement.classList.toggle('dark', mode === 'dark');
      Store.set('theme', mode);
    },
    toggle: function () { Theme.apply(Theme.get() === 'dark' ? 'light' : 'dark'); return Theme.get(); },
    init: function () { document.documentElement.classList.toggle('dark', Store.get('theme', 'light') === 'dark'); }
  };
  Theme.init();

  window.EF = {
    api: { get: get, post: post },
    Auth: Auth, Store: Store, Theme: Theme, voterKey: voterKey,
    esc: esc, textToHtml: textToHtml, timeAgo: timeAgo, fullDate: fullDate,
    avatar: avatar, presetGradient: presetGradient, presetCount: presetCount, initial: initial,
    badge: badge, roleBadge: roleBadge, param: param, autosave: autosave
  };
})();
