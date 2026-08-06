/* ==========================================================
   EduForum — ส่วนประกอบหน้าจอที่ใช้ร่วมกัน
   หัวเว็บ, แจ้งเตือน, กล่องข้อความลอย, โมดัล, การ์ดกระทู้
   ========================================================== */
(function () {
  'use strict';

  var EF = window.EF;

  // ---------- กล่องข้อความลอย ----------
  function toast(msg, type) {
    var box = document.getElementById('toast-stack');
    if (!box) {
      box = document.createElement('div');
      box.id = 'toast-stack';
      box.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none';
      box.setAttribute('role', 'status');
      box.setAttribute('aria-live', 'polite');
      document.body.appendChild(box);
    }
    var tone = type === 'error' ? 'bg-error text-on-error'
      : type === 'warn' ? 'bg-warning text-white'
      : type === 'success' ? 'bg-secondary text-on-secondary'
      : 'bg-inverse-surface text-inverse-on-surface';

    var el = document.createElement('div');
    el.className = tone + ' toast-in px-4 py-3 rounded-lg text-label-md shadow-hover max-w-sm text-center';
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(function () { el.className = el.className.replace('toast-in', 'toast-out'); }, 3200);
    setTimeout(function () { el.remove(); }, 3600);
  }

  // ---------- โมดัล ----------
  var lastFocus = null;

  function modal(opts) {
    closeModal();
    lastFocus = document.activeElement;

    var wrap = document.createElement('div');
    wrap.id = 'ef-modal';
    wrap.className = 'fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4';
    wrap.innerHTML =
      '<div class="modal-backdrop absolute inset-0 bg-black/40" data-close></div>' +
      '<div class="modal-panel glass-strong relative w-full max-w-lg rounded-2xl p-lg max-h-[85vh] overflow-y-auto"' +
      ' role="dialog" aria-modal="true" aria-label="' + EF.esc(opts.title || 'หน้าต่าง') + '">' +
        '<div class="flex items-start justify-between gap-3 mb-md">' +
          '<h2 class="font-display text-title-lg text-on-surface">' + EF.esc(opts.title || '') + '</h2>' +
          '<button data-close class="btn size-11 -mr-2 -mt-2 rounded-lg text-on-surface-variant hover:bg-surface-container" aria-label="ปิดหน้าต่าง">' +
            '<span class="material-symbols-outlined">close</span></button>' +
        '</div>' +
        '<div id="ef-modal-body">' + (opts.body || '') + '</div>' +
      '</div>';
    document.body.appendChild(wrap);
    document.body.style.overflow = 'hidden';

    wrap.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) closeModal(); });
    document.addEventListener('keydown', escClose);

    var focusable = wrap.querySelector('input, textarea, select, button:not([data-close])');
    if (focusable) focusable.focus();
    if (opts.onOpen) opts.onOpen(wrap);
    return wrap;
  }

  function escClose(e) { if (e.key === 'Escape') closeModal(); }

  function closeModal() {
    var m = document.getElementById('ef-modal');
    if (!m) return;
    m.remove();
    document.body.style.overflow = '';
    document.removeEventListener('keydown', escClose);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  // ---------- การ์ดโผล่ทีละใบ ----------
  var observer = null;
  function reveal(root) {
    var items = (root || document).querySelectorAll('.reveal:not(.is-visible)');
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    if (!observer) {
      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var i = Number(en.target.dataset.revealIndex || 0);
          en.target.style.transitionDelay = Math.min(i, 8) * 40 + 'ms';
          en.target.classList.add('is-visible');
          observer.unobserve(en.target);
        });
      }, { rootMargin: '0px 0px -40px 0px', threshold: 0.05 });
    }
    items.forEach(function (el, i) {
      if (!el.dataset.revealIndex) el.dataset.revealIndex = i;
      observer.observe(el);
    });
  }

  // ---------- โครงร่างระหว่างโหลด ----------
  function skeletonList(n) {
    var out = '';
    for (var i = 0; i < (n || 3); i++) {
      out += '<div class="bg-surface-container-lowest border border-outline-variant rounded p-md">' +
        '<div class="flex gap-3">' +
          '<div class="skeleton rounded-full" style="width:40px;height:40px"></div>' +
          '<div class="flex-1 space-y-2">' +
            '<div class="skeleton h-5 w-3/4"></div>' +
            '<div class="skeleton h-4 w-full"></div>' +
            '<div class="skeleton h-3 w-1/3"></div>' +
          '</div>' +
        '</div></div>';
    }
    return out;
  }

  // ---------- การ์ดกระทู้ ----------
  function threadCard(t, cats) {
    var cat = cats && cats[t.categoryId];
    var author = t.authorUsername
      ? '<a href="profile.html?u=' + encodeURIComponent(t.authorUsername) + '" class="hover:text-secondary hover:underline">' + EF.esc(t.authorName) + '</a>'
      : EF.esc(t.authorName) + (t.isGuest ? ' · ผู้เยี่ยมชม' : '');

    return '<article class="thread-card reveal bg-surface-container-lowest border border-outline-variant rounded p-md pl-5">' +
      '<div class="flex gap-3">' +
        EF.avatar(t, 'md') +
        '<div class="min-w-0 flex-1">' +
          '<div class="flex items-start justify-between gap-2">' +
            '<h3 class="font-display text-title-lg min-w-0">' +
              '<a href="thread.html?id=' + encodeURIComponent(t.id) + '" class="text-link hover:text-secondary break-words">' +
                (t.pinned ? '<span class="material-symbols-outlined text-[18px] align-middle text-warning mr-1" title="ปักหมุด">push_pin</span>' : '') +
                EF.esc(t.title) + '</a></h3>' +
            (cat ? EF.badge(cat.name, cat.color) : '') +
          '</div>' +
          '<p class="text-body-md text-on-surface-variant mt-1 line-clamp-2">' + EF.esc(t.excerpt) + '</p>' +
          '<div class="flex items-center gap-4 mt-2 text-label-sm text-outline flex-wrap">' +
            '<span>' + author + '</span>' +
            EF.roleBadge(t.authorRole) +
            '<span>' + EF.timeAgo(t.createdAt) + '</span>' +
            '<span class="flex items-center gap-1"><span class="material-symbols-outlined text-[16px]" aria-hidden="true">chat_bubble</span>' +
              '<span class="sr-only">ความคิดเห็น</span>' + t.replyCount + '</span>' +
            '<span class="flex items-center gap-1"><span class="material-symbols-outlined text-[16px]" aria-hidden="true">favorite</span>' +
              '<span class="sr-only">ถูกใจ</span>' + t.likeCount + '</span>' +
            '<span class="flex items-center gap-1"><span class="material-symbols-outlined text-[16px]" aria-hidden="true">visibility</span>' +
              '<span class="sr-only">เปิดอ่าน</span>' + t.views + '</span>' +
            (t.imageCount ? '<span class="flex items-center gap-1 text-secondary"><span class="material-symbols-outlined text-[16px]" aria-hidden="true">image</span>' + t.imageCount + '</span>' : '') +
          '</div>' +
        '</div>' +
      '</div></article>';
  }

  function emptyState(title, note, ctaText, ctaHref) {
    return '<div class="bg-surface-container-lowest border border-dashed border-outline-variant rounded p-xl text-center page-enter">' +
      '<p class="text-body-lg text-on-surface mb-2">' + EF.esc(title) + '</p>' +
      '<p class="text-body-md text-on-surface-variant mb-md">' + EF.esc(note) + '</p>' +
      (ctaText ? '<a href="' + ctaHref + '" class="btn inline-block px-5 py-3 rounded-lg bg-secondary text-on-secondary text-label-md">' + EF.esc(ctaText) + '</a>' : '') +
      '</div>';
  }

  // ---------- กล่องรายงาน ----------
  var REASONS = ['คำหยาบหรือดูหมิ่น', 'ก่อกวน คุกคาม กลั่นแกล้ง', 'สแปมหรือโฆษณา', 'ข้อมูลเท็จ', 'เปิดเผยข้อมูลส่วนตัวของผู้อื่น', 'เนื้อหาไม่เหมาะกับโรงเรียน', 'อื่น ๆ'];

  function reportDialog(targetType, targetId, label) {
    var typeLabel = targetType === 'user' ? 'ผู้ใช้รายนี้' : (targetType === 'reply' ? 'ความคิดเห็นนี้' : 'กระทู้นี้');
    modal({
      title: 'รายงาน' + typeLabel,
      body:
        '<p class="text-body-md text-on-surface-variant mb-md">' + EF.esc(label || '') + '</p>' +
        '<fieldset class="mb-md">' +
          '<legend class="text-label-md text-on-surface mb-2">เลือกเหตุผล</legend>' +
          '<div class="flex flex-col gap-1">' +
          REASONS.map(function (r, i) {
            return '<label class="flex items-center gap-3 px-3 py-3 rounded hover:bg-surface-container cursor-pointer">' +
              '<input type="radio" name="rp-reason" value="' + EF.esc(r) + '"' + (i === 0 ? ' checked' : '') + ' class="size-4 accent-[#006a6a]">' +
              '<span class="text-body-md">' + EF.esc(r) + '</span></label>';
          }).join('') +
          '</div>' +
        '</fieldset>' +
        '<label for="rp-detail" class="block text-label-md text-on-surface-variant mb-1">รายละเอียดเพิ่มเติม (ถ้ามี)</label>' +
        '<textarea id="rp-detail" rows="3" maxlength="300" placeholder="เล่าสิ่งที่เกิดขึ้นสั้น ๆ ช่วยให้ผู้ดูแลตัดสินใจได้เร็วขึ้น"' +
          ' class="w-full p-3 rounded border border-outline-variant bg-surface text-body-md focus:border-secondary focus:outline-none"></textarea>' +
        '<div class="flex justify-end gap-2 mt-md">' +
          '<button data-close class="btn px-5 py-3 rounded-lg text-label-md text-on-surface-variant hover:bg-surface-container">ยกเลิก</button>' +
          '<button id="rp-send" class="btn px-5 py-3 rounded-lg bg-error text-on-error text-label-md">ส่งรายงาน</button>' +
        '</div>',
      onOpen: function (wrap) {
        wrap.querySelector('#rp-send').addEventListener('click', function () {
          var btn = this;
          var reason = (wrap.querySelector('input[name="rp-reason"]:checked') || {}).value || 'อื่น ๆ';
          btn.disabled = true; btn.textContent = 'กำลังส่ง…';
          EF.api.post('report', {
            targetType: targetType, targetId: targetId,
            reason: reason, detail: wrap.querySelector('#rp-detail').value
          }).then(function (r) {
            closeModal();
            toast(r.ok ? r.message : r.error, r.ok ? 'success' : 'error');
          }).catch(function (e) {
            btn.disabled = false; btn.textContent = 'ส่งรายงาน';
            toast(e.message, 'error');
          });
        });
      }
    });
  }

  // ---------- แถบความคืบหน้าการอ่าน ----------
  function readProgress() {
    var bar = document.createElement('div');
    bar.id = 'read-progress';
    document.body.appendChild(bar);
    function update() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, window.scrollY / h) : 0) + ')';
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  // ---------- หัวเว็บ ----------
  var bootstrapCache = null;

  function renderHeader(active) {
    var el = document.getElementById('site-header');
    if (!el) return;
    var u = EF.Auth.user;
    var siteName = (window.EDUFORUM_CONFIG || {}).SITE_NAME || 'EduForum';

    var navItems = [
      { href: 'index.html', label: 'เรียกดู', key: 'browse' },
      { href: 'index.html?sort=trending', label: 'กำลังมาแรง', key: 'trending' },
      { href: 'index.html?sort=unanswered', label: 'ยังไม่มีคนตอบ', key: 'unanswered' }
    ];
    var nav = navItems.map(function (n) {
      var on = n.key === active
        ? 'text-primary border-primary'
        : 'text-on-surface-variant hover:text-primary border-transparent';
      return '<a href="' + n.href + '" class="' + on + ' border-b-2 pb-1 text-label-md transition-colors">' + n.label + '</a>';
    }).join('');

    var right = u
      ? '<div class="flex items-center gap-1 sm:gap-2">' +
          '<button id="btn-bell" class="btn relative size-11 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary/10" aria-label="การแจ้งเตือน">' +
            '<span class="material-symbols-outlined">notifications</span>' +
            '<span id="bell-dot" class="hidden absolute inset-0 dot-pulse"></span>' +
          '</button>' +
          '<a href="profile.html" class="btn flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-primary/10" aria-label="โปรไฟล์ของฉัน">' +
            EF.avatar(u, 'sm') +
            '<span class="hidden sm:inline text-label-md text-on-surface max-w-28 truncate">' + EF.esc(u.displayName) + '</span>' +
          '</a>' +
          (EF.Auth.isAdmin() ? '<a href="admin.html" class="hidden sm:inline text-label-md text-on-surface-variant hover:text-primary px-2">แผงผู้ดูแล</a>' : '') +
          '<button id="btn-header-logout" class="btn hidden sm:inline text-label-md text-on-surface-variant hover:text-error px-2" title="ออกจากระบบ">ออกจากระบบ</button>' +
        '</div>'
      : '<a href="login.html" class="btn bg-primary-container text-on-primary px-4 h-11 rounded-full text-label-md flex items-center hover:opacity-90">เข้าสู่ระบบ</a>';

    el.innerHTML =
      '<header class="glass-strong text-on-surface sticky top-0 z-40 border-x-0 border-t-0">' +
        '<div class="max-w-container mx-auto px-5 h-16 flex items-center justify-between gap-3">' +
          '<a href="index.html" class="flex items-center gap-2 shrink-0">' +
            '<span class="size-8 rounded-lg bg-primary-container flex items-center justify-center font-display font-bold text-on-primary" aria-hidden="true">E</span>' +
            '<span class="font-display text-title-lg text-on-surface">' + EF.esc(siteName) + '</span>' +
          '</a>' +
          '<nav class="hidden md:flex items-center gap-6" aria-label="เมนูหลัก">' + nav + '</nav>' +
          right +
        '</div>' +
        '<div id="announce-bar"></div>' +
      '</header>' +
      // แถบล่างสำหรับจอเล็ก จำกัดไม่เกิน 5 ปุ่มตามหลักการนำทาง
      '<nav class="md:hidden fixed bottom-0 inset-x-0 z-40 glass-strong border-x-0 border-b-0 flex" aria-label="เมนูล่าง">' +
        mobileTab('index.html', 'home', 'หน้าแรก', active === 'browse') +
        mobileTab('index.html?sort=trending', 'local_fire_department', 'มาแรง', active === 'trending') +
        mobileTab('new.html', 'add_circle', 'ตั้งกระทู้', active === 'new') +
        mobileTab(EF.Auth.isLoggedIn() ? 'profile.html' : 'login.html', 'person', EF.Auth.isLoggedIn() ? 'โปรไฟล์' : 'เข้าระบบ', active === 'profile') +
      '</nav>' +
      '<div class="md:hidden h-16" aria-hidden="true"></div>';

    var bell = document.getElementById('btn-bell');
    if (bell) bell.addEventListener('click', openNotifications);
    var hlo = document.getElementById('btn-header-logout');
    if (hlo) hlo.addEventListener('click', function () { if (confirm('ออกจากระบบใช่ไหม')) EF.Auth.logout(); });
    if (u) refreshBell();
  }

  function mobileTab(href, icon, label, on) {
    var color = on ? 'text-secondary' : 'text-on-surface-variant';
    return '<a href="' + href + '" class="flex-1 min-h-[56px] flex flex-col items-center justify-center gap-0.5 ' + color + '">' +
      '<span class="material-symbols-outlined text-[22px]" aria-hidden="true">' + icon + '</span>' +
      '<span class="text-label-sm">' + label + '</span></a>';
  }

  function refreshBell() {
    EF.api.get('me').then(function (r) {
      if (!r.ok || !r.user) return;
      EF.Auth.patch(r.user);
      var dot = document.getElementById('bell-dot');
      if (dot) dot.classList.toggle('hidden', !r.unread);
      if (r.blocked) showBanner(r.blocked, 'warn');
    }).catch(function () {});
  }

  function openNotifications() {
    modal({ title: 'การแจ้งเตือน', body: '<div class="space-y-2">' + skeletonList(2) + '</div>' });
    EF.api.post('notifications', {}).then(function (r) {
      var body = document.getElementById('ef-modal-body');
      if (!body) return;
      if (!r.ok) { body.innerHTML = '<p class="text-body-md text-error">' + EF.esc(r.error) + '</p>'; return; }
      if (!r.notifications.length) {
        body.innerHTML = '<p class="text-body-md text-on-surface-variant text-center py-6">ยังไม่มีการแจ้งเตือน</p>';
        return;
      }
      var icons = { reply: 'chat_bubble', warning: 'warning', moderation: 'gavel', welcome: 'celebration', info: 'info' };
      body.innerHTML =
        '<ul class="flex flex-col gap-2">' + r.notifications.map(function (n) {
          var unread = n.read ? '' : 'bg-secondary-container border-secondary';
          var inner = '<div class="flex gap-3">' +
            '<span class="material-symbols-outlined text-[20px] text-primary-container shrink-0" aria-hidden="true">' + (icons[n.type] || 'info') + '</span>' +
            '<div class="min-w-0"><p class="text-label-md text-on-surface">' + EF.esc(n.title) + '</p>' +
            '<p class="text-body-md text-on-surface-variant">' + EF.esc(n.body) + '</p>' +
            '<p class="text-label-sm text-outline mt-1">' + EF.timeAgo(n.createdAt) + '</p></div></div>';
          return '<li class="border border-outline-variant rounded p-3 ' + unread + '">' +
            (n.link ? '<a href="' + n.link + '" class="block hover:opacity-80">' + inner + '</a>' : inner) + '</li>';
        }).join('') + '</ul>' +
        (r.unread ? '<button id="mark-all" class="btn w-full mt-md py-3 rounded-lg border border-outline-variant text-label-md hover:border-secondary">ทำเครื่องหมายว่าอ่านทั้งหมด</button>' : '');

      var mark = document.getElementById('mark-all');
      if (mark) mark.addEventListener('click', function () {
        EF.api.post('notifications.read', {}).then(function () {
          closeModal();
          var dot = document.getElementById('bell-dot');
          if (dot) dot.classList.add('hidden');
          toast('อ่านการแจ้งเตือนทั้งหมดแล้ว', 'success');
        });
      });
    });
  }

  // ---------- แสดงรูปในโพสต์ ----------
  function imageGallery(urls) {
    if (!urls || !urls.length) return '';
    var n = urls.length;
    var cols = n === 1 ? 'grid-cols-1' : (n === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3');
    return '<div class="grid ' + cols + ' gap-2 mt-3">' + urls.map(function (u, i) {
      return '<button type="button" data-lightbox="' + EF.esc(u) + '" class="btn block rounded-lg overflow-hidden border border-outline-variant aspect-square bg-surface-container">' +
        '<img src="' + EF.esc(u) + '" alt="รูปแนบที่ ' + (i + 1) + '" loading="lazy" class="w-full h-full object-cover hover:scale-105 transition-transform duration-200"></button>';
    }).join('') + '</div>';
  }

  function lightbox(url) {
    var wrap = document.createElement('div');
    wrap.className = 'fixed inset-0 z-[60] flex items-center justify-center p-4 modal-backdrop bg-black/80';
    wrap.innerHTML = '<img src="' + EF.esc(url) + '" alt="รูปขยาย" class="max-w-full max-h-[90vh] rounded-lg modal-panel">' +
      '<button class="btn absolute top-4 right-4 size-11 rounded-full bg-white/15 text-white flex items-center justify-center" aria-label="ปิด"><span class="material-symbols-outlined">close</span></button>';
    wrap.addEventListener('click', function () { wrap.remove(); });
    document.body.appendChild(wrap);
  }

  document.addEventListener('click', function (e) {
    var lb = e.target.closest('[data-lightbox]');
    if (lb) { e.preventDefault(); lightbox(lb.dataset.lightbox); }
  });

  // ---------- เครื่องมือแนบรูป (ใช้ในหน้าตั้งกระทู้และตอบกระทู้) ----------
  // คืน object { getUrls(), reset(), count() } และแสดง UI ในกล่อง target
  function imageUploader(target, max) {
    max = max || 4;
    var urls = [];   // ลิงก์รูปที่อัปเสร็จแล้ว
    target.innerHTML =
      '<div class="flex items-center gap-2 flex-wrap">' +
        '<label class="up-btn btn inline-flex items-center gap-2 px-4 py-2.5 min-h-11 rounded-lg border border-outline-variant text-label-md cursor-pointer hover:border-secondary w-fit">' +
          '<span class="material-symbols-outlined text-[18px]">image</span> แนบรูป' +
          '<input type="file" accept="image/*" multiple class="hidden"></label>' +
        '<span class="up-count text-label-sm text-outline"></span>' +
      '</div>' +
      '<div class="up-grid grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2"></div>';

    var input = target.querySelector('input[type=file]');
    var grid = target.querySelector('.up-grid');
    var countEl = target.querySelector('.up-count');

    function refresh() {
      countEl.textContent = urls.length ? (urls.length + '/' + max + ' รูป') : '';
      target.querySelector('.up-btn').style.display = urls.length >= max ? 'none' : '';
    }

    input.addEventListener('change', function (e) {
      var files = Array.prototype.slice.call(e.target.files || []);
      input.value = '';
      files.forEach(function (file) {
        if (urls.length >= max) { toast('แนบได้สูงสุด ' + max + ' รูป', 'warn'); return; }
        if (!/^image\//.test(file.type)) return;
        if (file.size > 8 * 1024 * 1024) { toast('รูปใหญ่เกิน 8MB', 'warn'); return; }
        addPlaceholder(file);
      });
    });

    function addPlaceholder(file) {
      var slot = document.createElement('div');
      slot.className = 'relative rounded-lg overflow-hidden border border-outline-variant aspect-square bg-surface-container';
      slot.innerHTML = '<div class="skeleton absolute inset-0"></div>';
      grid.appendChild(slot);

      resizeForUpload(file, 1280, function (dataUrl) {
        EF.api.post('uploadImage', { image: dataUrl }).then(function (r) {
          if (!r.ok) { slot.remove(); toast(r.error, 'error'); return; }
          urls.push(r.url);
          slot.innerHTML = '<img src="' + r.url + '" class="w-full h-full object-cover" alt="">' +
            '<button type="button" class="up-remove btn absolute top-1 right-1 size-7 rounded-full bg-black/60 text-white flex items-center justify-center" aria-label="ลบรูป"><span class="material-symbols-outlined text-[16px]">close</span></button>';
          slot.querySelector('.up-remove').addEventListener('click', function () {
            urls = urls.filter(function (x) { return x !== r.url; });
            slot.remove(); refresh();
          });
          refresh();
        }).catch(function (err) { slot.remove(); toast(err.message, 'error'); });
      }, function () { slot.remove(); });
    }

    refresh();
    return { getUrls: function () { return urls.slice(); }, count: function () { return urls.length; }, reset: function () { urls = []; grid.innerHTML = ''; refresh(); } };
  }

  // ย่อรูปก่อนอัป: ด้านยาวไม่เกิน maxSize, JPEG คุณภาพ 0.82
  function resizeForUpload(file, maxSize, cb, onErr) {
    var reader = new FileReader();
    reader.onload = function (ev) {
      var img = new Image();
      img.onload = function () {
        var scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        var w = Math.round(img.width * scale), h = Math.round(img.height * scale);
        var canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        cb(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = function () { toast('เปิดรูปไม่สำเร็จ', 'error'); if (onErr) onErr(); };
      img.src = ev.target.result;
    };
    reader.onerror = function () { if (onErr) onErr(); };
    reader.readAsDataURL(file);
  }

  // ---------- ประกาศจากผู้ดูแล ----------
  function showBanner(text, tone) {
    var bar = document.getElementById('announce-bar');
    if (!bar || !text) return;
    var cls = tone === 'warn' ? 'bg-warning-container text-on-error-container' : 'bg-secondary-container text-on-secondary-container';
    bar.innerHTML = '<div class="' + cls + ' px-5 py-2 text-label-md text-center">' + EF.esc(text) + '</div>';
  }

  function renderFooter() {
    var el = document.getElementById('site-footer');
    if (!el) return;
    var c = window.EDUFORUM_CONFIG || {};
    el.innerHTML =
      '<footer class="border-t border-outline-variant mt-xl bg-surface-container-lowest">' +
        '<div class="max-w-container mx-auto px-5 py-lg flex flex-col sm:flex-row items-center justify-between gap-3 text-label-sm text-on-surface-variant">' +
          '<span>' + EF.esc(c.SITE_NAME || 'EduForum') + ' — ' + EF.esc(c.SCHOOL_NAME || '') + '</span>' +
          '<div class="flex items-center gap-4">' +
            '<button id="btn-theme" class="btn flex items-center gap-1 hover:text-primary" aria-label="สลับโหมดสว่างและมืด">' +
              '<span class="material-symbols-outlined text-[18px]">dark_mode</span> โหมดมืด</button>' +
            '<a href="#" class="hover:text-primary">แนวทางการใช้งาน</a>' +
          '</div>' +
        '</div></footer>';
    var t = document.getElementById('btn-theme');
    if (t) t.addEventListener('click', function () {
      var mode = EF.Theme.toggle();
      toast(mode === 'dark' ? 'เปลี่ยนเป็นโหมดมืดแล้ว' : 'เปลี่ยนเป็นโหมดสว่างแล้ว');
    });
  }

  /** โหลดค่าตั้งค่าเว็บครั้งเดียวแล้วแชร์ให้ทุกส่วน */
  function bootstrap() {
    if (bootstrapCache) return Promise.resolve(bootstrapCache);
    return EF.api.get('bootstrap').then(function (r) {
      if (r.ok && r.config) {
        window.EDUFORUM_CONFIG.SITE_NAME = r.config.siteName || 'EduForum';
        window.EDUFORUM_CONFIG.SCHOOL_NAME = r.config.schoolName || '';
        if (r.config.announcement) showBanner(r.config.announcement, r.config.announcementTone);
      }
      bootstrapCache = r;
      return r;
    });
  }

  window.UI = {
    toast: toast, modal: modal, closeModal: closeModal,
    reveal: reveal, skeletonList: skeletonList,
    threadCard: threadCard, emptyState: emptyState,
    reportDialog: reportDialog, readProgress: readProgress,
    imageGallery: imageGallery, imageUploader: imageUploader, lightbox: lightbox,
    renderHeader: renderHeader, renderFooter: renderFooter,
    bootstrap: bootstrap, showBanner: showBanner, refreshBell: refreshBell
  };
})();
